"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { useCloze, ClozeMaterial, ClozeItem } from "./useCloze";
import { CheckCircle, Sparkle } from "@phosphor-icons/react/dist/ssr";
import Loader from "@/components/ui/Loader";

interface ClozePracticeProps {
  initialMaterialId?: string;
  trainingMode?: boolean;
  queueIds?: string[];
  aiMode?: boolean;
  aiTopic?: string;
  hintTypes?: ("word" | "translation" | "context")[];
}

export default function ClozePractice({
  initialMaterialId,
  trainingMode = false,
  queueIds = [],
  aiMode = false,
  aiTopic = "",
  hintTypes = []
}: ClozePracticeProps) {
  const { t, locale } = useLocale();
  const {
    materials,
    activeMaterial,
    answers,
    hintsOpen,
    hintsDefault,
    awarded,
    points,
    trainingActive,
    queue,
    queueIndex,
    loading,
    loadMaterials,
    selectMaterial,
    updateAnswer,
    toggleHints,
    submitAttempt,
    computeScore,
    isGapCorrect,
    startTraining,
    goToNextInQueue,
    goToPreviousInQueue,
    generateAI,
    checkWithAI
  } = useCloze();

  const [aiCheckResult, setAiCheckResult] = useState<any>(null);
  const [aiCheckLoading, setAiCheckLoading] = useState(false);

  const hintTypesKey = hintTypes.join("|");

  useEffect(() => {
    if (aiMode && aiTopic) {
      generateAI(aiTopic, hintTypes, locale);
    } else {
      loadMaterials();
    }
  }, [aiMode, aiTopic, generateAI, hintTypesKey, hintTypes, loadMaterials, locale]);

  useEffect(() => {
    if (aiMode || materials.length === 0) return;

    if (trainingMode && queueIds.length > 0) {
      startTraining(queueIds);
    } else if (initialMaterialId) {
      selectMaterial(initialMaterialId);
    }
  }, [aiMode, materials, trainingMode, queueIds, initialMaterialId, selectMaterial, startTraining]);

  const score = computeScore(activeMaterial, answers);
  const hasAnswers = Object.keys(answers).length > 0;

  const handleSubmit = async () => {
    const success = await submitAttempt();
    if (success) {
      // Success handled by hook
    }
  };

  const handleAICheck = async () => {
    setAiCheckLoading(true);
    const result = await checkWithAI(locale);
    setAiCheckResult(result);
    setAiCheckLoading(false);
  };

  if (!activeMaterial) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader label={t.common.loading} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold">{activeMaterial.title}</h2>
            <p className="mt-1 text-sm text-ink/60">
              {activeMaterial.level} · {t.workbook.clozeTitle}
            </p>
          </div>
          {trainingActive && queue.length > 1 && (
            <span className="rounded-full border border-ink/10 bg-paper px-3 py-1 text-xs">
              {queueIndex + 1} / {queue.length}
            </span>
          )}
        </div>
      </div>

      {/* Gap-fill Items */}
      <div className="space-y-4">
        {(activeMaterial.content?.items || []).map((item: ClozeItem, idx: number) => {
          const itemKeyBase = item.id || idx;
          const parts = String(item.text || "").split("___");

          return (
            <div key={itemKeyBase} className="rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.3em] text-ink/40">
                  {t.workbook.clozeItem} {idx + 1}
                </p>
                {item.gaps && item.gaps.length > 0 && (
                  <button
                    onClick={() => toggleHints(String(itemKeyBase))}
                    className="text-[10px] uppercase tracking-[0.2em] text-ink/50 hover:text-ink"
                  >
                    {(hintsOpen[String(itemKeyBase)] ?? hintsDefault)
                      ? t.workbook.clozeHideHints
                      : t.workbook.clozeHints}
                  </button>
                )}
              </div>

              {/* Text with gaps */}
              <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-ink/80">
                {parts.map((part: string, partIndex: number) => {
                  const gapIndex = partIndex;
                  const gap = item.gaps?.[gapIndex];

                  if (!gap) {
                    return <span key={`${itemKeyBase}-p-${partIndex}`}>{part}</span>;
                  }

                  const key = `${itemKeyBase}-${gapIndex}`;
                  const value = answers[key] || "";
                  const correct = isGapCorrect(gap, value);

                  return (
                    <span key={`${itemKeyBase}-g-${partIndex}`} className="inline-flex items-center gap-2">
                      <span>{part}</span>
                      <input
                        value={value}
                        onChange={(e) => updateAnswer(key, e.target.value)}
                        className={`w-32 rounded-full border px-3 py-1 text-sm transition ${
                          !value
                            ? "border-ink/20 bg-paper"
                            : correct
                              ? "border-moss/40 bg-moss/10"
                              : "border-terracotta/40 bg-terracotta/10"
                        }`}
                        placeholder={t.workbook.clozePlaceholder || "..."}
                      />
                    </span>
                  );
                })}
              </div>

              {/* Hints */}
              {(hintsOpen[String(itemKeyBase)] ?? hintsDefault) && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {(item.gaps || []).map((gap, gapIdx) => (
                    <span
                      key={`${itemKeyBase}-h-${gapIdx}`}
                      className="rounded-full border border-ink/10 bg-paper px-3 py-1 text-xs text-ink/50"
                    >
                      {gap.hint || t.workbook.clozeHintEmpty || "?"}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Results & Actions */}
      <div className="rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft">
        <div className="flex flex-wrap items-center gap-4">
          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={awarded || !hasAnswers}
            className="rounded-full bg-ink px-6 py-2 text-sm font-semibold text-paper disabled:opacity-50"
          >
            {awarded ? t.workbook.clozeAwarded || "Зараховано" : t.workbook.clozeAward || "Перевірити"}
          </button>

          {/* AI Check Button (for AI mode) */}
          {aiMode && (
            <button
              onClick={handleAICheck}
              disabled={aiCheckLoading || !hasAnswers}
              className="inline-flex items-center gap-2 rounded-full border border-moss/40 bg-moss/10 px-6 py-2 text-sm font-semibold text-moss transition hover:bg-moss/20 disabled:opacity-50"
            >
              {aiCheckLoading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-moss/20 border-t-moss" />
                  <span>Checking...</span>
                </>
              ) : (
                <>
                  <Sparkle size={18} weight="fill" />
                  <span>Check with AI</span>
                </>
              )}
            </button>
          )}

          {/* Score */}
          {hasAnswers && (
            <div className="flex items-center gap-2">
              <CheckCircle
                weight="fill"
                className={`h-5 w-5 ${
                  score.score >= 0.75
                    ? "text-moss"
                    : score.score >= 0.6
                      ? "text-gold"
                      : "text-terracotta"
                }`}
              />
              <span className="text-sm text-ink/80">
                {score.correct} / {score.total} · {Math.round(score.score * 100)}%
              </span>
            </div>
          )}

          {/* Points */}
          {points !== null && (
            <span className="text-sm font-semibold text-moss">
              +{points} {t.workbook.points}
            </span>
          )}

          {/* Training Navigation */}
          {trainingActive && queue.length > 1 && (
            <>
              <div className="ml-auto flex items-center gap-2">
                <button
                  onClick={goToPreviousInQueue}
                  disabled={queueIndex === 0}
                  className="rounded-full border border-ink/20 px-4 py-2 text-xs font-semibold text-ink disabled:opacity-50"
                >
                  ← {t.workbook.prev}
                </button>
                <button
                  onClick={goToNextInQueue}
                  disabled={queueIndex >= queue.length - 1}
                  className="rounded-full border border-ink/20 px-4 py-2 text-xs font-semibold text-ink disabled:opacity-50"
                >
                  {t.workbook.next} →
                </button>
              </div>
            </>
          )}
        </div>

        {/* AI Check Results */}
        {aiCheckResult && (
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.3em] text-ink/40">AI Feedback</p>
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold text-moss">
                  {Math.round((aiCheckResult.overall?.score01 || 0) * 100)}%
                </span>
                {aiCheckResult.overall?.pointsForRating && (
                  <span className="rounded-full bg-gold/10 px-3 py-1 text-sm font-semibold text-gold">
                    +{aiCheckResult.overall.pointsForRating.toFixed(1)} pts
                  </span>
                )}
              </div>
            </div>

            {/* Per-gap feedback */}
            <div className="space-y-3">
              {aiCheckResult.items?.map((item: any, idx: number) => (
                <div key={idx} className="rounded-2xl border border-ink/10 bg-fog p-4">
                  <p className="text-sm font-semibold text-ink mb-3">
                    {t.workbook.clozeItem} {idx + 1}
                  </p>

                  <div className="space-y-2">
                    {item.gaps?.map((gap: any, gapIdx: number) => {
                      const verdictColor =
                        gap.verdict === "ok"
                          ? "moss"
                          : gap.verdict === "weak"
                            ? "gold"
                            : "terracotta";

                      return (
                        <div key={gapIdx} className="flex items-start gap-2">
                          <CheckCircle
                            size={16}
                            weight={gap.verdict === "ok" ? "fill" : "regular"}
                            className={`text-${verdictColor} flex-shrink-0 mt-0.5`}
                          />
                          <div className="flex-1 text-sm">
                            {gap.feedback && <p className="text-ink/70">{gap.feedback}</p>}
                            {gap.correctAnswers && gap.correctAnswers.length > 0 && (
                              <p className="mt-1 text-xs text-moss">
                                Correct: {gap.correctAnswers.join(", ")}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Suggested vocab */}
            {aiCheckResult.suggestedVocab && aiCheckResult.suggestedVocab.length > 0 && (
              <div className="rounded-2xl border border-moss/20 bg-moss/5 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-moss/70 mb-3">
                  Suggested Vocabulary
                </p>
                <div className="space-y-2">
                  {aiCheckResult.suggestedVocab.map((vocab: any, idx: number) => (
                    <div key={idx} className="flex items-start gap-2">
                      <span className="text-sm font-semibold text-moss">{vocab.lemma}</span>
                      <span className="text-sm text-ink/70">—</span>
                      <span className="text-sm text-ink/70">{vocab.meaning}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
