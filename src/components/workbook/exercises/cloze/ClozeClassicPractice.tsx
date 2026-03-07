"use client";

import { useState, useEffect, useRef } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { CheckCircle, XCircle, Sparkle, PaperPlaneRight, ArrowRight } from "@phosphor-icons/react";
import { safeParseAIResponse } from "@/lib/workbook";
import { calculatePoints } from "@/lib/scoring";
import ClozeResults from "./ClozeResults";

interface Gap {
  index: number;
  answers: string[];
  hint?: string;
}

interface ClozeItem {
  text: string;
  gaps: Gap[];
  materialTitle?: string;
}

interface ClozeClassicPracticeProps {
  config: {
    level: "A1" | "A2" | "B1" | "B2";
    sentenceCount: number;
  };
  onComplete: () => void;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function ClozeClassicPractice({ config, onComplete }: ClozeClassicPracticeProps) {
  const { t, locale } = useLocale();
  const [items, setItems] = useState<ClozeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [noContent, setNoContent] = useState(false);
  // answers keyed as "itemIdx-gapIdx"
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [aiCheckResult, setAiCheckResult] = useState<any>(null);
  const [isCheckingAI, setIsCheckingAI] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/exercises?type=cloze&level=${config.level}`);
        if (!res.ok) { setNoContent(true); return; }
        const data = await res.json().catch(() => ({}));
        const materials: any[] = data.items || [];
        if (materials.length === 0) { setNoContent(true); return; }

        // Flatten all items from all materials, attach material title
        const allItems: ClozeItem[] = [];
        for (const mat of materials) {
          for (const item of (mat.content?.items || [])) {
            allItems.push({ ...item, materialTitle: mat.title });
          }
        }

        // Shuffle and pick sentenceCount
        const picked = shuffle(allItems).slice(0, config.sentenceCount);
        setItems(picked);
      } catch {
        setNoContent(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [config.level, config.sentenceCount]);

  const updateAnswer = (key: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
    setChecked(false);
  };

  const isGapCorrect = (gap: Gap, key: string): boolean => {
    const val = (answers[key] || "").trim().toLowerCase();
    if (!val) return false;
    return gap.answers.some((a) => a.trim().toLowerCase() === val);
  };

  const totalGaps = items.reduce((s, item) => s + item.gaps.length, 0);
  const filledCount = Object.values(answers).filter((v) => v.trim()).length;
  const correctCount = items.reduce((s, item, iIdx) =>
    s + item.gaps.filter((g, gIdx) => isGapCorrect(g, `${iIdx}-${gIdx}`)).length, 0);

  const handleCheck = () => {
    setChecked(true);
  };

  const handleCheckWithAI = async () => {
    if (filledCount === 0) { setError(t.workbook.clozeAtLeastOne); return; }
    setIsCheckingAI(true);
    setError(null);
    try {
      const exerciseItems = items.map((item, iIdx) => ({
        sentence: item.text,
        gaps: item.gaps.map((g, gIdx) => ({
          correctAnswers: g.answers,
          userAnswer: (answers[`${iIdx}-${gIdx}`] || "").trim()
        }))
      }));

      const res = await fetch("/api/ai/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "cloze_check",
          userInput: JSON.stringify({ exerciseType: "cloze", action: "check", level: config.level, items: exerciseItems }),
          context: JSON.stringify({ uiLanguage: locale || "uk" })
        })
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const errorCode = data?.code;
        setError(errorCode === "ai_quota" ? t.workbook.classicAiQuotaError
          : errorCode === "pvs_unavailable" ? t.workbook.classicAiPlanRequired
          : data?.error || t.workbook.classicAiError);
        return;
      }

      const result = safeParseAIResponse(data?.text);
      if (!result || !result.items) { setError(t.workbook.classicAiFormatError); return; }

      if (result?.overall?.score01 != null) {
        try {
          await fetch("/api/exercises/attempt", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              exercise: "cloze",
              points: calculatePoints({ score01: result.overall.score01, level: config.level, itemCount: totalGaps, exercise: "cloze" })
            })
          });
        } catch {}
      }

      setAiCheckResult(result);
      setShowResults(true);
    } catch {
      setError(t.workbook.classicCheckError);
    } finally {
      setIsCheckingAI(false);
    }
  };

  const handleSubmitForReview = async () => {
    if (filledCount === 0) { setError(t.workbook.clozeAtLeastOne); return; }
    setIsSubmitting(true);
    setError(null);
    try {
      const exerciseItems = items.map((item, iIdx) => ({
        sentence: item.text,
        gaps: item.gaps.map((g, gIdx) => ({
          correctAnswers: g.answers,
          userAnswer: (answers[`${iIdx}-${gIdx}`] || "").trim()
        }))
      }));

      const res = await fetch("/api/workbook/exercises/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exerciseType: "cloze", level: config.level, items: exerciseItems })
      });

      if (!res.ok) {
        let data: any = {};
        try { data = await res.json(); } catch {}
        setError(data?.error || t.workbook.classicSubmitError);
        return;
      }

      try {
        await fetch("/api/exercises/attempt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            exercise: "cloze",
            points: calculatePoints({ score01: 0.5, level: config.level, itemCount: totalGaps, exercise: "cloze" })
          })
        });
      } catch {}

      setSuccessMessage(t.workbook.classicSubmitSuccess);
      setTimeout(() => onComplete(), 2000);
    } catch {
      setError(t.workbook.classicSubmitError);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isProcessing = isCheckingAI || isSubmitting;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-gold/20 border-t-gold" />
      </div>
    );
  }

  if (noContent || items.length === 0) {
    return (
      <div className="rounded-3xl border border-ink/10 bg-paper/80 p-10 text-center shadow-soft">
        <p className="text-ink/60">
          {locale === "pl"
            ? `Brak ćwiczeń dla poziomu ${config.level}. Wybierz inny poziom.`
            : `Немає вправ для рівня ${config.level}. Оберіть інший рівень.`}
        </p>
        <button
          onClick={onComplete}
          className="mt-4 inline-flex items-center gap-2 rounded-full border border-ink/20 px-5 py-2 text-sm text-ink/70 hover:bg-ink/5"
        >
          {locale === "pl" ? "Wróć" : "Назад"}
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="rounded-3xl border border-gold/20 bg-gold/5 p-6 shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-gold/70 mb-2">
                {t.workbook.classicMode}
              </p>
              <h2 className="text-xl font-semibold text-ink">
                {t.workbook.clozeFillGaps}
              </h2>
              <p className="mt-1 text-sm text-ink/60">
                {t.workbook.clozeLevelAndCount
                  .replace("{level}", config.level)
                  .replace("{count}", String(items.length))}
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gold">{filledCount}/{totalGaps}</div>
              <div className="text-xs text-ink/50">{t.workbook.clozeFilled}</div>
            </div>
          </div>
        </div>

        {/* Exercise items */}
        <div className="space-y-4">
          {items.map((item, iIdx) => {
            const parts = item.text.split("___");
            return (
              <div key={iIdx} className="rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-fog text-xs font-semibold text-ink">
                    {iIdx + 1}
                  </div>
                  <div className="flex-1">
                    {item.materialTitle && (
                      <p className="mb-2 text-[10px] uppercase tracking-wider text-ink/40">
                        {item.materialTitle}
                      </p>
                    )}
                    {/* Sentence with gaps interleaved */}
                    <div className="mb-3 flex flex-wrap items-center gap-x-1 gap-y-2 text-base text-ink leading-relaxed">
                      {parts.map((part, pIdx) => {
                        const gapKey = `${iIdx}-${pIdx}`;
                        const gap = item.gaps[pIdx];
                        const val = answers[gapKey] || "";
                        const correct = checked && gap ? isGapCorrect(gap, gapKey) : null;
                        return (
                          <span key={pIdx} className="inline-flex flex-wrap items-center gap-x-1">
                            {part && <span>{part}</span>}
                            {gap && (
                              <span className="relative inline-flex items-center">
                                <input
                                  ref={(el) => { inputRefs.current[gapKey] = el; }}
                                  type="text"
                                  value={val}
                                  onChange={(e) => updateAnswer(gapKey, e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      // Move to next gap
                                      const nextKey = `${iIdx}-${pIdx + 1}`;
                                      const nextGlobal = `${iIdx + 1}-0`;
                                      const next = inputRefs.current[nextKey] || inputRefs.current[nextGlobal];
                                      if (next) next.focus();
                                    }
                                  }}
                                  placeholder="___"
                                  maxLength={60}
                                  className={`inline-block min-w-[100px] rounded-xl border px-3 py-1 text-sm placeholder:text-ink/30 focus:outline-none transition ${
                                    correct === true
                                      ? "border-moss/40 bg-moss/10 text-moss"
                                      : correct === false
                                        ? "border-terracotta/40 bg-terracotta/10 text-terracotta"
                                        : "border-ink/20 bg-paper text-ink focus:border-gold/40"
                                  }`}
                                />
                                {checked && correct === true && (
                                  <CheckCircle size={14} weight="fill" className="absolute -right-4 text-moss" />
                                )}
                                {checked && correct === false && (
                                  <XCircle size={14} weight="fill" className="absolute -right-4 text-terracotta" />
                                )}
                              </span>
                            )}
                          </span>
                        );
                      })}
                    </div>

                    {/* Show correct answers after checking */}
                    {checked && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {item.gaps.map((gap, gIdx) => {
                          const key = `${iIdx}-${gIdx}`;
                          if (isGapCorrect(gap, key)) return null;
                          return (
                            <span key={gIdx} className="inline-flex items-center gap-1 rounded-lg border border-terracotta/20 bg-terracotta/5 px-2 py-0.5 text-xs">
                              <ArrowRight size={10} className="text-terracotta/60" />
                              <span className="font-semibold text-terracotta">{gap.answers[0]}</span>
                              {gap.answers.length > 1 && (
                                <span className="text-ink/40"> / {gap.answers.slice(1).join(" / ")}</span>
                              )}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Success / Error */}
        {successMessage && (
          <div className="rounded-2xl border border-moss/20 bg-moss/5 p-4 text-sm text-moss">
            {successMessage}
          </div>
        )}
        {error && (
          <div className="rounded-2xl border border-terracotta/20 bg-terracotta/5 p-4 text-sm text-terracotta">
            {error}
          </div>
        )}

        {/* Score after local check */}
        {checked && (
          <div className="rounded-2xl border border-gold/20 bg-gold/5 p-4 text-center">
            <p className="text-lg font-semibold">
              {correctCount} / {totalGaps}
              <span className="ml-2 text-sm font-normal text-ink/60">
                ({Math.round((correctCount / totalGaps) * 100)}%)
              </span>
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-center gap-3">
            {!checked ? (
              <button
                onClick={handleCheck}
                disabled={filledCount === 0}
                className="inline-flex items-center gap-2 rounded-full bg-gold px-6 py-3 text-sm font-semibold text-paper transition hover:bg-gold/90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <CheckCircle size={18} weight="fill" />
                <span>{locale === "pl" ? "Sprawdź" : "Перевірити"}</span>
              </button>
            ) : (
              <button
                onClick={handleCheckWithAI}
                disabled={isProcessing}
                className="inline-flex items-center gap-2 rounded-full bg-moss px-6 py-3 text-sm font-semibold text-paper transition hover:bg-moss/90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isCheckingAI ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-paper/20 border-t-paper" />
                    <span>{t.workbook.classicAiChecking}</span>
                  </>
                ) : (
                  <>
                    <Sparkle size={18} weight="fill" />
                    <span>{t.workbook.classicCheckWithAI}</span>
                  </>
                )}
              </button>
            )}

            <button
              onClick={handleSubmitForReview}
              disabled={isProcessing || filledCount === 0}
              className="inline-flex items-center gap-2 rounded-full bg-terracotta px-6 py-3 text-sm font-semibold text-paper transition hover:bg-terracotta/90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isSubmitting ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-paper/20 border-t-paper" />
                  <span>{t.workbook.classicSubmitting}</span>
                </>
              ) : (
                <>
                  <PaperPlaneRight size={18} weight="fill" />
                  <span>{t.workbook.classicSubmitForReview}</span>
                </>
              )}
            </button>
          </div>

          <p className="text-center text-xs text-ink/50">
            {t.workbook.classicCheckHint}
          </p>

          <div className="text-center text-sm text-ink/60">
            {t.workbook.clozeFilledOf
              .replace("{filled}", String(filledCount))
              .replace("{total}", String(totalGaps))}
          </div>
        </div>
      </div>

      {/* Results Modal */}
      {showResults && (
        <ClozeResults
          results={{
            mode: "classic",
            totalGaps,
            correctCount,
            score: correctCount / totalGaps,
            aiCheck: aiCheckResult,
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
