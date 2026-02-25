// @ts-nocheck
"use client";

import { Circle, CheckCircle, X, Trophy, Sparkle } from "@phosphor-icons/react";
import { useLocale } from "@/components/LocaleProvider";

interface ParaphraseResultsProps {
  results: {
    mode: "classic" | "ai";
    totalSentences: number;
    completedSentences: number;
    totalPoints?: number;
    aiCheck?: any;
    topic?: string;
    level?: string;
  };
  onClose: () => void;
}

export default function ParaphraseResults({ results, onClose }: ParaphraseResultsProps) {
  const { t } = useLocale();
  const { mode, totalSentences, completedSentences, totalPoints, aiCheck, topic, level } = results;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 px-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-ink/10 bg-paper shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-ink/10 bg-paper p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-terracotta/10">
              <Trophy size={24} weight="fill" className="text-terracotta" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-ink">{t.workbook.exerciseComplete}</h3>
              <p className="mt-1 text-sm text-ink/60">
                {mode === "classic" ? t.workbook.classicMode : t.workbook.aiMode}
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
              <div className="text-2xl font-bold text-terracotta">{totalSentences}</div>
              <div className="mt-1 text-xs text-ink/60">{t.workbook.paraphraseResultsTotalSentences}</div>
            </div>
            <div className="rounded-2xl border border-ink/10 bg-fog p-4 text-center">
              <div className="text-2xl font-bold text-moss">{completedSentences}</div>
              <div className="mt-1 text-xs text-ink/60">{t.workbook.paraphraseResultsParaphrased}</div>
            </div>
            <div className="rounded-2xl border border-ink/10 bg-fog p-4 text-center">
              {mode === "classic" && totalPoints !== undefined ? (
                <>
                  <div className="text-2xl font-bold text-gold">
                    {totalPoints}
                  </div>
                  <div className="mt-1 text-xs text-ink/60">{t.workbook.paraphraseResultsPointsEarned}</div>
                </>
              ) : aiCheck?.overall?.qualityScore !== undefined ? (
                <>
                  <div className="text-2xl font-bold text-moss">
                    {Math.round(aiCheck.overall.qualityScore * 100)}%
                  </div>
                  <div className="mt-1 text-xs text-ink/60">{t.workbook.paraphraseResultsQuality}</div>
                </>
              ) : (
                <>
                  <div className="text-2xl font-bold text-moss">✓</div>
                  <div className="mt-1 text-xs text-ink/60">{t.workbook.paraphraseResultsCompleted}</div>
                </>
              )}
            </div>
          </div>

          {/* Motivational message for low scores */}
          {aiCheck?.overall?.qualityScore !== undefined && aiCheck.overall.qualityScore < 0.3 && (
            <div className="rounded-2xl border border-gold/20 bg-gold/5 p-4 text-center">
              <p className="text-sm text-ink/70">
                {t.workbook.encouragement}
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
                        {t.workbook.overallScore}
                      </p>
                      <div className="mt-2 flex items-center gap-3">
                        <span className="text-3xl font-bold text-moss">
                          {Math.round((aiCheck.overall.qualityScore || 0) * 100)}%
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

              {/* Per-sentence feedback */}
              {aiCheck.items && aiCheck.items.length > 0 && (
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-ink/40 mb-4">
                    {t.workbook.detailedFeedback}
                  </p>
                  <div className="space-y-4">
                    {aiCheck.items.map((item: any, idx: number) => {
                      const qualityScore = item.qualityScore || 0;
                      const qualityColorClass =
                        qualityScore >= 0.8
                          ? "text-moss"
                          : qualityScore >= 0.6
                            ? "text-gold"
                            : "text-terracotta";

                      return (
                        <div key={idx} className="rounded-2xl border border-ink/10 bg-fog p-4">
                          <div className="space-y-3">
                            {/* Original */}
                            <div>
                              <p className="text-[10px] uppercase tracking-[0.2em] text-ink/40 mb-1">
                                {t.workbook.paraphraseResultsOriginal}
                              </p>
                              <p className="text-sm text-ink">{item.original}</p>
                            </div>

                            {/* Your paraphrase */}
                            <div>
                              <p className="text-[10px] uppercase tracking-[0.2em] text-ink/40 mb-1">
                                {t.workbook.paraphraseResultsYourParaphrase}
                              </p>
                              <div className="flex items-start gap-2">
                                <Circle
                                  size={16}
                                  weight="fill"
                                  className={`${qualityColorClass} flex-shrink-0 mt-0.5`}
                                />
                                <p className="text-sm text-ink flex-1">{item.paraphrase}</p>
                              </div>
                            </div>

                            {/* Feedback */}
                            {item.feedback && (
                              <div className="rounded-xl border border-ink/10 bg-paper p-3">
                                <p className="text-xs text-ink/70">{item.feedback}</p>
                              </div>
                            )}

                            {/* Quality metrics */}
                            {(item.synonymsUsed || item.structureChanged || item.meaningPreserved !== undefined) && (
                              <div className="grid gap-2 grid-cols-1 sm:grid-cols-3">
                                {item.synonymsUsed !== undefined && (
                                  <div className="rounded-lg border border-ink/10 bg-paper p-2 text-center">
                                    <p className="text-xs text-ink/50">{t.workbook.paraphraseResultsSynonyms}</p>
                                    <p className="text-sm font-semibold text-moss">
                                      {item.synonymsUsed ? "✓" : "—"}
                                    </p>
                                  </div>
                                )}
                                {item.structureChanged !== undefined && (
                                  <div className="rounded-lg border border-ink/10 bg-paper p-2 text-center">
                                    <p className="text-xs text-ink/50">{t.workbook.paraphraseResultsStructure}</p>
                                    <p className="text-sm font-semibold text-moss">
                                      {item.structureChanged ? "✓" : "—"}
                                    </p>
                                  </div>
                                )}
                                {item.meaningPreserved !== undefined && (
                                  <div className="rounded-lg border border-ink/10 bg-paper p-2 text-center">
                                    <p className="text-xs text-ink/50">{t.workbook.paraphraseResultsMeaning}</p>
                                    <p className="text-sm font-semibold text-moss">
                                      {item.meaningPreserved ? "✓" : "—"}
                                    </p>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Alternative suggestion */}
                            {item.alternative && item.alternative !== item.paraphrase && (
                              <div className="rounded-lg border border-moss/20 bg-moss/5 px-3 py-2">
                                <p className="text-[10px] uppercase tracking-[0.2em] text-moss/70 mb-1">
                                  {t.workbook.paraphraseResultsAlternative}
                                </p>
                                <p className="text-sm text-moss">{item.alternative}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Classic mode summary */}
          {mode === "classic" && (
            <div className="rounded-2xl border border-terracotta/20 bg-terracotta/5 p-4">
              <div className="flex items-start gap-3">
                <CheckCircle size={20} weight="fill" className="text-terracotta flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-terracotta mb-1">{t.workbook.excellentWork}</p>
                  <p className="text-xs text-ink/70">
                    {t.workbook.paraphraseResultsSummaryText
                      .replace("{count}", String(completedSentences))
                      .replace("{total}", String(totalSentences))}
                    {" "}{t.workbook.paraphraseResultsContinuePractice}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tips */}
          <div className="rounded-2xl border border-ink/10 bg-fog p-4">
            <div className="flex items-start gap-3">
              <Sparkle size={20} weight="fill" className="text-moss flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-ink mb-1">{t.workbook.tipNextTime}</p>
                <p className="text-xs text-ink/70">
                  {mode === "ai"
                    ? t.workbook.paraphraseResultsTipAI
                    : t.workbook.paraphraseResultsTipClassic}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 border-t border-ink/10 bg-paper p-6">
          <button
            onClick={onClose}
            className="w-full rounded-full bg-terracotta px-6 py-3 text-sm font-semibold text-paper transition hover:bg-terracotta/90"
          >
            {t.workbook.finishButton}
          </button>
        </div>
      </div>
    </div>
  );
}
