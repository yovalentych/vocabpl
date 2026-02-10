"use client";

import { Trophy, ArrowRight, ArrowClockwise } from "@phosphor-icons/react";

interface ResultsPanelProps {
  score: number; // 0-1 range
  totalPoints?: number;
  correctCount?: number;
  totalCount?: number;
  onTryAgain?: () => void;
  onNext?: () => void;
  showTryAgain?: boolean;
  showNext?: boolean;
  customMessage?: string;
}

export default function ResultsPanel({
  score,
  totalPoints,
  correctCount,
  totalCount,
  onTryAgain,
  onNext,
  showTryAgain = true,
  showNext = false,
  customMessage
}: ResultsPanelProps) {
  const percentage = Math.round(score * 100);

  // Determine message based on score
  const getMessage = () => {
    if (customMessage) return customMessage;
    if (percentage >= 90) return "Excellent! 🎉";
    if (percentage >= 75) return "Great job! 👏";
    if (percentage >= 60) return "Good effort! 👍";
    return "Keep practicing! 💪";
  };

  // Determine color based on score
  const getColorClass = () => {
    if (percentage >= 75) return "text-moss";
    if (percentage >= 60) return "text-gold";
    return "text-terracotta";
  };

  return (
    <div className="rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft">
      {/* Trophy icon */}
      <div className="flex justify-center">
        <div className={`inline-flex h-16 w-16 items-center justify-center rounded-full bg-ink/5 ${getColorClass()}`}>
          <Trophy size={32} weight="fill" />
        </div>
      </div>

      {/* Message */}
      <p className="mt-4 text-center text-lg font-semibold text-ink">
        {getMessage()}
      </p>

      {/* Score display */}
      <div className="mt-6 space-y-3">
        {/* Percentage */}
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-ink/40">Score</p>
          <p className={`mt-1 text-4xl font-bold ${getColorClass()}`}>
            {percentage}%
          </p>
        </div>

        {/* Correct/Total if provided */}
        {correctCount !== undefined && totalCount !== undefined && (
          <div className="flex items-center justify-center gap-2 text-sm text-ink/60">
            <span className="font-semibold text-moss">{correctCount}</span>
            <span>/</span>
            <span>{totalCount}</span>
            <span>correct</span>
          </div>
        )}

        {/* Points if provided */}
        {totalPoints !== undefined && totalPoints > 0 && (
          <div className="flex items-center justify-center gap-2 rounded-full bg-gold/20 px-4 py-2">
            <span className="text-xs uppercase tracking-[0.2em] text-gold">
              Points Earned
            </span>
            <span className="text-lg font-bold text-gold">
              +{totalPoints}
            </span>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        {showTryAgain && onTryAgain && (
          <button
            onClick={onTryAgain}
            className="inline-flex items-center gap-2 rounded-full border border-ink/20 px-4 py-2 text-xs font-semibold text-ink transition hover:bg-ink/5"
          >
            <ArrowClockwise size={16} weight="bold" />
            <span>Try Again</span>
          </button>
        )}

        {showNext && onNext && (
          <button
            onClick={onNext}
            className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-xs font-semibold text-paper transition hover:bg-ink/90"
          >
            <span>Next Material</span>
            <ArrowRight size={16} weight="bold" />
          </button>
        )}
      </div>
    </div>
  );
}
