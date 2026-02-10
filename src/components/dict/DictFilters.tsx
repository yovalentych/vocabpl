"use client";

import { useLocale } from "@/components/LocaleProvider";

interface DictFiltersProps {
  type: string;
  search: string;
  sort: "plAsc" | "plDesc" | "ukAsc" | "ukDesc";
  hideTranslations: boolean;
  showControls: boolean;
  locked: boolean;
  onTypeChange: (type: string) => void;
  onSearchChange: (search: string) => void;
  onSortChange: (sort: string) => void;
  onHideTranslationsChange: (hide: boolean) => void;
  onToggleControls: () => void;
  onOpenTrainer: () => void;
}

export default function DictFilters({
  type,
  search,
  sort,
  hideTranslations,
  showControls,
  locked,
  onTypeChange,
  onSearchChange,
  onSortChange,
  onHideTranslationsChange,
  onToggleControls,
  onOpenTrainer
}: DictFiltersProps) {
  const { t } = useLocale();

  return (
    <div className={`space-y-4 ${locked ? "opacity-60" : ""}`}>
      <div className="flex flex-wrap gap-2">
        {[
          { id: "all", label: t.deck.all },
          { id: "verbs", label: t.deck.verbs },
          { id: "adverbs", label: t.deck.adverbs },
          { id: "adjectives", label: t.deck.adjectives },
          { id: "slang", label: t.deck.slang },
          { id: "others", label: t.deck.others },
          { id: "soft_swears", label: t.deck.softSwears },
          { id: "clean_emotions", label: t.deck.cleanEmotions },
          { id: "abbreviations", label: t.deck.abbreviations },
          { id: "aspect_pairs", label: t.deck.aspectPairs },
          { id: "favorites", label: t.cabinet.tabs.favorites },
          { id: "my_words", label: t.words.myWords }
        ].map((option) => (
          <button
            key={option.id}
            onClick={() => onTypeChange(option.id)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              type === option.id
                ? "bg-ink text-paper"
                : "border border-ink/20 text-ink hover:bg-ink/5"
            }`}
            aria-label={`Filter by ${option.label}`}
            aria-pressed={type === option.id}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
        <input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={t.common.search}
          className="w-full rounded-full border border-ink/20 bg-paper px-4 py-2 text-sm transition focus:border-ink/30 focus:outline-none"
          aria-label="Search words"
        />
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onToggleControls}
            className="rounded-full border border-ink/20 px-4 py-2 text-xs font-semibold text-ink transition hover:bg-ink/5"
            aria-label="Toggle controls"
            aria-pressed={showControls}
          >
            {t.deck.controls}
          </button>
          <button
            onClick={onOpenTrainer}
            className="rounded-full border border-ink/20 px-4 py-2 text-xs font-semibold text-ink transition hover:bg-ink/5 disabled:opacity-60"
            disabled={locked}
            aria-label="Open trainer"
          >
            {t.deck.trainerOpen}
          </button>
        </div>
      </div>

      {showControls && (
        <div className="flex flex-wrap items-center gap-3 rounded-3xl border border-ink/10 bg-paper/70 px-4 py-3 text-xs text-ink/70 shadow-soft">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-[0.2em] text-ink/40">
              {t.deck.sortLabel}
            </span>
            <select
              value={sort}
              onChange={(event) => onSortChange(event.target.value)}
              className="rounded-full border border-ink/20 bg-paper px-3 py-2 text-xs transition focus:border-ink/30 focus:outline-none"
              aria-label="Sort order"
            >
              <option value="plAsc">{t.deck.sortOptions.plAsc}</option>
              <option value="plDesc">{t.deck.sortOptions.plDesc}</option>
              <option value="ukAsc">{t.deck.sortOptions.ukAsc}</option>
              <option value="ukDesc">{t.deck.sortOptions.ukDesc}</option>
            </select>
          </div>
          <label className="flex items-center gap-2 text-xs text-ink/60">
            <input
              type="checkbox"
              checked={hideTranslations}
              onChange={(event) => onHideTranslationsChange(event.target.checked)}
              className="accent-ink"
              aria-label="Hide translations"
            />
            {t.common.hideTranslation}
          </label>
        </div>
      )}
    </div>
  );
}
