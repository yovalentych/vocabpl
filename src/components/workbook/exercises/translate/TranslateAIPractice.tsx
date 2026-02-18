// @ts-nocheck
"use client";

import { useState, useEffect } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { CheckCircle, Circle, Sparkle } from "@phosphor-icons/react";
import { safeParseAIResponse } from "@/lib/workbook";
import TranslateResults from "./TranslateResults";

interface Sentence {
  id: string;
  source: string;
  reference: string;
  userTranslation: string;
}

interface TranslateAIPracticeProps {
  config: {
    topic: string;
    direction: "uk_to_pl" | "pl_to_uk";
    level: "A1" | "A2" | "B1" | "B2";
    count: number;
  };
  onComplete: () => void;
}

export default function TranslateAIPractice({ config, onComplete }: TranslateAIPracticeProps) {
  const { locale } = useLocale();
  const [sentences, setSentences] = useState<Sentence[]>([]);
  const [isGenerating, setIsGenerating] = useState(true);
  const [isChecking, setIsChecking] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [checkResult, setCheckResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Generate sentences with AI
  useEffect(() => {
    let cancelled = false;

    async function generateSentences() {
      try {
        setError(null);
        const res = await fetch("/api/ai/run", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode: "translate_generate",
            userInput: JSON.stringify({
              topic: config.topic,
              direction: config.direction,
              level: config.level,
              count: config.count
            }),
            context: JSON.stringify({ uiLanguage: locale })
          })
        });

        if (cancelled) return;

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          const errorCode = data?.code;
          const message =
            errorCode === "ai_quota"
              ? "Ліміт AI кредитів вичерпано"
              : errorCode === "pvs_unavailable"
                ? "Потрібен AI план"
                : data?.error || "Помилка AI";
          setError(message);
          setIsGenerating(false);
          return;
        }

        // Parse AI response
        const result = safeParseAIResponse(data?.text);

        if (!result || !result.task?.items || result.task.items.length === 0) {
          setError("AI не змогла згенерувати речення. Спробуйте іншу тему.");
          setIsGenerating(false);
          return;
        }

        const generatedSentences: Sentence[] = result.task.items
          .filter((item: any) => item?.source)
          .map((item: any, idx: number) => ({
            id: item.id || `ai-${idx}`,
            source: item.source,
            reference: "",
            userTranslation: ""
          }));

        if (!cancelled) {
          setSentences(generatedSentences);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Failed to generate sentences:", err);
          setError("Помилка мережі");
        }
      } finally {
        if (!cancelled) setIsGenerating(false);
      }
    }

    generateSentences();
    return () => { cancelled = true; };
  }, [config.topic, config.direction, config.level, config.count, locale]);

  const updateTranslation = (id: string, value: string) => {
    setSentences((prev) =>
      prev.map((sent) =>
        sent.id === id ? { ...sent, userTranslation: value } : sent
      )
    );
  };

  const completedCount = sentences.filter((s) => s.userTranslation.trim()).length;

  const handleCheckWithAI = async () => {
    if (completedCount === 0) {
      setError("Перекладіть хоча б одне речення перед перевіркою");
      return;
    }

    setIsChecking(true);
    setError(null);

    try {
      // Prepare items for checking
      const items = sentences
        .filter((s) => s.userTranslation.trim())
        .map((sent) => ({
          source: sent.source,
          reference: sent.reference,
          userTranslation: sent.userTranslation.trim()
        }));

      const payload = {
        exerciseType: "translate",
        direction: config.direction,
        items
      };

      const res = await fetch("/api/ai/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "translate_check",
          userInput: JSON.stringify(payload),
          context: JSON.stringify({ uiLanguage: locale })
        })
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const errorCode = data?.code;
        const message =
          errorCode === "ai_quota"
            ? "Ліміт AI кредитів вичерпано"
            : errorCode === "pvs_unavailable"
              ? "Потрібен AI план"
              : data?.error || "Помилка AI";
        setError(message);
        setIsChecking(false);
        return;
      }

      // Parse result
      const result = safeParseAIResponse(data?.text);

      if (!result || !result.items) {
        setError("AI повернула неправильний формат відповіді. Спробуйте ще раз.");
        setIsChecking(false);
        return;
      }

      setCheckResult(result);

      // Save points to database if we have a valid score
      if (result?.overall?.points) {
        try {
          await fetch("/api/exercises/attempt", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              exercise: "translate",
              points: result.overall.points,
              xp: result.overall.xp || 0
            })
          });
        } catch (err) {
          console.error("Failed to save points:", err);
        }
      }

      // Show results modal
      setShowResults(true);
    } catch (err) {
      console.error("Failed to check with AI:", err);
      setError("Помилка мережі");
    } finally {
      setIsChecking(false);
    }
  };

  if (isGenerating) {
    return (
      <div className="rounded-3xl border border-ink/10 bg-paper/80 p-8 shadow-soft text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Sparkle size={24} weight="fill" className="text-gold animate-pulse" />
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold/20 border-t-gold" />
        </div>
        <p className="text-sm font-semibold text-ink mb-2">AI генерує речення...</p>
        <p className="text-xs text-ink/60">
          Тема: <span className="font-medium">{config.topic}</span> · Рівень: <span className="font-medium">{config.level}</span>
        </p>
      </div>
    );
  }

  if (error && sentences.length === 0) {
    return (
      <div className="rounded-3xl border border-terracotta/20 bg-terracotta/5 p-8 shadow-soft text-center">
        <p className="text-sm font-semibold text-terracotta mb-2">Помилка</p>
        <p className="text-sm text-ink/70">{error}</p>
        <button
          onClick={onComplete}
          className="mt-4 inline-flex items-center gap-2 rounded-full border border-ink/20 px-4 py-2 text-xs font-semibold text-ink transition hover:bg-ink/5"
        >
          Спробувати знову
        </button>
      </div>
    );
  }

  if (sentences.length === 0) {
    return (
      <div className="rounded-3xl border border-ink/10 bg-paper/80 p-8 shadow-soft text-center">
        <p className="text-sm text-ink/60">
          Речення не згенеровано. Спробуйте ще раз.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="rounded-3xl border border-gold/20 bg-gold/5 p-6 shadow-soft">
          <div className="flex items-center gap-2 mb-2">
            <Sparkle size={16} weight="fill" className="text-gold" />
            <p className="text-xs uppercase tracking-[0.3em] text-gold/70">
              Крок 2: AI Практика
            </p>
          </div>
          <h2 className="text-2xl font-semibold text-ink">
            Переклад речень
          </h2>
          <p className="mt-2 text-sm text-ink/60">
            Тема: {config.topic} · {config.direction === "uk_to_pl" ? "Українська \u2192 Польська" : "Польська \u2192 Українська"} · {config.level}
          </p>
        </div>

        {/* Progress */}
        <div className="rounded-3xl border border-ink/10 bg-paper/80 p-4 shadow-soft">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs uppercase tracking-[0.3em] text-ink/40">Прогрес</p>
            <p className="text-sm font-semibold text-ink">
              {completedCount} / {sentences.length}
            </p>
          </div>
          <div className="h-2 rounded-full bg-ink/10 overflow-hidden">
            <div
              className="h-full bg-gold transition-all"
              style={{ width: `${(completedCount / sentences.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Sentences */}
        <div className="space-y-4">
          {sentences.map((sentence, index) => {
            const isCompleted = sentence.userTranslation.trim().length > 0;

            return (
              <div
                key={sentence.id}
                className="rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-full border border-ink/20 bg-fog">
                    <span className="text-xs font-semibold text-ink">{index + 1}</span>
                  </div>

                  <div className="flex-1 space-y-4">
                    {/* Source sentence */}
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-ink/40 mb-2">
                        {config.direction === "uk_to_pl" ? "Українська" : "Польська"}
                      </p>
                      <p className="text-base font-medium text-ink">{sentence.source}</p>
                    </div>

                    {/* Translation input */}
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-ink/40 mb-2">
                        {config.direction === "uk_to_pl" ? "Польська" : "Українська"}
                      </p>
                      <textarea
                        value={sentence.userTranslation}
                        onChange={(e) => updateTranslation(sentence.id, e.target.value)}
                        placeholder={
                          config.direction === "uk_to_pl"
                            ? "Введіть переклад польською..."
                            : "Введіть переклад українською..."
                        }
                        rows={2}
                        maxLength={500}
                        className="w-full rounded-2xl border border-ink/20 bg-paper px-4 py-3 text-sm text-ink placeholder:text-ink/40 focus:border-gold/40 focus:outline-none focus:ring-0"
                      />
                    </div>
                  </div>

                  {/* Status indicator */}
                  <div className="flex-shrink-0">
                    {isCompleted ? (
                      <CheckCircle size={20} weight="fill" className="text-moss" />
                    ) : (
                      <Circle size={20} className="text-ink/20" />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Error message */}
        {error && (
          <div className="rounded-2xl border border-terracotta/20 bg-terracotta/5 p-4 text-sm text-terracotta">
            {error}
          </div>
        )}

        {/* Submit button */}
        <div className="flex justify-center">
          <button
            onClick={handleCheckWithAI}
            disabled={isChecking || completedCount === 0}
            className="inline-flex items-center gap-2 rounded-full bg-gold px-8 py-3 text-sm font-semibold text-paper transition hover:bg-gold/90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isChecking ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-paper/20 border-t-paper" />
                <span>Перевірка AI...</span>
              </>
            ) : (
              <>
                <Sparkle size={18} weight="fill" />
                <span>Перевірити з AI</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Results Modal */}
      {showResults && checkResult && (
        <TranslateResults
          results={{
            mode: "ai",
            total: sentences.length,
            completed: completedCount,
            accuracy: checkResult.overall?.accuracy || 0,
            score: checkResult.overall?.points || 0,
            direction: config.direction,
            level: config.level,
            aiCheck: checkResult,
            topic: config.topic
          }}
          onClose={() => {
            setShowResults(false);
            onComplete();
          }}
        />
      )}
    </>
  );
}
