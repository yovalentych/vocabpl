"use client";

import { useAppStore } from "@/store/useAppStore";
import { useLocale } from "@/components/LocaleProvider";

export default function DeckSettings() {
  const { deckType, setDeckType, dailyGoal, setDailyGoal, displayMode, setDisplayMode } = useAppStore();
  const { t } = useLocale();

  return (
    <div className="grid gap-6 rounded-3xl border border-ink/10 bg-paper/80 p-8">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-ink/40">{t.study.deckType}</p>
        <div className="mt-3 flex flex-wrap gap-3">
          {[
            { id: "verbs", label: t.deck.verbs },
            { id: "adverbs", label: t.deck.adverbs },
            { id: "adjectives", label: t.deck.adjectives },
            { id: "test", label: t.study.placementTest }
          ].map((deck) => (
            <button
              key={deck.id}
              onClick={() => setDeckType(deck.id as typeof deckType)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                deckType === deck.id
                  ? "bg-ink text-paper"
                  : "border border-ink/20 text-ink hover:bg-ink/5"
              }`}
            >
              {deck.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-ink/40">{t.study.dailyGoal}</p>
        <div className="mt-3 flex items-center gap-4">
          <input
            type="range"
            min={5}
            max={60}
            step={5}
            value={dailyGoal}
            onChange={(event) => setDailyGoal(Number(event.target.value))}
            className="w-full accent-ink"
          />
          <span className="min-w-[3rem] text-sm font-semibold text-ink">{dailyGoal}</span>
        </div>
      </div>

      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-ink/40">{t.study.direction}</p>
        <div className="mt-3 flex gap-3">
          {[
            { id: "pl-to-uk", label: `${t.common.polish} → ${t.common.ukrainian}` },
            { id: "uk-to-pl", label: `${t.common.ukrainian} → ${t.common.polish}` }
          ].map((option) => (
            <button
              key={option.id}
              onClick={() => setDisplayMode(option.id as typeof displayMode)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                displayMode === option.id
                  ? "bg-moss text-paper"
                  : "border border-ink/20 text-ink hover:bg-ink/5"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
