// @ts-nocheck
"use client";

import { useEffect } from "react";
import { useSentences } from "./useSentences";
import { useLocale } from "@/components/LocaleProvider";
import { CheckCircle, Circle, FloppyDisk, Sparkle } from "@phosphor-icons/react";

export default function SentencesPractice() {
  const { state, updateSentence, setActiveWord, saveEntry, countSentences, scoreForCount, generateWords, checkWithAI } =
    useSentences();
  const { t, locale } = useLocale();

  // Auto-generate words if quickStart flag is set
  useEffect(() => {
    if (state.quickStart && state.items.length === 0 && !state.isLoading) {
      generateWords();
    }
  }, [generateWords, state.isLoading, state.items.length, state.quickStart]);

  const activeWord = state.items.find((item: any) => item.id === state.activeId);
  const activeIndex = state.items.findIndex((item: any) => item.id === state.activeId);

  // Calculate total points
  const totalPoints = state.items.reduce((sum: number, item: any) => {
    const count = countSentences(item.sentences);
    return sum + scoreForCount(count);
  }, 0);

  const handleSave = async () => {
    const success = await saveEntry();
    if (success) {
      // Optionally navigate somewhere or show success
    }
  };

  if (!activeWord) {
    return (
      <div className="rounded-3xl border border-ink/10 bg-paper/80 p-8 shadow-soft text-center">
        <p className="text-sm text-ink/60">
          No words available. Please generate words first.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
      {/* Left sidebar - word list */}
      <div className="rounded-3xl border border-ink/10 bg-paper/80 p-4 shadow-soft">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs uppercase tracking-[0.3em] text-ink/40">
            {t.workbook.words}
          </p>
          <div className="text-xs text-ink/50">
            {activeIndex + 1} / {state.items.length}
          </div>
        </div>

        <div className="space-y-2">
          {state.items.map((word: any) => {
            const isActive = word.id === state.activeId;
            const sentenceCount = countSentences(word.sentences);
            const score = scoreForCount(sentenceCount);

            return (
              <button
                key={word.id}
                onClick={() => setActiveWord(word.id)}
                className={`w-full rounded-2xl border p-3 text-left transition ${
                  isActive
                    ? "border-ink bg-ink/5"
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
                  <span>{sentenceCount} / 3 sentences</span>
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
              Total
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
                {activeWord.type || activeWord.pos}
              </p>
              <h3 className="mt-2 text-2xl font-semibold text-ink">
                {activeWord.pl}
              </h3>
              <p className="mt-1 text-sm text-ink/60">{activeWord.uk}</p>
            </div>

            {/* Progress */}
            <div className="text-right">
              <p className="text-xs text-ink/50">
                Word {activeIndex + 1} of {state.items.length}
              </p>
            </div>
          </div>
        </div>

        {/* Sentence inputs */}
        <div className="rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft">
          <p className="text-xs uppercase tracking-[0.3em] text-ink/40">
            {t.workbook.write}
          </p>

          <div className="mt-4 space-y-4">
            {activeWord.sentences.map((sentence: any, index: number) => (
              <div key={index}>
                <label className="block text-xs text-ink/60 mb-2">
                  Sentence {index + 1}
                </label>
                <textarea
                  value={sentence}
                  onChange={(e) => updateSentence(activeWord.id, index, e.target.value)}
                  placeholder={t.workbook.placeholder}
                  rows={3}
                  className="w-full rounded-2xl border border-ink/20 bg-paper px-4 py-3 text-sm text-ink placeholder:text-ink/40 focus:border-ink/40 focus:outline-none focus:ring-0"
                />
              </div>
            ))}
          </div>

          {/* Recommendation */}
          <div className="mt-4 rounded-2xl border border-ink/10 bg-fog p-3">
            <div className="flex items-start gap-2">
              <Sparkle size={16} weight="fill" className="text-gold flex-shrink-0 mt-0.5" />
              <p className="text-xs text-ink/70">
                {t.workbook.recommendation}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleSave}
            disabled={state.isLoading}
            className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-semibold text-paper transition hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <FloppyDisk size={18} weight="bold" />
            <span>{t.workbook.save}</span>
          </button>

          <button
            onClick={() => checkWithAI(locale)}
            disabled={state.checkLoading || state.items.every((item: any) => !item.sentences.some((s: any) => s.trim()))}
            className="inline-flex items-center gap-2 rounded-full border border-moss/40 bg-moss/10 px-6 py-3 text-sm font-semibold text-moss transition hover:bg-moss/20 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {state.checkLoading ? (
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

          <button
            onClick={() => {
              const currentIndex = state.items.findIndex((w: any) => w.id === state.activeId);
              const nextWord = state.items[currentIndex + 1];
              if (nextWord) {
                setActiveWord(nextWord.id);
              }
            }}
            disabled={activeIndex === state.items.length - 1}
            className="inline-flex items-center gap-2 rounded-full border border-ink/20 px-6 py-3 text-sm font-semibold text-ink transition hover:bg-ink/5 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <span>Next Word</span>
            <span>→</span>
          </button>
        </div>

        {/* AI Check Results */}
        {state.checkResult && (
          <div className="rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-ink/40">AI Feedback</p>
                <div className="mt-2 flex items-center gap-3">
                  <span className="text-2xl font-bold text-moss">
                    {Math.round((state.checkResult.overall?.score01 || 0) * 100)}%
                  </span>
                  {state.checkResult.overall?.pointsForRating && (
                    <span className="rounded-full bg-gold/10 px-3 py-1 text-sm font-semibold text-gold">
                      +{state.checkResult.overall.pointsForRating.toFixed(1)} pts
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Per-word feedback */}
            <div className="space-y-4">
              {state.checkResult.items?.map((item: any, idx: number) => {
                const word = state.items.find((w) => w.id === item.wordId);
                if (!word) return null;

                return (
                  <div key={idx} className="rounded-2xl border border-ink/10 bg-fog p-4">
                    <p className="text-sm font-semibold text-ink mb-3">
                      {item.word} <span className="text-ink/50">({word.uk})</span>
                    </p>

                    <div className="space-y-3">
                      {item.sentences?.map((sent: any, sIdx: number) => {
                        const verdictColor =
                          sent.verdict === "ok"
                            ? "moss"
                            : sent.verdict === "weak"
                              ? "gold"
                              : "terracotta";

                        return (
                          <div key={sIdx} className="rounded-xl border border-ink/10 bg-paper p-3">
                            <div className="flex items-start gap-2 mb-2">
                              <Circle size={16} weight="fill" className={`text-${verdictColor} flex-shrink-0 mt-0.5`} />
                              <p className="text-sm text-ink flex-1">{sent.text}</p>
                            </div>

                            {sent.feedback && (
                              <p className="text-xs text-ink/70 ml-6">{sent.feedback}</p>
                            )}

                            {sent.improved && sent.improved !== sent.text && (
                              <div className="mt-2 ml-6 rounded-lg border border-moss/20 bg-moss/5 px-3 py-2">
                                <p className="text-[10px] uppercase tracking-[0.2em] text-moss/70 mb-1">
                                  Suggested
                                </p>
                                <p className="text-sm text-moss">{sent.improved}</p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Suggested vocab */}
            {state.checkResult.suggestedVocab && state.checkResult.suggestedVocab.length > 0 && (
              <div className="mt-4 rounded-2xl border border-moss/20 bg-moss/5 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-moss/70 mb-3">
                  Suggested Vocabulary
                </p>
                <div className="space-y-2">
                  {state.checkResult.suggestedVocab.map((vocab: any, idx: number) => (
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
