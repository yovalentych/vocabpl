"use client";

import { X, Lightbulb, Plus, Check } from "@phosphor-icons/react";
import { useState } from "react";
import type { AIExplanation } from "./hooks/useReadingAI";
import Loader from "@/components/ui/Loader";
import { useLocale } from "@/components/LocaleProvider";

interface ReadingExplainerProps {
  isOpen: boolean;
  fragment: string;
  explanation: AIExplanation | null;
  loading: boolean;
  error: string | null;
  onClose: () => void;
  onRetry?: () => void;
}

export default function ReadingExplainer({
  isOpen,
  fragment,
  explanation,
  loading,
  error,
  onClose,
  onRetry
}: ReadingExplainerProps) {
  const { t } = useLocale();
  const [addedExamples, setAddedExamples] = useState<Set<number>>(new Set());
  const [addingExample, setAddingExample] = useState<number | null>(null);

  if (!isOpen) return null;

  async function handleAddExample(example: string, idx: number) {
    if (addedExamples.has(idx)) return;

    setAddingExample(idx);
    try {
      const words = example.match(/\b[a-ząćęłńóśźż]+\b/gi) || [];

      const res = await fetch("/api/user/vocabulary/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pl: fragment, uk: "" })
      });

      if (res.ok) {
        setAddedExamples(prev => new Set([...prev, idx]));
      }
    } catch (err) {
      console.error("Failed to add example:", err);
    } finally {
      setAddingExample(null);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-gold/20 bg-paper p-6 shadow-2xl">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gold/10">
              <Lightbulb size={24} weight="fill" className="text-gold" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">{t.reading.explanation}</h2>
              <p className="text-sm text-ink/60">&quot;{fragment}&quot;</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-ink/10 transition hover:bg-ink/5"
          >
            <X size={20} weight="bold" className="text-ink/60" />
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="mt-8 text-center">
            <Loader label={t.reading.gettingExplanation} />
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="mt-6 rounded-2xl border border-terracotta/20 bg-terracotta/5 p-4">
            <p className="text-sm font-medium text-terracotta">{error}</p>
            {onRetry && (
              <button
                onClick={onRetry}
                className="mt-3 text-xs font-semibold text-terracotta underline hover:no-underline"
              >
                {t.common.retry}
              </button>
            )}
          </div>
        )}

        {/* Explanation Content */}
        {explanation && !loading && (
          <div className="mt-6 space-y-6">
            {/* Overall Explanation */}
            <div className="rounded-2xl border border-gold/20 bg-gold/5 p-4">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold/70">
                {t.reading.overallExplanation}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-ink/80">
                {explanation.explanation}
              </p>
            </div>

            {/* Breakdown */}
            <div className="space-y-4">
              {/* Grammar */}
              {explanation.breakdown.grammar && (
                <div className="rounded-2xl border border-ink/10 bg-paper/80 p-4">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-moss"></div>
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-ink/40">
                      {t.reading.grammar}
                    </p>
                  </div>
                  <p className="mt-2 text-sm text-ink/70">
                    {explanation.breakdown.grammar}
                  </p>
                </div>
              )}

              {/* Vocabulary */}
              {explanation.breakdown.vocabulary && (
                <div className="rounded-2xl border border-ink/10 bg-paper/80 p-4">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-gold"></div>
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-ink/40">
                      {t.reading.vocabulary}
                    </p>
                  </div>
                  <p className="mt-2 text-sm text-ink/70">
                    {explanation.breakdown.vocabulary}
                  </p>
                </div>
              )}

              {/* Context */}
              {explanation.breakdown.context && (
                <div className="rounded-2xl border border-ink/10 bg-paper/80 p-4">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-terracotta"></div>
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-ink/40">
                      {t.reading.context}
                    </p>
                  </div>
                  <p className="mt-2 text-sm text-ink/70">
                    {explanation.breakdown.context}
                  </p>
                </div>
              )}
            </div>

            {/* Examples */}
            {explanation.examples && explanation.examples.length > 0 && (
              <div className="rounded-2xl border border-moss/20 bg-moss/5 p-4">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-moss/70">
                  {t.reading.usageExamples}
                </p>
                <div className="mt-4 space-y-3">
                  {explanation.examples.map((example, idx) => (
                    <div
                      key={idx}
                      className="flex items-start justify-between gap-3 rounded-xl border border-ink/10 bg-paper p-3"
                    >
                      <p className="flex-1 text-sm text-ink/80">
                        <span className="mr-2 font-semibold text-moss">{idx + 1}.</span>
                        {example}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Close Button */}
        <div className="mt-6">
          <button
            onClick={onClose}
            className="w-full rounded-full bg-ink px-6 py-3 text-sm font-semibold text-paper transition hover:bg-ink/90"
          >
            {t.common.understood}
          </button>
        </div>
      </div>
    </div>
  );
}
