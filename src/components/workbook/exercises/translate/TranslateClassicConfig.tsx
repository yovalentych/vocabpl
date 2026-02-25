"use client";

import { useState } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { Sparkle } from "@phosphor-icons/react";

interface TranslateClassicConfigProps {
  onStart: (config: {
    direction: "uk_to_pl" | "pl_to_uk";
    level: "A1" | "A2" | "B1" | "B2";
    count: number;
  }) => void;
}

export default function TranslateClassicConfig({ onStart }: TranslateClassicConfigProps) {
  const { t } = useLocale();
  const [direction, setDirection] = useState<"uk_to_pl" | "pl_to_uk">("uk_to_pl");
  const [level, setLevel] = useState<"A1" | "A2" | "B1" | "B2">("A2");
  const [count, setCount] = useState(5);

  const handleStart = () => {
    onStart({ direction, level, count });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-3xl border border-moss/20 bg-moss/5 p-6 shadow-soft">
        <p className="text-xs uppercase tracking-[0.3em] text-moss/70 mb-2">
          {t.workbook.configSetupDesc}
        </p>
        <h2 className="text-2xl font-semibold text-ink">
          {t.workbook.classicMode}
        </h2>
        <p className="mt-2 text-sm text-ink/60">
          {t.workbook.translateConfigSetupHint}
        </p>
      </div>

      {/* Direction selection */}
      <div className="rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft">
        <p className="text-xs uppercase tracking-[0.3em] text-ink/40 mb-4">
          {t.workbook.translateConfigDirection}
        </p>

        <div className="space-y-3">
          <label className="flex items-start gap-3 cursor-pointer rounded-2xl border p-4 transition hover:bg-ink/5">
            <input
              type="radio"
              name="direction"
              value="uk_to_pl"
              checked={direction === "uk_to_pl"}
              onChange={(e) => setDirection(e.target.value as "uk_to_pl")}
              className="mt-0.5 h-4 w-4 accent-moss"
            />
            <div>
              <p className="text-sm font-semibold text-ink">{t.workbook.translateConfigUkPl}</p>
              <p className="text-xs text-ink/60">{t.workbook.translateConfigUkPlDesc}</p>
            </div>
          </label>

          <label className="flex items-start gap-3 cursor-pointer rounded-2xl border p-4 transition hover:bg-ink/5">
            <input
              type="radio"
              name="direction"
              value="pl_to_uk"
              checked={direction === "pl_to_uk"}
              onChange={(e) => setDirection(e.target.value as "pl_to_uk")}
              className="mt-0.5 h-4 w-4 accent-moss"
            />
            <div>
              <p className="text-sm font-semibold text-ink">{t.workbook.translateConfigPlUk}</p>
              <p className="text-xs text-ink/60">{t.workbook.translateConfigPlUkDesc}</p>
            </div>
          </label>
        </div>
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
                  ? "border-moss bg-moss text-paper"
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
            max={12}
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            className="w-full accent-moss"
          />

          <div className="flex justify-between text-xs text-ink/40">
            <span>5</span>
            <span>12</span>
          </div>
        </div>
      </div>

      {/* Recommendation */}
      <div className="rounded-2xl border border-moss/20 bg-moss/5 p-4">
        <div className="flex items-start gap-3">
          <Sparkle size={20} weight="fill" className="text-moss flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-moss mb-1">{t.workbook.landingTip}</p>
            <p className="text-xs text-ink/70">
              {t.workbook.translateConfigTip}
            </p>
          </div>
        </div>
      </div>

      {/* Start button */}
      <div className="flex justify-center">
        <button
          onClick={handleStart}
          className="inline-flex items-center gap-2 rounded-full bg-moss px-8 py-3 text-sm font-semibold text-paper transition hover:bg-moss/90"
        >
          <span>{t.workbook.configStartPractice}</span>
          <span>→</span>
        </button>
      </div>
    </div>
  );
}
