// @ts-nocheck
"use client";

import { useState, useEffect } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { CheckCircle, Circle, Sparkle } from "@phosphor-icons/react";
import { safeParseAIResponse } from "@/lib/workbook";
import { calculatePoints } from "@/lib/scoring";
import ClozeResults from "./ClozeResults";

interface ClozeAIPracticeProps {
  config: {
    topic: string;
    level: "A1" | "A2" | "B1" | "B2";
    sentenceCount: number;
  };
  onComplete: () => void;
}

export default function ClozeAIPractice({ config, onComplete }: ClozeAIPracticeProps) {
  const { t, locale } = useLocale();
  const [task, setTask] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<string, Record<number, string>>>({});
  const [isGenerating, setIsGenerating] = useState(true);
  const [isChecking, setIsChecking] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [checkResult, setCheckResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Generate exercise with AI
  useEffect(() => {
    let cancelled = false;

    async function generateExercise() {
      try {
        setError(null);
        const res = await fetch("/api/ai/run", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode: "cloze_generate",
            userInput: JSON.stringify({
              topic: config.topic,
              level: config.level,
              count: config.sentenceCount
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

        if (!result || !result.task || !result.task.items || result.task.items.length === 0) {
          setError("AI не змогла згенерувати вправу. Спробуйте іншу тему.");
          setIsGenerating(false);
          return;
        }

        if (!cancelled) {
          setTask(result.task);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Failed to generate exercise:", err);
          setError("Помилка мережі");
        }
      } finally {
        if (!cancelled) setIsGenerating(false);
      }
    }

    generateExercise();
    return () => { cancelled = true; };
  }, [config.topic, config.level, config.sentenceCount, locale]);

  const updateAnswer = (itemId: string, gapIndex: number, value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [itemId]: {
        ...(prev[itemId] || {}),
        [gapIndex]: value
      }
    }));
  };

  const handleCheckWithAI = async () => {
    if (!task) return;

    // Prepare answers for checking
    const itemsWithAnswers = task.items.map((item: any) => ({
      id: item.id,
      text: item.text,
      gaps: (item.gaps || []).map((gap: any, idx: number) => ({
        ...gap,
        userAnswer: answers[item.id]?.[idx] || ""
      }))
    }));

    setIsChecking(true);
    setError(null);

    try {
      const res = await fetch("/api/ai/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "cloze_check",
          userInput: JSON.stringify({
            exerciseType: "cloze",
            level: config.level,
            items: itemsWithAnswers
          }),
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

      // Save points if available
      if (result?.overall?.score01 != null) {
        try {
          await fetch("/api/exercises/attempt", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              exercise: "cloze",
              points: calculatePoints({ score01: result.overall.score01, level: config.level, itemCount: task.items.length, exercise: "cloze" })
            })
          });
        } catch (err) {
          console.error("Failed to save points:", err);
        }
      }

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
          <Sparkle size={24} weight="fill" className="text-moss animate-pulse" />
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-moss/20 border-t-moss" />
        </div>
        <p className="text-sm font-semibold text-ink mb-2">AI генерує вправу...</p>
        <p className="text-xs text-ink/60">
          Тема: <span className="font-medium">{config.topic}</span> · Рівень: <span className="font-medium">{config.level}</span>
        </p>
      </div>
    );
  }

  if (error && !task) {
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

  if (!task) return null;

  // Count filled gaps
  const totalGaps = task.items.reduce((sum: number, item: any) => sum + (item.gaps || []).length, 0);
  const filledGaps = Object.values(answers).reduce(
    (sum: number, itemAnswers: any) => sum + Object.values(itemAnswers).filter((a: any) => a.trim()).length,
    0
  );

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="rounded-3xl border border-moss/20 bg-moss/5 p-6 shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Sparkle size={16} weight="fill" className="text-moss" />
                <p className="text-xs uppercase tracking-[0.3em] text-moss/70">
                  AI режим
                </p>
              </div>
              <h2 className="text-xl font-semibold text-ink">{task.title}</h2>
              <p className="mt-1 text-sm text-ink/60">
                {config.topic} · {config.level} · {task.items.length} речень
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-moss">{filledGaps}/{totalGaps}</div>
              <div className="text-xs text-ink/50">заповнено</div>
            </div>
          </div>
        </div>

        {/* Exercise items */}
        <div className="space-y-4">
          {task.items.map((item: any, itemIndex: number) => (
            <div
              key={item.id || itemIndex}
              className="rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-fog text-xs font-semibold text-ink">
                  {itemIndex + 1}
                </div>
                <div className="flex-1 space-y-3">
                  {/* Sentence with gaps */}
                  <div className="flex flex-wrap items-center gap-2 text-base text-ink">
                    {(() => {
                      const parts = item.text.split("___");
                      return parts.map((part: string, partIndex: number) => (
                        <span key={partIndex}>
                          {part}
                          {partIndex < parts.length - 1 && (
                            <input
                              type="text"
                              value={answers[item.id]?.[partIndex] || ""}
                              onChange={(e) => updateAnswer(item.id, partIndex, e.target.value)}
                              placeholder="..."
                              maxLength={100}
                              className="inline-block min-w-[120px] mx-1 rounded-xl border border-ink/20 bg-paper px-3 py-1.5 text-sm text-ink placeholder:text-ink/30 focus:border-moss/40 focus:outline-none"
                            />
                          )}
                        </span>
                      ));
                    })()}
                  </div>

                  {/* Hints */}
                  {(item.gaps || []).map((gap: any, gapIndex: number) => (
                    <div key={gapIndex} className="rounded-xl border border-moss/20 bg-moss/5 px-3 py-2">
                      <p className="text-xs text-ink/70">
                        <span className="font-semibold text-moss">Підказка {gapIndex + 1}:</span> {gap.hint}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Error message */}
        {error && (
          <div className="rounded-2xl border border-terracotta/20 bg-terracotta/5 p-4 text-sm text-terracotta">
            {error}
          </div>
        )}

        {/* Submit button */}
        <div className="flex items-center justify-between gap-4">
          <div className="text-sm text-ink/60">
            Заповнено: {filledGaps} з {totalGaps}
          </div>
          <button
            onClick={handleCheckWithAI}
            disabled={isChecking || filledGaps === 0}
            className="inline-flex items-center gap-2 rounded-full bg-moss px-6 py-3 text-sm font-semibold text-paper transition hover:bg-moss/90 disabled:cursor-not-allowed disabled:opacity-40"
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
        <ClozeResults
          results={{
            mode: "ai",
            totalGaps,
            aiCheck: checkResult,
            topic: config.topic,
            level: config.level
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
