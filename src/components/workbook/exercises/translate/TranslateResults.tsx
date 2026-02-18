// @ts-nocheck
"use client";

import { X, Trophy, Sparkle, CheckCircle, ArrowsClockwise, Lightbulb } from "@phosphor-icons/react";
import VocabSuggestions from "../../shared/VocabSuggestions";

const VERDICT_STYLES = {
  excellent: { color: "text-moss", label: "Відмінно" },
  good: { color: "text-moss", label: "Добре" },
  acceptable: { color: "text-gold", label: "Прийнятно" },
  weak: { color: "text-terracotta", label: "Слабко" },
  poor: { color: "text-terracotta", label: "Погано" },
};

interface TranslateResultsProps {
  results: {
    mode: "classic" | "ai";
    total: number;
    completed: number;
    accuracy: number;
    score: number;
    direction: "uk_to_pl" | "pl_to_uk";
    level: string;
    aiCheck?: any;
    topic?: string;
  };
  onClose: () => void;
}

export default function TranslateResults({ results, onClose }: TranslateResultsProps) {
  const { mode, total, completed, accuracy, score, direction, level, aiCheck, topic } = results;
  const suggested = (aiCheck?.suggestedVocab || [])
    .map((item: any) => ({
      pl: String(item.lemma || item.pl || "").trim(),
      uk: String(item.translation || item.meaning || item.meaningUk || item.uk || "").trim()
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 px-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl border border-ink/10 bg-paper shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-ink/10 bg-paper p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-moss/10">
              <Trophy size={24} weight="fill" className="text-moss" />
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
              <div className="text-2xl font-bold text-moss">{completed}</div>
              <div className="mt-1 text-xs text-ink/60">
                {total === 1 ? "Речення" : "Речень"}
              </div>
            </div>
            <div className="rounded-2xl border border-ink/10 bg-fog p-4 text-center">
              <div className="text-2xl font-bold text-gold">{Math.round(accuracy)}%</div>
              <div className="mt-1 text-xs text-ink/60">Точність</div>
            </div>
            <div className="rounded-2xl border border-ink/10 bg-fog p-4 text-center">
              <div className="text-2xl font-bold text-terracotta">
                {score.toFixed(1)}
              </div>
              <div className="mt-1 text-xs text-ink/60">Балів</div>
            </div>
          </div>

          {/* Motivational message for low scores */}
          {accuracy < 30 && (
            <div className="rounded-2xl border border-gold/20 bg-gold/5 p-4 text-center">
              <p className="text-sm text-ink/70">
                Не зупиняйтесь! Навіть перші спроби цінні для навчання. Спробуйте ще раз!
              </p>
            </div>
          )}

          {/* AI Feedback */}
          {mode === "ai" && aiCheck && (
            <div className="space-y-6">
              {/* Overall feedback */}
              {aiCheck.overall && (
                <div className="rounded-3xl border border-moss/20 bg-moss/5 p-6">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex-1">
                      <p className="text-xs uppercase tracking-[0.3em] text-moss/70 mb-2">
                        Загальна оцінка
                      </p>
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-3xl font-bold text-moss">
                          {Math.round(aiCheck.overall.accuracy || accuracy)}%
                        </span>
                        {aiCheck.overall.points !== undefined && (
                          <span className="rounded-full bg-gold/20 px-3 py-1 text-sm font-semibold text-gold">
                            +{aiCheck.overall.points.toFixed(1)} балів
                          </span>
                        )}
                      </div>
                      {aiCheck.overall.feedback && (
                        <p className="text-sm text-ink/70 leading-relaxed">{aiCheck.overall.feedback}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Per-sentence feedback */}
              {aiCheck.items && aiCheck.items.length > 0 && (
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-ink/40 mb-4">
                    Детальний фідбек
                  </p>
                  <div className="space-y-4">
                    {aiCheck.items.map((item: any, idx: number) => {
                      const verdict = VERDICT_STYLES[item.verdict] || { color: "text-ink", label: item.verdict };

                      return (
                        <div key={idx} className="rounded-3xl border border-ink/10 bg-fog p-5">
                          <div className="space-y-4">
                            {/* Source */}
                            <div>
                              <p className="text-xs uppercase tracking-[0.3em] text-ink/40 mb-1.5">
                                Оригінал
                              </p>
                              <p className="text-sm text-ink font-medium">{item.source}</p>
                            </div>

                            {/* User translation with verdict */}
                            <div>
                              <div className="flex items-center justify-between mb-1.5">
                                <p className="text-xs uppercase tracking-[0.3em] text-ink/40">
                                  Ваш переклад
                                </p>
                                {item.verdict && (
                                  <span className={`text-xs font-semibold ${verdict.color}`}>
                                    {verdict.label} · {Math.round((item.score || 0) * 100)}%
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-ink">{item.userTranslation}</p>
                            </div>

                            {/* Feedback */}
                            {item.feedback && (
                              <div className="rounded-2xl border border-ink/10 bg-paper p-3">
                                <p className="text-xs text-ink/70 leading-relaxed">{item.feedback}</p>
                              </div>
                            )}

                            {/* Improvements */}
                            {item.improvements && item.improvements.length > 0 && (
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <Lightbulb size={14} weight="fill" className="text-gold" />
                                  <p className="text-xs uppercase tracking-[0.3em] text-gold/70">
                                    Покращення
                                  </p>
                                </div>
                                {item.improvements.map((improvement: any, impIdx: number) => (
                                  <div key={impIdx} className="rounded-2xl border border-gold/20 bg-gold/5 p-3 space-y-2">
                                    <p className="text-xs font-semibold text-ink">{improvement.issue}</p>
                                    <div className="grid gap-2 grid-cols-1 sm:grid-cols-2">
                                      <div>
                                        <p className="text-[10px] uppercase tracking-[0.2em] text-terracotta/70 mb-1">
                                          Було
                                        </p>
                                        <p className="text-xs text-terracotta line-through">{improvement.original}</p>
                                      </div>
                                      <div>
                                        <p className="text-[10px] uppercase tracking-[0.2em] text-moss/70 mb-1">
                                          Краще
                                        </p>
                                        <p className="text-xs text-moss font-medium">{improvement.improved}</p>
                                      </div>
                                    </div>
                                    <p className="text-xs text-ink/60 italic">{improvement.explanation}</p>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Reference translation */}
                            {item.reference && item.reference !== item.userTranslation && (
                              <div className="rounded-2xl border border-moss/20 bg-moss/5 p-3">
                                <p className="text-[10px] uppercase tracking-[0.2em] text-moss/70 mb-1.5">
                                  Зразковий переклад
                                </p>
                                <p className="text-sm text-moss font-medium">{item.reference}</p>
                              </div>
                            )}

                            {/* Alternative versions */}
                            {item.alternativeVersions && item.alternativeVersions.length > 0 && (
                              <div>
                                <div className="flex items-center gap-2 mb-2">
                                  <ArrowsClockwise size={14} weight="bold" className="text-ink/40" />
                                  <p className="text-[10px] uppercase tracking-[0.2em] text-ink/40">
                                    Інші варіанти
                                  </p>
                                </div>
                                <div className="space-y-1.5">
                                  {item.alternativeVersions.map((alt: string, altIdx: number) => (
                                    <p key={altIdx} className="text-xs text-ink/60 pl-4">
                                      {"\u2022"} {alt}
                                    </p>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Suggested Vocabulary */}
              {suggested.length > 0 && (
                <VocabSuggestions
                  suggestions={suggested}
                  onAdd={addSuggestedWord}
                  onAddAll={addAllSuggested}
                  title="Рекомендовані слова для словника"
                />
              )}
            </div>
          )}

          {/* Classic mode summary */}
          {mode === "classic" && (
            <div className="rounded-2xl border border-moss/20 bg-moss/5 p-4">
              <div className="flex items-start gap-3">
                <CheckCircle size={20} weight="fill" className="text-moss flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-moss mb-1">Відмінна робота!</p>
                  <p className="text-xs text-ink/70">
                    Ви переклали {completed} {completed === 1 ? "речення" : "речень"} з {total}.
                    Продовжуйте практикуватися для покращення навичок перекладу!
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
                    ? "Звертайте увагу на покращення та альтернативні варіанти - вони допоможуть вам розширити словниковий запас!"
                    : "Спробуйте AI режим для отримання детального фідбеку про ваші переклади!"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 border-t border-ink/10 bg-paper p-6">
          <button
            onClick={onClose}
            className="w-full rounded-full bg-moss px-6 py-3 text-sm font-semibold text-paper transition hover:bg-moss/90"
          >
            Завершити
          </button>
        </div>
      </div>
    </div>
  );
}
