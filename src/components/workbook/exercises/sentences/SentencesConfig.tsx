"use client";

import { useSentences } from "./useSentences";
import { useWorkbookContext } from "../../WorkbookContext";
import { useLocale } from "@/components/LocaleProvider";
import { Sparkle } from "@phosphor-icons/react";

export default function SentencesConfig() {
  const { dispatch } = useWorkbookContext();
  const { state, generateWords, updateConfig } = useSentences();
  const { t } = useLocale();

  const typeOptions = [
    { id: "verbs", label: t.deck.verbs },
    { id: "adverbs", label: t.deck.adverbs },
    { id: "adjectives", label: t.deck.adjectives },
    { id: "slang", label: t.deck.slang },
    { id: "others", label: t.deck.others },
    { id: "soft_swears", label: t.deck.softSwears },
    { id: "clean_emotions", label: t.deck.cleanEmotions },
    { id: "abbreviations", label: t.deck.abbreviations }
  ];

  const handleToggleType = (typeId: string) => {
    const selected = state.selectedTypes.includes(typeId)
      ? state.selectedTypes.filter((t: string) => t !== typeId)
      : [...state.selectedTypes, typeId];

    updateConfig({ selectedTypes: selected });
  };

  const handleStartPractice = async () => {
    // Generate words first
    await generateWords();
    // Then go to practice step
    dispatch({ type: "GO_TO_PRACTICE" });
  };

  return (
    <div className="space-y-6">
      {/* Word types selection */}
      <div className="rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft">
        <p className="text-xs uppercase tracking-[0.3em] text-ink/40">
          {t.workbook.chooseGroups}
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {typeOptions.map((option) => {
            const isSelected = state.selectedTypes.includes(option.id);

            return (
              <button
                key={option.id}
                onClick={() => handleToggleType(option.id)}
                className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                  isSelected
                    ? "bg-ink text-paper"
                    : "border border-ink/20 text-ink hover:bg-ink/5"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Additional options */}
      <div className="rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft">
        <div className="space-y-3">
          {/* Include favorites */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={state.includeFavorites}
              onChange={(e) => updateConfig({ includeFavorites: e.target.checked })}
              className="h-4 w-4 rounded accent-ink"
            />
            <span className="text-sm text-ink">{t.workbook.includeFavorites}</span>
          </label>

          {/* Include my words */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={state.includeMyWords}
              onChange={(e) => updateConfig({ includeMyWords: e.target.checked })}
              className="h-4 w-4 rounded accent-ink"
            />
            <span className="text-sm text-ink">{t.workbook.includeMyWords}</span>
          </label>
        </div>
      </div>

      {/* Word count */}
      <div className="rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft">
        <p className="text-xs uppercase tracking-[0.3em] text-ink/40">
          {t.workbook.wordCount}
        </p>

        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-ink">{state.count}</span>
            <span className="text-xs text-ink/50">{t.common.words}</span>
          </div>

          <input
            type="range"
            min={1}
            max={state.locked ? 2 : 50}
            value={state.count}
            onChange={(e) => updateConfig({ count: Number(e.target.value) })}
            className="w-full accent-ink"
          />

          <div className="flex justify-between text-xs text-ink/40">
            <span>1</span>
            <span>{state.locked ? `2 (${t.workbook.freeLimit})` : "50"}</span>
          </div>
        </div>

        {state.locked && (
          <div className="mt-4 rounded-2xl border border-terracotta/40 bg-terracotta/10 p-3 text-xs text-terracotta">
            {t.workbook.locked}
          </div>
        )}
      </div>

      {/* Recommendation */}
      <div className="rounded-2xl border border-ink/10 bg-fog p-4">
        <div className="flex items-start gap-3">
          <Sparkle size={20} weight="fill" className="text-gold flex-shrink-0 mt-0.5" />
          <p className="text-xs text-ink/70">{t.workbook.recommendation}</p>
        </div>
      </div>

      {/* Start button */}
      <div className="flex justify-center">
        <button
          onClick={handleStartPractice}
          disabled={state.isLoading}
          className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-semibold text-paper transition hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {state.isLoading ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-paper/20 border-t-paper" />
              <span>{t.workbook.generating}</span>
            </>
          ) : (
            <>
              <span>{t.workbook.startPractice}</span>
              <span>→</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
