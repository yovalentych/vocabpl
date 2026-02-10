"use client";

import { useState } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { Sparkle } from "@phosphor-icons/react";

interface ClozeClassicConfigProps {
  onStart: (config: {
    level: "A1" | "A2" | "B1" | "B2";
    sentenceCount: number;
  }) => void;
}

export default function ClozeClassicConfig({ onStart }: ClozeClassicConfigProps) {
  const { t } = useLocale();
  const [level, setLevel] = useState<"A1" | "A2" | "B1" | "B2">("A2");
  const [sentenceCount, setSentenceCount] = useState(8);

  const handleStart = () => {
    onStart({ level, sentenceCount });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-3xl border border-gold/20 bg-gold/5 p-6 shadow-soft">
        <p className="text-xs uppercase tracking-[0.3em] text-gold/70 mb-2">
          Крок 1: Налаштування
        </p>
        <h2 className="text-2xl font-semibold text-ink">
          Класичний режим
        </h2>
        <p className="mt-2 text-sm text-ink/60">
          Оберіть рівень та кількість речень з пропусками
        </p>
      </div>

      {/* Level selection */}
      <div className="rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft">
        <p className="text-xs uppercase tracking-[0.3em] text-ink/40 mb-4">
          Рівень складності
        </p>

        <div className="grid grid-cols-4 gap-3">
          {(["A1", "A2", "B1", "B2"] as const).map((lvl) => (
            <button
              key={lvl}
              onClick={() => setLevel(lvl)}
              className={`rounded-2xl border p-4 text-center transition ${
                level === lvl
                  ? "border-gold bg-gold text-paper"
                  : "border-ink/20 text-ink hover:bg-ink/5"
              }`}
            >
              <div className="text-xl font-bold">{lvl}</div>
              <div className="mt-1 text-[10px] opacity-80">
                {lvl === "A1" && "Початківець"}
                {lvl === "A2" && "Базовий"}
                {lvl === "B1" && "Середній"}
                {lvl === "B2" && "Просунутий"}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Sentence count */}
      <div className="rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft">
        <p className="text-xs uppercase tracking-[0.3em] text-ink/40 mb-4">
          Кількість речень
        </p>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-ink">{sentenceCount}</span>
            <span className="text-xs text-ink/50">речень</span>
          </div>

          <input
            type="range"
            min={5}
            max={15}
            value={sentenceCount}
            onChange={(e) => setSentenceCount(Number(e.target.value))}
            className="w-full accent-gold"
          />

          <div className="flex justify-between text-xs text-ink/40">
            <span>5</span>
            <span>15</span>
          </div>
        </div>
      </div>

      {/* Recommendation */}
      <div className="rounded-2xl border border-gold/20 bg-gold/5 p-4">
        <div className="flex items-start gap-3">
          <Sparkle size={20} weight="fill" className="text-gold flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-gold mb-1">Порада</p>
            <p className="text-xs text-ink/70">
              Для початківців рекомендуємо рівень A1-A2 з 5-8 реченнями.
              Для досвідчених учнів - B1-B2 з 10-15 реченнями для кращої практики.
            </p>
          </div>
        </div>
      </div>

      {/* Start button */}
      <div className="flex justify-center">
        <button
          onClick={handleStart}
          className="inline-flex items-center gap-2 rounded-full bg-gold px-8 py-3 text-sm font-semibold text-paper transition hover:bg-gold/90"
        >
          <span>Почати практику</span>
          <span>→</span>
        </button>
      </div>
    </div>
  );
}
