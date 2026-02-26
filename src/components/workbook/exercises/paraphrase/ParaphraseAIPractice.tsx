// @ts-nocheck
"use client";

import { useState, useEffect } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { CheckCircle, Circle, Sparkle } from "@phosphor-icons/react";
import { safeParseAIResponse } from "@/lib/workbook";
import { calculatePoints } from "@/lib/scoring";
import ParaphraseResults from "./ParaphraseResults";

interface Sentence {
  id: string;
  original: string;
  paraphrase: string;
}

interface ParaphraseAIPracticeProps {
  config: {
    topic: string;
    level: "A1" | "A2" | "B1" | "B2";
    count: number;
  };
  onComplete: () => void;
}

export default function ParaphraseAIPractice({ config, onComplete }: ParaphraseAIPracticeProps) {
  const { t, locale } = useLocale();
  const [sentences, setSentences] = useState<Sentence[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
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
            mode: "paraphrase_generate",
            userInput: JSON.stringify({
              topic: config.topic,
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
              ? t.workbook.classicAiQuotaError
              : errorCode === "pvs_unavailable"
                ? t.workbook.classicAiPlanRequired
                : data?.error || t.workbook.classicAiError;
          if (!cancelled) setError(message);
          if (!cancelled) setIsGenerating(false);
          return;
        }

        const result = safeParseAIResponse(data?.text);

        if (!result || !result.task?.items || result.task.items.length === 0) {
          if (!cancelled) setError(t.workbook.paraphraseAINoSentences);
          if (!cancelled) setIsGenerating(false);
          return;
        }

        const generatedSentences: Sentence[] = (result.task.items || []).map((item: any, idx: number) => ({
          id: item.id || `ai-${idx}`,
          original: item.sourcePl,
          paraphrase: ""
        }));

        if (!cancelled) {
          setSentences(generatedSentences);
          setActiveId(generatedSentences[0]?.id || null);
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to generate sentences:", error);
          setError(t.dict.networkError);
        }
      } finally {
        if (!cancelled) setIsGenerating(false);
      }
    }

    generateSentences();
    return () => { cancelled = true; };
  }, [config.topic, config.level, config.count, locale]);

  const activeSentence = sentences.find((s) => s.id === activeId);
  const activeIndex = sentences.findIndex((s) => s.id === activeId);

  const updateParaphrase = (sentenceId: string, value: string) => {
    setSentences((prev) =>
      prev.map((sentence) =>
        sentence.id === sentenceId
          ? { ...sentence, paraphrase: value }
          : sentence
      )
    );
  };

  const completedCount = sentences.filter((s) => s.paraphrase.trim()).length;

  const handleCheckWithAI = async () => {
    // Check if we have any paraphrases
    if (completedCount === 0) {
      setError(t.workbook.paraphraseAIWriteAtLeastOne);
      return;
    }

    setIsChecking(true);
    setError(null);

    try {
      // Prepare items for checking
      const items = sentences
        .filter((s) => s.paraphrase.trim())
        .map((sentence) => ({
          original: sentence.original,
          paraphrase: sentence.paraphrase.trim()
        }));

      const payload = {
        exerciseType: "paraphrase",
        action: "check",
        items
      };

      const res = await fetch("/api/ai/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "paraphrase_check",
          userInput: JSON.stringify(payload),
          context: JSON.stringify({ uiLanguage: locale })
        })
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const errorCode = data?.code;
        const message =
          errorCode === "ai_quota"
            ? t.workbook.classicAiQuotaError
            : errorCode === "pvs_unavailable"
              ? t.workbook.classicAiPlanRequired
              : data?.error || t.workbook.classicAiError;
        setError(message);
        setIsChecking(false);
        return;
      }

      // Parse result
      const result = safeParseAIResponse(data?.text);
      if (!result) {
        setError(t.workbook.paraphraseAIInvalidFormat);
        setIsChecking(false);
        return;
      }
      setCheckResult(result);

      // Save points to database if we have a valid score
      if (result?.overall?.score01 != null) {
        try {
          await fetch("/api/exercises/attempt", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              exercise: "paraphrase",
              points: calculatePoints({ score01: result.overall.score01, level: config.level, itemCount: config.count, exercise: "paraphrase" })
            })
          });
        } catch (error) {
          console.error("Failed to save points:", error);
        }
      }

      // Show results modal
      setShowResults(true);
    } catch (error) {
      console.error("Failed to check with AI:", error);
      setError(t.dict.networkError);
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
        <p className="text-sm font-semibold text-ink mb-2">{t.workbook.paraphraseAIGenerating}</p>
        <p className="text-xs text-ink/60">
          {t.workbook.paraphraseAIGeneratingHint.replace("{topic}", config.topic).replace("{level}", config.level)}
        </p>
      </div>
    );
  }

  if (error && sentences.length === 0) {
    return (
      <div className="rounded-3xl border border-terracotta/20 bg-terracotta/5 p-8 shadow-soft text-center">
        <p className="text-sm font-semibold text-terracotta mb-2">{t.workbook.paraphraseAIError}</p>
        <p className="text-sm text-ink/70">{error}</p>
        <button
          onClick={onComplete}
          className="mt-4 inline-flex items-center gap-2 rounded-full border border-ink/20 px-4 py-2 text-xs font-semibold text-ink transition hover:bg-ink/5"
        >
          {t.common.retry}
        </button>
      </div>
    );
  }

  if (!activeSentence) {
    return (
      <div className="rounded-3xl border border-ink/10 bg-paper/80 p-8 shadow-soft text-center">
        <p className="text-sm text-ink/60">
          {t.workbook.paraphraseAINotGenerated}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        {/* Left sidebar - sentence list */}
        <div className="rounded-3xl border border-ink/10 bg-paper/80 p-4 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs uppercase tracking-[0.3em] text-ink/40">
              {t.workbook.paraphraseAISentences}
            </p>
            <div className="text-xs text-ink/50">
              {activeIndex + 1} / {sentences.length}
            </div>
          </div>

          <div className="space-y-2">
            {sentences.map((sentence, idx) => {
              const isActive = sentence.id === activeId;
              const isCompleted = sentence.paraphrase.trim().length > 0;

              return (
                <button
                  key={sentence.id}
                  onClick={() => setActiveId(sentence.id)}
                  className={`w-full rounded-2xl border p-3 text-left transition ${
                    isActive
                      ? "border-moss bg-moss/5"
                      : "border-ink/10 hover:border-ink/30 hover:bg-paper"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-ink/50 mb-1">{t.workbook.paraphraseAISentenceN.replace("{n}", String(idx + 1))}</p>
                      <p className="text-sm text-ink/80 truncate">
                        {sentence.original}
                      </p>
                    </div>

                    {/* Status indicator */}
                    <div className="flex-shrink-0">
                      {isCompleted ? (
                        <CheckCircle size={18} weight="fill" className="text-moss" />
                      ) : (
                        <Circle size={18} className="text-ink/20" />
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Stats */}
          <div className="mt-4 rounded-2xl border border-ink/10 bg-fog p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs uppercase tracking-[0.2em] text-ink/40">
                {t.workbook.paraphraseAIProgress}
              </span>
              <span className="text-sm font-bold text-moss">
                {completedCount} / {sentences.length}
              </span>
            </div>
            <div className="h-2 rounded-full bg-ink/10 overflow-hidden">
              <div
                className="h-full bg-moss transition-all"
                style={{ width: `${(completedCount / sentences.length) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Right panel - paraphrase input */}
        <div className="space-y-6">
          {/* Theme badge */}
          <div className="rounded-2xl border border-moss/20 bg-moss/5 px-4 py-2 inline-flex items-center gap-2">
            <Sparkle size={16} weight="fill" className="text-moss" />
            <span className="text-xs font-semibold text-moss">
              {t.workbook.paraphraseAITopicAndLevel.replace("{topic}", config.topic).replace("{level}", config.level)}
            </span>
          </div>

          {/* Original sentence */}
          <div className="rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft">
            <p className="text-xs uppercase tracking-[0.3em] text-ink/40 mb-4">
              {t.workbook.paraphraseAIOriginal}
            </p>
            <p className="text-lg text-ink leading-relaxed">
              {activeSentence.original}
            </p>
          </div>

          {/* Paraphrase input */}
          <div className="rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft">
            <p className="text-xs uppercase tracking-[0.3em] text-ink/40 mb-4">
              {t.workbook.paraphraseAIYours}
            </p>

            <textarea
              value={activeSentence.paraphrase}
              onChange={(e) => updateParaphrase(activeSentence.id, e.target.value)}
              placeholder={t.workbook.paraphraseAIPlaceholder}
              rows={5}
              maxLength={500}
              className="w-full rounded-2xl border border-ink/20 bg-paper px-4 py-3 text-sm text-ink placeholder:text-ink/40 focus:border-moss/40 focus:outline-none focus:ring-0"
            />

            <p className="mt-2 text-xs text-ink/50">
              {t.workbook.paraphraseAIHint}
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="rounded-2xl border border-terracotta/20 bg-terracotta/5 p-4 text-sm text-terracotta">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleCheckWithAI}
              disabled={isChecking || completedCount === 0}
              className="inline-flex items-center gap-2 rounded-full bg-moss px-6 py-3 text-sm font-semibold text-paper transition hover:bg-moss/90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isChecking ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-paper/20 border-t-paper" />
                  <span>{t.workbook.paraphraseAICheckingAI}</span>
                </>
              ) : (
                <>
                  <Sparkle size={18} weight="fill" />
                  <span>{t.workbook.paraphraseAICheckWithAI}</span>
                </>
              )}
            </button>

            <button
              onClick={() => {
                const currentIndex = sentences.findIndex((s) => s.id === activeId);
                const nextSentence = sentences[currentIndex + 1];
                if (nextSentence) {
                  setActiveId(nextSentence.id);
                }
              }}
              disabled={activeIndex === sentences.length - 1}
              className="inline-flex items-center gap-2 rounded-full border border-ink/20 px-6 py-3 text-sm font-semibold text-ink transition hover:bg-ink/5 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <span>{t.workbook.paraphraseAINextSentence}</span>
              <span>→</span>
            </button>
          </div>
        </div>
      </div>

      {/* Results Modal */}
      {showResults && checkResult && (
        <ParaphraseResults
          results={{
            mode: "ai",
            totalSentences: sentences.length,
            completedSentences: completedCount,
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
