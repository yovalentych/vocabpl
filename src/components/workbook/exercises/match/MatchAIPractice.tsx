// @ts-nocheck
"use client";

import { useState, useEffect } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { CheckCircle, Circle, Sparkle } from "@phosphor-icons/react";
import { safeParseAIResponse } from "@/lib/workbook";
import { calculatePoints } from "@/lib/scoring";
import MatchResults from "./MatchResults";

interface MatchAIPracticeProps {
  config: {
    topic: string;
    pairType: "translation" | "semantic" | "definition";
    level: "A1" | "A2" | "B1" | "B2";
    pairCount: number;
  };
  onComplete: () => void;
}

export default function MatchAIPractice({ config, onComplete }: MatchAIPracticeProps) {
  const { t, locale } = useLocale();
  const [task, setTask] = useState<any>(null);
  const [matches, setMatches] = useState<Record<string, string>>({});
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(true);
  const [isChecking, setIsChecking] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [checkResult, setCheckResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Shuffle array helper
  const shuffleArray = (array: any[]) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

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
            mode: "match_generate",
            userInput: JSON.stringify({
              topic: config.topic,
              pairType: config.pairType,
              level: config.level,
              count: config.pairCount
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

        if (!result || !result.task || !result.task.pairs || result.task.pairs.length === 0) {
          setError("AI не змогла згенерувати вправу. Спробуйте іншу тему.");
          setIsGenerating(false);
          return;
        }

        const normalizedPairs = (result.task.pairs || []).map((p: any, idx: number) => ({
          ...p,
          id: p.id ? String(p.id) : `pair_${idx + 1}`
        }));

        // Shuffle right items for display
        const shuffledTask = {
          ...result.task,
          pairs: normalizedPairs,
          rightItemsShuffled: shuffleArray(normalizedPairs.map((p: any) => ({
            id: p.id,
            text: p.right
          })))
        };

        if (!cancelled) {
          setTask(shuffledTask);
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
  }, [config.topic, config.pairType, config.level, config.pairCount, locale]);

  const handleLeftClick = (leftId: string) => {
    if (selectedLeft === leftId) {
      setSelectedLeft(null);
    } else {
      setSelectedLeft(leftId);
    }
  };

  const handleRightClick = (rightId: string) => {
    if (!selectedLeft) return;

    // Create or update match
    setMatches((prev) => ({
      ...prev,
      [selectedLeft]: rightId
    }));

    setSelectedLeft(null);
  };

  const isRightMatched = (rightId: string) => {
    return Object.values(matches).includes(rightId);
  };

  const handleCheckWithAI = async () => {
    if (!task) return;

    // Prepare matches for checking
    const userMatches = Object.keys(matches).map((leftId) => ({
      leftId,
      rightId: matches[leftId]
    }));

    setIsChecking(true);
    setError(null);

    try {
      const res = await fetch("/api/ai/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "match_check",
          userInput: JSON.stringify({
            exerciseType: "match",
            pairType: config.pairType,
            level: config.level,
            pairs: task.pairs,
            userMatches
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

      if (!result || !result.pairs) {
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
              exercise: "match",
              points: calculatePoints({ score01: result.overall.score01, level: config.level, itemCount: task.pairs.length, exercise: "match" })
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
          {t.common.retry}
        </button>
      </div>
    );
  }

  if (!task) return null;

  const matchedCount = Object.keys(matches).length;

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
                {config.topic} · {config.level} · {task.pairs.length} пар
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-moss">{matchedCount}/{task.pairs.length}</div>
              <div className="text-xs text-ink/50">з&apos;єднано</div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="rounded-2xl border border-moss/20 bg-moss/5 p-4">
          <p className="text-xs text-ink/70">
            <span className="font-semibold text-moss">Інструкція:</span> Натисніть на елемент зліва,
            потім натисніть відповідний елемент справа, щоб створити пару.
          </p>
        </div>

        {/* Matching area */}
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
          {/* Left column */}
          <div className="rounded-3xl border border-ink/10 bg-paper/80 p-4 shadow-soft">
            <p className="text-xs uppercase tracking-[0.3em] text-ink/40 mb-4">
              Ліва колонка
            </p>
            <div className="space-y-2">
              {task.pairs.map((pair: any) => {
                const isSelected = selectedLeft === pair.id;
                const isMatched = matches[pair.id];

                return (
                  <button
                    key={pair.id}
                    onClick={() => handleLeftClick(pair.id)}
                    className={`w-full rounded-2xl border p-4 text-left transition ${
                      isSelected
                        ? "border-moss bg-moss/10"
                        : isMatched
                        ? "border-moss/40 bg-moss/5"
                        : "border-ink/20 hover:bg-ink/5"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0">
                        {isMatched ? (
                          <CheckCircle size={20} weight="fill" className="text-moss" />
                        ) : isSelected ? (
                          <Circle size={20} weight="fill" className="text-moss" />
                        ) : (
                          <Circle size={20} className="text-ink/30" />
                        )}
                      </div>
                      <p className="text-sm font-medium text-ink">{pair.left}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right column */}
          <div className="rounded-3xl border border-ink/10 bg-paper/80 p-4 shadow-soft">
            <p className="text-xs uppercase tracking-[0.3em] text-ink/40 mb-4">
              Права колонка
            </p>
            <div className="space-y-2">
              {task.rightItemsShuffled.map((item: any) => {
                const isMatched = isRightMatched(item.id);

                return (
                  <button
                    key={item.id}
                    onClick={() => handleRightClick(item.id)}
                    className={`w-full rounded-2xl border p-4 text-left transition ${
                      isMatched
                        ? "border-moss/40 bg-moss/5"
                        : selectedLeft
                        ? "border-ink/20 hover:bg-moss/5 hover:border-moss/40"
                        : "border-ink/20 hover:bg-ink/5"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0">
                        {isMatched ? (
                          <CheckCircle size={20} weight="fill" className="text-moss" />
                        ) : (
                          <Circle size={20} className="text-ink/30" />
                        )}
                      </div>
                      <p className="text-sm font-medium text-ink">{item.text}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
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
            З&apos;єднано: {matchedCount} з {task.pairs.length}
          </div>
          <button
            onClick={handleCheckWithAI}
            disabled={isChecking || matchedCount === 0}
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
        <MatchResults
          results={{
            mode: "ai",
            totalPairs: task.pairs.length,
            aiCheck: checkResult,
            topic: config.topic,
            level: config.level,
            pairType: config.pairType
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
