// @ts-nocheck
"use client";

import { Circle, X, Trophy, Sparkle, CheckCircle } from "@phosphor-icons/react";
import VocabSuggestions from "../../shared/VocabSuggestions";

const VERDICT_STYLES = {
  ok: { icon: "text-moss", label: "Правильно" },
  weak: { icon: "text-gold", label: "Частково" },
  bad: { icon: "text-terracotta", label: "Неправильно" },
};

interface ClozeResultsProps {
  results: {
    mode: "classic" | "ai";
    totalGaps: number;
    correctCount?: number;
    score?: number;
    aiCheck?: any;
    topic?: string;
    level?: string;
  };
  onClose: () => void;
}

export default function ClozeResults({ results, onClose }: ClozeResultsProps) {
  const { mode, totalGaps, correctCount, score, aiCheck, topic, level } = results;
  const suggested = (aiCheck?.suggestedVocab || [])
    .map((item: any) => ({
      pl: String(item.lemma || item.pl || "").trim(),
      uk: String(item.meaning || item.meaningUk || item.translation || item.uk || "").trim()
    }))
    .filter((item: any) => item.pl && item.uk);

  const addSuggestedWord = async (pl: string, uk: string) => {
    const res = await fetch("/api/user/words/custom", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pl, uk })
    });
    if (res.status === 409) return;
    if (!res.ok) {
      throw new Error("Failed to add word");
    }
  };

  const addAllSuggested = async () => {
    await Promise.all(
      suggested.map((item: any) => addSuggestedWord(item.pl, item.uk))
    );
  };

  const displayScore = mode === "classic" && score !== undefined
    ? score
    : aiCheck?.overall?.score01;

  const displayCorrect = mode === "classic" && correctCount !== undefined
    ? correctCount
    : aiCheck?.items?.reduce((sum: number, item: any) => {
        return sum + (item.gaps || []).filter((g: any) => g.verdict === "ok").length;
      }, 0);

  const scorePercent = displayScore != null ? Math.round(displayScore * 100) : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 px-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-ink/10 bg-paper shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-ink/10 bg-paper p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gold/10">
              <Trophy size={24} weight="fill" className="text-gold" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-ink">Вправу завершено!</h3>
              <p className="mt-1 text-sm text-ink/60">
                {mode === "classic" ? "Класичний режим" : "Режим з AI"}
                {topic && ` · ${topic}`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-ink/20 transition hover:bg-ink/5"
          >
            <X size={20} weight="bold" className="text-ink/60" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Stats */}
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
            <div className="rounded-2xl border border-ink/10 bg-fog p-4 text-center">
              <div className="text-2xl font-bold text-gold">{totalGaps}</div>
              <div className="mt-1 text-xs text-ink/60">Пропусків загалом</div>
            </div>
            <div className="rounded-2xl border border-ink/10 bg-fog p-4 text-center">
              <div className="text-2xl font-bold text-moss">{displayCorrect || 0}</div>
              <div className="mt-1 text-xs text-ink/60">Правильних відповідей</div>
            </div>
            <div className="rounded-2xl border border-ink/10 bg-fog p-4 text-center">
              <div className="text-2xl font-bold text-terracotta">
                {scorePercent !== null ? `${scorePercent}%` : "\u2014"}
              </div>
              <div className="mt-1 text-xs text-ink/60">Точність</div>
            </div>
          </div>

          {/* Motivational message for low scores */}
          {scorePercent !== null && scorePercent < 30 && (
            <div className="rounded-2xl border border-gold/20 bg-gold/5 p-4 text-center">
              <p className="text-sm text-ink/70">
                Не зупиняйтесь! Навіть перші спроби цінні для навчання. Спробуйте ще раз!
              </p>
            </div>
          )}

          {/* AI Feedback */}
          {mode === "ai" && aiCheck && (
            <div className="space-y-4">
              {/* Overall score */}
              {aiCheck.overall && (
                <div className="rounded-3xl border border-moss/20 bg-moss/5 p-6">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-moss/70">
                        Загальна оцінка
                      </p>
                      <div className="mt-2 flex items-center gap-3">
                        <span className="text-3xl font-bold text-moss">
                          {Math.round((aiCheck.overall.score01 || 0) * 100)}%
                        </span>
                        {aiCheck.overall.pointsForRating && (
                          <span className="rounded-full bg-gold/10 px-3 py-1 text-sm font-semibold text-gold">
                            +{aiCheck.overall.pointsForRating.toFixed(1)} pts
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {aiCheck.overall.feedback && (
                    <p className="text-sm text-ink/70">{aiCheck.overall.feedback}</p>
                  )}
                </div>
              )}

              {/* Per-item feedback */}
              {aiCheck.items && aiCheck.items.length > 0 && (
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-ink/40 mb-4">
                    Детальний фідбек
                  </p>
                  <div className="space-y-4">
                    {aiCheck.items.map((item: any, idx: number) => (
                      <div key={idx} className="rounded-2xl border border-ink/10 bg-fog p-4">
                        <p className="text-sm font-semibold text-ink mb-3">
                          Речення {idx + 1}
                        </p>

                        <div className="space-y-2">
                          {(item.gaps || []).map((gap: any, gapIdx: number) => {
                            const verdict = VERDICT_STYLES[gap.verdict] || VERDICT_STYLES.bad;

                            return (
                              <div
                                key={gapIdx}
                                className="rounded-xl border border-ink/10 bg-paper p-3"
                              >
                                <div className="flex items-start gap-2 mb-2">
                                  {gap.verdict === "ok" ? (
                                    <CheckCircle
                                      size={16}
                                      weight="fill"
                                      className={`${verdict.icon} flex-shrink-0 mt-0.5`}
                                    />
                                  ) : (
                                    <Circle
                                      size={16}
                                      weight="fill"
                                      className={`${verdict.icon} flex-shrink-0 mt-0.5`}
                                    />
                                  )}
                                  <div className="flex-1">
                                    <p className="text-xs text-ink/60 mb-1">Пропуск {gapIdx + 1}</p>
                                    {gap.feedback && (
                                      <p className="text-sm text-ink">{gap.feedback}</p>
                                    )}
                                  </div>
                                </div>

                                {gap.correctAnswers && gap.correctAnswers.length > 0 && (
                                  <div className="mt-2 ml-6 rounded-lg border border-moss/20 bg-moss/5 px-3 py-2">
                                    <p className="text-[10px] uppercase tracking-[0.2em] text-moss/70 mb-1">
                                      Правильні відповіді
                                    </p>
                                    <p className="text-sm text-moss">
                                      {gap.correctAnswers.join(", ")}
                                    </p>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggested vocabulary */}
              {suggested.length > 0 && (
                <VocabSuggestions
                  suggestions={suggested}
                  onAdd={addSuggestedWord}
                  onAddAll={addAllSuggested}
                  title="Рекомендовані слова для вивчення"
                />
              )}
            </div>
          )}

          {/* Classic mode summary */}
          {mode === "classic" && (
            <div className="rounded-2xl border border-gold/20 bg-gold/5 p-4">
              <div className="flex items-start gap-3">
                <CheckCircle size={20} weight="fill" className="text-gold flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-gold mb-1">Чудова робота!</p>
                  <p className="text-xs text-ink/70">
                    Ви заповнили {totalGaps} {totalGaps === 1 ? "пропуск" : "пропусків"},
                    з них {correctCount || 0} правильно ({scorePercent !== null ? `${scorePercent}%` : "\u2014"}).
                    Продовжуйте практикуватися!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tips */}
          <div className="rounded-2xl border border-ink/10 bg-fog p-4">
            <div className="flex items-start gap-3">
              <Sparkle size={20} weight="fill" className="text-gold flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-ink mb-1">Порада для наступного разу</p>
                <p className="text-xs text-ink/70">
                  {mode === "ai"
                    ? "Звертайте увагу на підказки та фідбек AI. Це допоможе краще запам'ятати граматичні правила."
                    : "Спробуйте AI режим для отримання детального фідбеку та аналізу помилок!"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 border-t border-ink/10 bg-paper p-6">
          <button
            onClick={onClose}
            className="w-full rounded-full bg-gold px-6 py-3 text-sm font-semibold text-paper transition hover:bg-gold/90"
          >
            Завершити
          </button>
        </div>
      </div>
    </div>
  );
}
