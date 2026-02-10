// @ts-nocheck
"use client";

import { X, Trophy, Sparkle, CheckCircle, ChatCircleText } from "@phosphor-icons/react";

interface DialogueResultsProps {
  results: {
    mode: "classic" | "ai";
    scenario?: string;
    situation?: string;
    level: string;
    totalTurns: number;
    filledTurns: number;
    qualityScore: number;
    aiFeedback?: any;
  };
  onClose: () => void;
}

export default function DialogueResults({ results, onClose }: DialogueResultsProps) {
  const { mode, scenario, situation, level, totalTurns, filledTurns, qualityScore, aiFeedback } = results;

  const scenarioLabels: Record<string, string> = {
    shop: "Магазин",
    restaurant: "Ресторан",
    station: "Вокзал",
    hotel: "Готель",
    doctor: "Лікар"
  };

  const title = mode === "classic"
    ? scenarioLabels[scenario || ""] || "Діалог"
    : situation || "Діалог з AI";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 px-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-ink/10 bg-paper shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-ink/10 bg-paper p-6">
          <div className="flex items-start gap-4">
            <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
              mode === "classic" ? "bg-gold/10" : "bg-moss/10"
            }`}>
              <Trophy size={24} weight="fill" className={mode === "classic" ? "text-gold" : "text-moss"} />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-ink">Діалог завершено!</h3>
              <p className="mt-1 text-sm text-ink/60">
                {mode === "classic" ? "Класичний режим" : "Режим з AI"} · {title} · {level}
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
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-ink/10 bg-fog p-4 text-center">
              <div className="text-2xl font-bold text-gold">{totalTurns}</div>
              <div className="mt-1 text-xs text-ink/60">Всього обмінів</div>
            </div>
            <div className="rounded-2xl border border-ink/10 bg-fog p-4 text-center">
              <div className="text-2xl font-bold text-moss">{filledTurns}</div>
              <div className="mt-1 text-xs text-ink/60">Відповідей дано</div>
            </div>
            <div className="rounded-2xl border border-ink/10 bg-fog p-4 text-center">
              <div className="text-2xl font-bold text-terracotta">
                {Math.round(qualityScore * 100)}%
              </div>
              <div className="mt-1 text-xs text-ink/60">Якість</div>
            </div>
          </div>

          {/* AI Feedback */}
          {mode === "ai" && aiFeedback && (
            <div className="space-y-4">
              {/* Overall feedback */}
              {aiFeedback.overallFeedback && (
                <div className="rounded-3xl border border-moss/20 bg-moss/5 p-6">
                  <div className="flex items-start gap-3 mb-3">
                    <Sparkle size={20} weight="fill" className="text-moss flex-shrink-0 mt-0.5" />
                    <p className="text-xs uppercase tracking-[0.3em] text-moss/70">
                      Загальна оцінка
                    </p>
                  </div>
                  <p className="text-sm text-ink/70">{aiFeedback.overallFeedback}</p>
                </div>
              )}

              {/* Naturalness */}
              {aiFeedback.naturalness !== undefined && (
                <div className="rounded-2xl border border-ink/10 bg-fog p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-ink">Природність мовлення</p>
                    <span className="text-lg font-bold text-gold">
                      {Math.round(aiFeedback.naturalness * 100)}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-ink/10 overflow-hidden">
                    <div
                      className="h-full bg-gold transition-all"
                      style={{ width: `${aiFeedback.naturalness * 100}%` }}
                    />
                  </div>
                  {aiFeedback.naturalnessNote && (
                    <p className="mt-2 text-xs text-ink/60">{aiFeedback.naturalnessNote}</p>
                  )}
                </div>
              )}

              {/* Grammar */}
              {aiFeedback.grammar !== undefined && (
                <div className="rounded-2xl border border-ink/10 bg-fog p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-ink">Граматична правильність</p>
                    <span className="text-lg font-bold text-moss">
                      {Math.round(aiFeedback.grammar * 100)}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-ink/10 overflow-hidden">
                    <div
                      className="h-full bg-moss transition-all"
                      style={{ width: `${aiFeedback.grammar * 100}%` }}
                    />
                  </div>
                  {aiFeedback.grammarNote && (
                    <p className="mt-2 text-xs text-ink/60">{aiFeedback.grammarNote}</p>
                  )}
                </div>
              )}

              {/* Turn-by-turn feedback */}
              {aiFeedback.turns && aiFeedback.turns.length > 0 && (
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-ink/40 mb-4">
                    Детальний фідбек
                  </p>
                  <div className="space-y-3">
                    {aiFeedback.turns.map((turn: any, idx: number) => (
                      <div key={idx} className="rounded-2xl border border-ink/10 bg-fog p-4">
                        <div className="flex items-start gap-3 mb-2">
                          <ChatCircleText size={16} weight="fill" className="text-gold flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-xs font-semibold text-ink mb-1">Ваша відповідь {idx + 1}</p>
                            <p className="text-sm text-ink/80 italic">&quot;{turn.userResponse}&quot;</p>
                          </div>
                        </div>

                        {turn.feedback && (
                          <div className="mt-3 pl-7">
                            <p className="text-xs text-ink/70">{turn.feedback}</p>
                          </div>
                        )}

                        {turn.improved && turn.improved !== turn.userResponse && (
                          <div className="mt-3 pl-7 rounded-xl border border-moss/20 bg-moss/5 px-3 py-2">
                            <p className="text-[10px] uppercase tracking-[0.2em] text-moss/70 mb-1">
                              Рекомендоване
                            </p>
                            <p className="text-sm text-moss">&quot;{turn.improved}&quot;</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggested phrases */}
              {aiFeedback.suggestedPhrases && aiFeedback.suggestedPhrases.length > 0 && (
                <div className="rounded-2xl border border-gold/20 bg-gold/5 p-4">
                  <p className="text-xs uppercase tracking-[0.3em] text-gold/70 mb-3">
                    Корисні фрази для вивчення
                  </p>
                  <div className="space-y-2">
                    {aiFeedback.suggestedPhrases.map((phrase: any, idx: number) => (
                      <div key={idx} className="flex items-start gap-2">
                        <span className="text-sm font-semibold text-gold">{phrase.pl}</span>
                        <span className="text-sm text-ink/70">—</span>
                        <span className="text-sm text-ink/70">{phrase.uk}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Classic mode summary */}
          {mode === "classic" && (
            <div className="rounded-2xl border border-gold/20 bg-gold/5 p-4">
              <div className="flex items-start gap-3">
                <CheckCircle size={20} weight="fill" className="text-gold flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-gold mb-1">Відмінна робота!</p>
                  <p className="text-xs text-ink/70">
                    Ви заповнили {filledTurns} з {totalTurns} реплік у діалозі.
                    Продовжуйте практикувати розмовні навички!
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
                    ? "Звертайте увагу на природність фраз та граматичні конструкції. Практикуйте різні ситуації для покращення розмовних навичок."
                    : "Спробуйте AI режим для отримання детального фідбеку та практики з інтерактивним співрозмовником!"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 border-t border-ink/10 bg-paper p-6">
          <button
            onClick={onClose}
            className={`w-full rounded-full px-6 py-3 text-sm font-semibold text-paper transition ${
              mode === "classic"
                ? "bg-gold hover:bg-gold/90"
                : "bg-moss hover:bg-moss/90"
            }`}
          >
            Завершити
          </button>
        </div>
      </div>
    </div>
  );
}
