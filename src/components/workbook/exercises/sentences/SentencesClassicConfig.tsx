"use client";

import { useState } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { Sparkle } from "@phosphor-icons/react";

interface SentencesClassicConfigProps {
  onStart: (config: {
    selectedTypes: string[];
    includeFavorites: boolean;
    includeMyWords: boolean;
    count: number;
  }) => void;
}

export default function SentencesClassicConfig({ onStart }: SentencesClassicConfigProps) {
  const { t } = useLocale();
  const [selectedTypes, setSelectedTypes] = useState<string[]>(["verbs", "adjectives"]);
  const [includeFavorites, setIncludeFavorites] = useState(false);
  const [includeMyWords, setIncludeMyWords] = useState(false);
  const [count, setCount] = useState(5);

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
    const selected = selectedTypes.includes(typeId)
      ? selectedTypes.filter((t) => t !== typeId)
      : [...selectedTypes, typeId];
    setSelectedTypes(selected);
  };

  const handleStart = () => {
    if (selectedTypes.length === 0 && !includeFavorites && !includeMyWords) {
      return; // Need at least one source
    }
    onStart({
      selectedTypes,
      includeFavorites,
      includeMyWords,
      count
    });
  };

  const canStart = selectedTypes.length > 0 || includeFavorites || includeMyWords;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-3xl border border-moss/20 bg-moss/5 p-6 shadow-soft">
        <p className="text-xs uppercase tracking-[0.3em] text-moss/70 mb-2">
          Крок 1: Налаштування
        </p>
        <h2 className="text-2xl font-semibold text-ink">
          Класичний режим
        </h2>
        <p className="mt-2 text-sm text-ink/60">
          Оберіть групи слів та кількість для практики
        </p>
      </div>

      {/* Word types selection */}
      <div className="rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft">
        <p className="text-xs uppercase tracking-[0.3em] text-ink/40 mb-4">
          Групи слів
        </p>

        <div className="flex flex-wrap gap-2">
          {typeOptions.map((option) => {
            const isSelected = selectedTypes.includes(option.id);

            return (
              <button
                key={option.id}
                onClick={() => handleToggleType(option.id)}
                className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                  isSelected
                    ? "bg-moss text-paper"
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
        <p className="text-xs uppercase tracking-[0.3em] text-ink/40 mb-4">
          Додаткові опції
        </p>

        <div className="space-y-3">
          {/* Include favorites */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={includeFavorites}
              onChange={(e) => setIncludeFavorites(e.target.checked)}
              className="h-4 w-4 rounded accent-moss"
            />
            <span className="text-sm text-ink">Включити улюблені слова</span>
          </label>

          {/* Include my words */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={includeMyWords}
              onChange={(e) => setIncludeMyWords(e.target.checked)}
              className="h-4 w-4 rounded accent-moss"
            />
            <span className="text-sm text-ink">Включити мої власні слова</span>
          </label>
        </div>
      </div>

      {/* Word count */}
      <div className="rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft">
        <p className="text-xs uppercase tracking-[0.3em] text-ink/40 mb-4">
          Кількість слів
        </p>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-ink">{count}</span>
            <span className="text-xs text-ink/50">слів</span>
          </div>

          <input
            type="range"
            min={3}
            max={15}
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            className="w-full accent-moss"
          />

          <div className="flex justify-between text-xs text-ink/40">
            <span>3</span>
            <span>15</span>
          </div>
        </div>
      </div>

      {/* Recommendation */}
      <div className="rounded-2xl border border-moss/20 bg-moss/5 p-4">
        <div className="flex items-start gap-3">
          <Sparkle size={20} weight="fill" className="text-moss flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-moss mb-1">Порада</p>
            <p className="text-xs text-ink/70">
              Для ефективного навчання рекомендуємо складати по 3 речення для кожного слова.
              Намагайтеся використовувати різні конструкції та контексти.
            </p>
          </div>
        </div>
      </div>

      {/* Start button */}
      <div className="flex justify-center">
        <button
          onClick={handleStart}
          disabled={!canStart}
          className="inline-flex items-center gap-2 rounded-full bg-moss px-8 py-3 text-sm font-semibold text-paper transition hover:bg-moss/90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <span>Почати практику</span>
          <span>→</span>
        </button>
      </div>

      {!canStart && (
        <p className="text-center text-xs text-terracotta">
          Оберіть хоча б одну групу слів або увімкніть одну з додаткових опцій
        </p>
      )}
    </div>
  );
}
