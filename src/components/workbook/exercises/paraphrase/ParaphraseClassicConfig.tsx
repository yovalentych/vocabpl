"use client";

import { useState } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { Sparkle } from "@phosphor-icons/react";

interface ParaphraseClassicConfigProps {
  onStart: (config: {
    level: "A1" | "A2" | "B1" | "B2";
    count: number;
  }) => void;
}

export default function ParaphraseClassicConfig({ onStart }: ParaphraseClassicConfigProps) {
  const { t } = useLocale();
  const [level, setLevel] = useState<"A1" | "A2" | "B1" | "B2">("A2");
  const [count, setCount] = useState(5);

  const handleStart = () => {
    onStart({ level, count });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-3xl border border-terracotta/20 bg-terracotta/5 p-6 shadow-soft">
        <p className="text-xs uppercase tracking-[0.3em] text-terracotta/70 mb-2">
          {t.workbook.configSetupDesc}
        </p>
        <h2 className="text-2xl font-semibold text-ink">
          {t.workbook.classicMode}
        </h2>
        <p className="mt-2 text-sm text-ink/60">
          {t.workbook.paraphraseConfigSetupHint}
        </p>
      </div>

      {/* Level selection */}
      <div className="rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft">
        <p className="text-xs uppercase tracking-[0.3em] text-ink/40 mb-4">
          {t.workbook.levelLabel}
        </p>

        <div className="grid grid-cols-4 gap-3">
          {(["A1", "A2", "B1", "B2"] as const).map((lvl) => (
            <button
              key={lvl}
              onClick={() => setLevel(lvl)}
              className={`rounded-2xl border p-4 text-center transition ${
                level === lvl
                  ? "border-terracotta bg-terracotta text-paper"
                  : "border-ink/20 text-ink hover:bg-ink/5"
              }`}
            >
              <div className="text-xl font-bold">{lvl}</div>
              <div className="mt-1 text-[10px] opacity-80">
                {lvl === "A1" && t.workbook.levelA1}
                {lvl === "A2" && t.workbook.levelA2}
                {lvl === "B1" && t.workbook.levelB1}
                {lvl === "B2" && t.workbook.levelB2}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Sentence count */}
      <div className="rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft">
        <p className="text-xs uppercase tracking-[0.3em] text-ink/40 mb-4">
          {t.workbook.configSentenceCount}
        </p>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-ink">{count}</span>
            <span className="text-xs text-ink/50">{t.workbook.configSentencesUnit}</span>
          </div>

          <input
            type="range"
            min={5}
            max={10}
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            className="w-full accent-terracotta"
          />

          <div className="flex justify-between text-xs text-ink/40">
            <span>5</span>
            <span>10</span>
          </div>
        </div>
      </div>

      {/* Recommendation */}
      <div className="rounded-2xl border border-terracotta/20 bg-terracotta/5 p-4">
        <div className="flex items-start gap-3">
          <Sparkle size={20} weight="fill" className="text-terracotta flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-terracotta mb-1">{t.workbook.landingTip}</p>
            <p className="text-xs text-ink/70">
              {t.workbook.paraphraseConfigTip}
            </p>
          </div>
        </div>
      </div>

      {/* Start button */}
      <div className="flex justify-center">
        <button
          onClick={handleStart}
          className="inline-flex items-center gap-2 rounded-full bg-terracotta px-8 py-3 text-sm font-semibold text-paper transition hover:bg-terracotta/90"
        >
          <span>{t.workbook.configStartPractice}</span>
          <span>→</span>
        </button>
      </div>
    </div>
  );
}
