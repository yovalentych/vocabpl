"use client";

import { ArrowLeft, ArrowRight, X } from "@phosphor-icons/react";

interface TrainingControlsProps {
  currentIndex: number;
  totalCount: number;
  onPrevious?: () => void;
  onNext?: () => void;
  onExit?: () => void;
  showProgress?: boolean;
  disabled?: boolean;
}

export default function TrainingControls({
  currentIndex,
  totalCount,
  onPrevious,
  onNext,
  onExit,
  showProgress = true,
  disabled = false
}: TrainingControlsProps) {
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex < totalCount - 1;
  const progress = totalCount > 0 ? ((currentIndex + 1) / totalCount) * 100 : 0;

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      {showProgress && totalCount > 0 && (
        <div>
          <div className="flex items-center justify-between text-xs text-ink/50">
            <span>Progress</span>
            <span>
              {currentIndex + 1} / {totalCount}
            </span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-ink/10">
            <div
              className="h-full rounded-full bg-moss transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Control buttons */}
      <div className="flex items-center justify-between gap-3">
        {/* Previous button */}
        {onPrevious && (
          <button
            onClick={onPrevious}
            disabled={!hasPrevious || disabled}
            className="inline-flex items-center gap-2 rounded-full border border-ink/20 px-4 py-2 text-xs font-semibold text-ink transition hover:bg-ink/5 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ArrowLeft size={16} weight="bold" />
            <span>Previous</span>
          </button>
        )}

        {/* Exit button */}
        {onExit && (
          <button
            onClick={onExit}
            disabled={disabled}
            className="inline-flex items-center gap-2 rounded-full border border-ink/20 px-3 py-2 text-xs font-semibold text-ink transition hover:bg-ink/5 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <X size={16} weight="bold" />
            <span className="sr-only">Exit</span>
          </button>
        )}

        {/* Next button */}
        {onNext && (
          <button
            onClick={onNext}
            disabled={!hasNext || disabled}
            className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-xs font-semibold text-paper transition hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <span>Next</span>
            <ArrowRight size={16} weight="bold" />
          </button>
        )}
      </div>

      {/* Indicator dots (alternative visualization) */}
      {totalCount <= 10 && totalCount > 0 && (
        <div className="flex items-center justify-center gap-1.5">
          {Array.from({ length: totalCount }).map((_, index) => (
            <div
              key={index}
              className={`h-1.5 w-1.5 rounded-full transition-all ${
                index === currentIndex
                  ? "w-6 bg-ink"
                  : index < currentIndex
                  ? "bg-moss"
                  : "bg-ink/10"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
