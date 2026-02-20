"use client";

import { useState } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { X, Trophy, Sparkle, ArrowsClockwise, Plus, Check } from "@phosphor-icons/react";

interface StoryFeedback {
  score: number;
  overall: string;
  suggestions: string[];
  vocabulary?: { pl: string; uk: string }[];
}

interface StoryResultModalProps {
  isOpen: boolean;
  feedback: StoryFeedback | null;
  points: number;
  onClose: () => void;
  onTryAgain: () => void;
}

export default function StoryResultModal({
  isOpen,
  feedback,
  points,
  onClose,
  onTryAgain
}: StoryResultModalProps) {
  const { t } = useLocale();
  const [addedWords, setAddedWords] = useState<Set<string>>(new Set());
  const [addingWord, setAddingWord] = useState<string | null>(null);

  if (!isOpen || !feedback) return null;

  const addVocabWord = async (pl: string, uk: string) => {
    setAddingWord(pl);
    try {
      const res = await fetch("/api/user/words/custom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pl, uk })
      });

      if (res.ok || res.status === 409) {
        setAddedWords(prev => new Set([...prev, pl]));
      }
    } catch (error) {
      console.error("Failed to add word:", error);
    } finally {
      setAddingWord(null);
    }
  };

  const addAllWords = async () => {
    if (!feedback.vocabulary) return;

    await Promise.all(
      feedback.vocabulary
        .filter(vocab => !addedWords.has(vocab.pl))
        .map(vocab => addVocabWord(vocab.pl, vocab.uk))
    );
  };

  // Calculate score percentage for visual feedback
  const scorePercentage = feedback.score * 100;

  // Determine feedback color and emoji
  let feedbackColor = "text-moss";
  let feedbackEmoji = "🎉";
  let feedbackTitle: string = t.workbook.excellentWork;

  if (scorePercentage >= 80) {
    feedbackColor = "text-moss";
    feedbackEmoji = "🎉";
    feedbackTitle = t.workbook.excellentWork;
  } else if (scorePercentage >= 60) {
    feedbackColor = "text-gold";
    feedbackEmoji = "👍";
    feedbackTitle = t.workbook.goodWork;
  } else if (scorePercentage >= 40) {
    feedbackColor = "text-orange-500";
    feedbackEmoji = "💪";
    feedbackTitle = t.workbook.keepGoing;
  } else {
    feedbackColor = "text-terracotta";
    feedbackEmoji = "📚";
    feedbackTitle = t.workbook.practiceMore;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 px-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-ink/10 bg-paper shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-ink/10 bg-paper px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-moss/10">
              <Sparkle size={24} weight="fill" className="text-moss" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-ink">{feedbackTitle}</h2>
              <p className="text-sm text-ink/60">{t.workbook.resultsTitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-ink/10 transition hover:bg-ink/5"
          >
            <X size={20} weight="bold" className="text-ink/60" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-6 p-6">
          {/* Score Card */}
          <div className="rounded-3xl border border-ink/10 bg-gradient-to-br from-moss/5 to-moss/10 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-6xl">{feedbackEmoji}</div>
                <div>
                  <p className="text-sm uppercase tracking-wider text-ink/60">{t.workbook.scoreLabel}</p>
                  <p className={`text-5xl font-bold ${feedbackColor}`}>
                    {Math.round(feedback.score * 10)}/10
                  </p>
                  <p className="mt-1 text-sm text-ink/60">{scorePercentage.toFixed(0)}%</p>
                </div>
              </div>

              {/* Points earned */}
              <div className="text-right">
                <div className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-4 py-2">
                  <Trophy size={20} weight="fill" className="text-gold" />
                  <span className="text-xl font-bold text-gold">+{points}</span>
                </div>
                <p className="mt-2 text-xs text-ink/60">{t.workbook.pointsToRating}</p>
              </div>
            </div>
          </div>

          {/* Overall Feedback */}
          {feedback.overall && (
            <div className="rounded-2xl border border-ink/10 bg-paper/80 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-ink/40">
                {t.workbook.feedbackLabel}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-ink/80">
                {feedback.overall}
              </p>
            </div>
          )}

          {/* Suggestions */}
          {feedback.suggestions && feedback.suggestions.length > 0 && (
            <div className="rounded-2xl border border-moss/20 bg-moss/5 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-moss/60">
                {t.workbook.improvementTips}
              </p>
              <ul className="mt-3 space-y-2">
                {feedback.suggestions.map((suggestion, idx) => (
                  <li key={idx} className="text-sm text-ink">
                    • {suggestion}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Vocabulary Suggestions */}
          {feedback.vocabulary && feedback.vocabulary.length > 0 && (
            <div className="rounded-2xl border border-ink/10 bg-paper/80 p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.3em] text-ink/40">
                  {t.workbook.recommendedWords}
                </p>
                <button
                  onClick={addAllWords}
                  disabled={feedback.vocabulary.every(v => addedWords.has(v.pl))}
                  className="text-xs font-semibold text-moss hover:underline disabled:opacity-50"
                >
                  {t.workbook.addAll}
                </button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {feedback.vocabulary.map((vocab, idx) => {
                  const isAdded = addedWords.has(vocab.pl);
                  const isAdding = addingWord === vocab.pl;

                  return (
                    <button
                      key={idx}
                      onClick={() => !isAdded && addVocabWord(vocab.pl, vocab.uk)}
                      disabled={isAdded || isAdding}
                      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition ${
                        isAdded
                          ? "border-moss/30 bg-moss/10 text-moss"
                          : "border-ink/10 bg-paper hover:border-moss/30 hover:bg-moss/5"
                      }`}
                    >
                      <span className="font-semibold">{vocab.pl}</span>
                      <span className="text-ink/40">→</span>
                      <span>{vocab.uk}</span>
                      {isAdded ? (
                        <Check size={14} weight="bold" className="text-moss" />
                      ) : (
                        <Plus size={14} weight="bold" className="text-ink/40" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 flex gap-3 border-t border-ink/10 bg-paper px-6 py-4">
          <button
            onClick={onTryAgain}
            className="flex flex-1 items-center justify-center gap-2 rounded-full border border-ink/20 bg-paper px-6 py-3 text-sm font-semibold text-ink transition hover:bg-ink/5"
          >
            <ArrowsClockwise size={18} weight="bold" />
            {t.workbook.writeNew}
          </button>
          <button
            onClick={onClose}
            className="flex flex-1 items-center justify-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-semibold text-paper transition hover:bg-ink/90"
          >
            {t.workbook.thankYou}
          </button>
        </div>
      </div>
    </div>
  );
}
