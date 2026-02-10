"use client";

import { useLocale } from "@/components/LocaleProvider";

interface DictAlphabetNavProps {
  letters: string[];
  activeLetter: string;
  onLetterChange: (letter: string) => void;
}

export default function DictAlphabetNav({
  letters,
  activeLetter,
  onLetterChange
}: DictAlphabetNavProps) {
  const { t } = useLocale();

  return (
    <div className="rounded-3xl border border-ink/10 bg-paper/80 p-5 shadow-soft">
      <div className="flex flex-wrap items-center gap-1">
        <button
          onClick={() => onLetterChange("all")}
          className={`h-9 rounded-full border px-3 text-[11px] font-semibold transition ${
            activeLetter === "all"
              ? "border-ink bg-ink text-paper"
              : "border-ink/10 bg-paper text-ink/70 hover:border-ink/30 hover:bg-ink/5"
          }`}
          aria-label="Show all letters"
          aria-pressed={activeLetter === "all"}
        >
          {t.deck.indexAll}
        </button>
        {letters.map((letter) => (
          <button
            key={`jump-${letter}`}
            onClick={() => onLetterChange(letter)}
            className={`h-9 w-9 rounded-full border text-xs font-semibold transition ${
              activeLetter === letter
                ? "border-ink bg-ink text-paper"
                : "border-ink/10 bg-paper text-ink/70 hover:border-ink/30 hover:bg-ink/5"
            }`}
            aria-label={`Jump to letter ${letter}`}
            aria-pressed={activeLetter === letter}
          >
            {letter}
          </button>
        ))}
      </div>
    </div>
  );
}
