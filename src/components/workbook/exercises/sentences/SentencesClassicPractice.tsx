// @ts-nocheck
"use client";

import { useState, useEffect } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { CheckCircle, Circle, Sparkle, PaperPlaneRight } from "@phosphor-icons/react";
import { countSentences, scoreForCount, safeParseAIResponse } from "@/lib/workbook";
import { calculatePoints } from "@/lib/scoring";
import SentencesResults from "./SentencesResults";

interface Word {
  id: string;
  pl: string;
  uk: string;
  type: string;
  sentences: string[];
}

interface SentencesClassicPracticeProps {
  config: {
    selectedTypes: string[];
    includeFavorites: boolean;
    includeMyWords: boolean;
    count: number;
  };
  onComplete: () => void;
}

export default function SentencesClassicPractice({ config, onComplete }: SentencesClassicPracticeProps) {
  const { t } = useLocale();
  const [words, setWords] = useState<Word[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingAI, setIsCheckingAI] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const isProcessing = isCheckingAI || isSubmitting;

  // Load words from API
  useEffect(() => {
    let cancelled = false;

    async function loadWords() {
      try {
        const selected = [...config.selectedTypes];
        if (config.includeFavorites) selected.push("favorites");
        if (config.includeMyWords) selected.push("my_words");

        const params = new URLSearchParams();
        params.set("types", selected.join(","));
        params.set("count", String(config.count));

        const res = await fetch(`/api/workbook/words?${params.toString()}`);
        if (cancelled) return;

        if (!res.ok) {
          setError(t.workbook.sentencesLoadError);
          return;
        }

        const data = await res.json();
        const items: Word[] = (data.items || []).map((word: any) => ({
          ...word,
          sentences: ["", "", ""]
        }));

        setWords(items);
        setActiveId(items[0]?.id || null);
      } catch (err) {
        if (!cancelled) {
          console.error("Failed to load words:", err);
          setError(t.workbook.sentencesNetworkError);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadWords();
    return () => { cancelled = true; };
  }, [config.selectedTypes.join(","), config.includeFavorites, config.includeMyWords, config.count]);

  const activeWord = words.find((w) => w.id === activeId);
  const activeIndex = words.findIndex((w) => w.id === activeId);

  const updateSentence = (wordId: string, index: number, value: string) => {
    setWords((prev) =>
      prev.map((word) => {
        if (word.id === wordId) {
          const sentences = [...word.sentences];
          sentences[index] = value;
          return { ...word, sentences };
        }
        return word;
      })
    );
  };

  const totalPoints = words.reduce((sum, word) => {
    const count = countSentences(word.sentences);
    return sum + scoreForCount(count);
  }, 0);

  const handleCheckWithAI = async () => {
    const completed = words.filter((word) => countSentences(word.sentences) > 0);

    if (completed.length === 0) {
      setError(t.workbook.sentencesWriteAtLeastOne);
      return;
    }

    setIsCheckingAI(true);
    setError(null);

    try {
      const items = completed.map((word) => ({
        word: word.pl,
        translation: word.uk,
        sentences: word.sentences.filter(s => s.trim())
      }));

      const res = await fetch("/api/ai/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "sentences_check",
          userInput: JSON.stringify({
            exerciseType: "sentences",
            action: "check",
            items
          }),
          context: JSON.stringify({ uiLanguage: t.locale || "uk" })
        })
      });

      if (!res.ok) {
        let data = {};
        try { data = await res.json(); } catch {}
        const errorCode = data?.code;
        const message =
          errorCode === "ai_quota"
            ? t.workbook.classicAiQuotaError
            : errorCode === "pvs_unavailable"
              ? t.workbook.classicAiPlanRequired
              : data?.error || t.workbook.classicAiError;
        setError(message);
        return;
      }

      const data = await res.json();
      const result = safeParseAIResponse(data?.text);

      if (!result || !result.items) {
        setError(t.workbook.classicAiFormatError);
        return;
      }

      // Save points to database
      if (result?.overall?.score01 != null) {
        await fetch("/api/exercises/attempt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            exercise: "sentences",
            points: calculatePoints({ score01: result.overall.score01, level: config.level, itemCount: words.length, exercise: "sentences" })
          })
        });
      }

      // Show results
      const totalSentences = completed.reduce((sum, word) => sum + countSentences(word.sentences), 0);
      setResults({
        mode: "classic",
        totalWords: words.length,
        totalSentences,
        aiCheck: result
      });
      setShowResults(true);
    } catch (err) {
      console.error("Failed to check with AI:", err);
      setError(t.workbook.classicCheckError);
    } finally {
      setIsCheckingAI(false);
    }
  };

  const handleSubmitForReview = async () => {
    const completed = words.filter((word) => countSentences(word.sentences) > 0);

    if (completed.length === 0) {
      setError(t.workbook.sentencesWriteAtLeastOne);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/workbook/exercises/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exerciseType: "sentences",
          items: completed.map((word) => ({
            word: word.pl,
            translation: word.uk,
            sentences: word.sentences.filter(s => s.trim())
          }))
        })
      });

      if (!res.ok) {
        let data = {};
        try { data = await res.json(); } catch {}
        setError(data?.error || t.workbook.classicSubmitError);
        return;
      }

      // Save minimal points for submission
      const totalSentences = completed.reduce((sum, word) => sum + countSentences(word.sentences), 0);
      await fetch("/api/exercises/attempt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exercise: "sentences",
          points: calculatePoints({ score01: 0.5, level: config.level, itemCount: words.length, exercise: "sentences" })
        })
      });

      setSuccessMessage(t.workbook.classicSubmitSuccess);
      setTimeout(() => onComplete(), 2000);
    } catch (err) {
      console.error("Failed to submit:", err);
      setError(t.workbook.classicSubmitError);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-3xl border border-ink/10 bg-paper/80 p-8 shadow-soft text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-moss/20 border-t-moss mx-auto" />
        <p className="mt-4 text-sm text-ink/60">{t.common.loading}</p>
      </div>
    );
  }

  if (!activeWord) {
    return (
      <div className="rounded-3xl border border-ink/10 bg-paper/80 p-8 shadow-soft text-center">
        <p className="text-sm text-ink/60 mb-4">
          {t.workbook.sentencesNoWords}
        </p>
        <button
          onClick={onComplete}
          className="inline-flex items-center gap-2 rounded-full border border-ink/20 px-4 py-2 text-xs font-semibold text-ink transition hover:bg-ink/5"
        >
          {t.workbook.classicGoBack}
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-6 grid-cols-1 md:grid-cols-[260px_1fr] lg:grid-cols-[300px_1fr]">
        {/* Left sidebar - word list */}
        <div className="rounded-3xl border border-ink/10 bg-paper/80 p-4 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs uppercase tracking-[0.3em] text-ink/40">
              {t.workbook.sentencesWordsLabel}
            </p>
            <div className="text-xs text-ink/50">
              {activeIndex + 1} / {words.length}
            </div>
          </div>

          <div className="space-y-2">
            {words.map((word) => {
              const isActive = word.id === activeId;
              const sentenceCount = countSentences(word.sentences);
              const score = scoreForCount(sentenceCount);

              return (
                <button
                  key={word.id}
                  onClick={() => setActiveId(word.id)}
                  className={`w-full rounded-2xl border p-3 text-left transition ${
                    isActive
                      ? "border-moss bg-moss/5"
                      : "border-ink/10 hover:border-ink/30 hover:bg-paper"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-ink truncate">
                        {word.pl}
                      </p>
                      <p className="text-xs text-ink/60 truncate">{word.uk}</p>
                    </div>

                    {/* Status indicator */}
                    <div className="flex-shrink-0">
                      {sentenceCount >= 3 ? (
                        <CheckCircle size={18} weight="fill" className="text-moss" />
                      ) : sentenceCount > 0 ? (
                        <Circle size={18} weight="fill" className="text-gold/50" />
                      ) : (
                        <Circle size={18} className="text-ink/20" />
                      )}
                    </div>
                  </div>

                  {/* Sentence count */}
                  <div className="mt-2 flex items-center gap-2 text-xs text-ink/50">
                    <span>{sentenceCount} / 3 {t.workbook.sentencesSentencesOf}</span>
                    {score > 0 && (
                      <span className="text-gold">+{score} pts</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Total points */}
          <div className="mt-4 rounded-2xl border border-ink/10 bg-fog p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-[0.2em] text-ink/40">
                {t.workbook.classicTotal}
              </span>
              <span className="text-lg font-bold text-gold">
                {totalPoints.toFixed(1)} pts
              </span>
            </div>
          </div>
        </div>

        {/* Right panel - sentence input */}
        <div className="space-y-6">
          {/* Active word card */}
          <div className="rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-ink/40">
                  {activeWord.type}
                </p>
                <h3 className="mt-2 text-2xl font-semibold text-ink">
                  {activeWord.pl}
                </h3>
                <p className="mt-1 text-sm text-ink/60">{activeWord.uk}</p>
              </div>

              {/* Progress */}
              <div className="text-right">
                <p className="text-xs text-ink/50">
                  {t.workbook.sentencesWordOf.replace("{current}", String(activeIndex + 1)).replace("{total}", String(words.length))}
                </p>
              </div>
            </div>
          </div>

          {/* Sentence inputs */}
          <div className="rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft">
            <p className="text-xs uppercase tracking-[0.3em] text-ink/40 mb-4">
              {t.workbook.sentencesWriteSentences}
            </p>

            <div className="space-y-4">
              {activeWord.sentences.map((sentence, index) => (
                <div key={index}>
                  <label className="block text-xs text-ink/60 mb-2">
                    {t.workbook.sentencesSentenceN.replace("{n}", String(index + 1))}
                  </label>
                  <textarea
                    value={sentence}
                    onChange={(e) => updateSentence(activeWord.id, index, e.target.value)}
                    placeholder={t.workbook.sentencesPlaceholder}
                    rows={3}
                    maxLength={500}
                    className="w-full rounded-2xl border border-ink/20 bg-paper px-4 py-3 text-sm text-ink placeholder:text-ink/40 focus:border-moss/40 focus:outline-none focus:ring-0"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Success message */}
          {successMessage && (
            <div className="rounded-2xl border border-moss/20 bg-moss/5 p-4 text-sm text-moss">
              {successMessage}
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="rounded-2xl border border-terracotta/20 bg-terracotta/5 p-4 text-sm text-terracotta">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleCheckWithAI}
                disabled={isProcessing || totalPoints === 0}
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

              <button
                onClick={handleSubmitForReview}
                disabled={isProcessing || totalPoints === 0}
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

              <button
                onClick={() => {
                  const currentIndex = words.findIndex((w) => w.id === activeId);
                  const nextWord = words[currentIndex + 1];
                  if (nextWord) {
                    setActiveId(nextWord.id);
                  }
                }}
                disabled={activeIndex === words.length - 1}
                className="inline-flex items-center gap-2 rounded-full border border-ink/20 px-6 py-3 text-sm font-semibold text-ink transition hover:bg-ink/5 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <span>{t.workbook.sentencesNextWord}</span>
                <span>→</span>
              </button>
            </div>

            <p className="text-xs text-ink/50">
              {t.workbook.classicCheckHint}
            </p>
          </div>
        </div>
      </div>

      {/* Results Modal */}
      {showResults && results && (
        <SentencesResults
          results={results}
          onClose={() => {
            setShowResults(false);
            onComplete();
          }}
        />
      )}
    </>
  );
}
