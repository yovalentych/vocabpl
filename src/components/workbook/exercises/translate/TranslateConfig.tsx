"use client";

import { useLocale } from "@/components/LocaleProvider";
import { useTranslate, TranslateDirection } from "./useTranslate";

interface TranslateConfigProps {
  onStartPractice: (config: {
    direction: TranslateDirection;
    count: number;
    prompt: string;
    useVocab: boolean;
    level: "A1" | "A2" | "B1" | "B2";
  }) => void;
}

export default function TranslateConfig({ onStartPractice }: TranslateConfigProps) {
  const { t } = useLocale();
  const { direction, count, prompt, useVocab, level, setDirection, setCount, setPrompt, setUseVocab, setLevel } =
    useTranslate();

  const handleStart = () => {
    onStartPractice({
      direction,
      count,
      prompt,
      useVocab,
      level
    });
  };

  return (
    <div className="space-y-6">
      {/* Configuration Panel */}
      <div className="rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft">
        <h3 className="text-xl font-semibold">{t.workbook.translateConfigTitle}</h3>
        <p className="mt-2 text-sm text-ink/60">
          {t.workbook.translateConfigHint}
        </p>

        <div className="mt-6 space-y-4">
          {/* Direction */}
          <div>
            <label className="block text-xs uppercase tracking-[0.3em] text-ink/40">
              {t.workbook.translateDirection}
            </label>
            <select
              value={direction}
              onChange={(e) => setDirection(e.target.value as TranslateDirection)}
              className="mt-2 w-full rounded-2xl border border-ink/20 bg-paper px-4 py-2 text-sm"
            >
              <option value="uk_to_pl">Українська → Польська</option>
              <option value="pl_to_uk">Польська → Українська</option>
            </select>
          </div>

          {/* Level */}
          <div>
            <label className="block text-xs uppercase tracking-[0.3em] text-ink/40">
              {t.workbook.translateLevel}
            </label>
            <div className="mt-2 grid grid-cols-4 gap-2">
              {(["A1", "A2", "B1", "B2"] as const).map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setLevel(lvl)}
                  className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                    level === lvl
                      ? "border-ink bg-ink text-paper"
                      : "border-ink/20 text-ink hover:border-ink/40 hover:bg-ink/5"
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-ink/50">
              {level === "A1" && "Базовий рівень - прості речення"}
              {level === "A2" && "Початковий рівень - речення середньої складності"}
              {level === "B1" && "Середній рівень - складніші конструкції"}
              {level === "B2" && "Просунутий рівень - складні речення"}
            </p>
          </div>

          {/* Topic */}
          <div>
            <label className="block text-xs uppercase tracking-[0.3em] text-ink/40">
              {t.workbook.translateTopic}
            </label>
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={t.workbook.translateTopicPlaceholder}
              className="mt-2 w-full rounded-2xl border border-ink/20 bg-paper px-4 py-2 text-sm"
            />
          </div>

          {/* Count */}
          <div>
            <label className="block text-xs uppercase tracking-[0.3em] text-ink/40">
              {t.workbook.translateCount}: {count}
            </label>
            <input
              type="range"
              min="3"
              max="12"
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="mt-2 w-full accent-ink"
            />
            <div className="mt-1 flex justify-between text-xs text-ink/50">
              <span>3</span>
              <span>12</span>
            </div>
          </div>

          {/* Use Vocab */}
          <div>
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={useVocab}
                onChange={(e) => setUseVocab(e.target.checked)}
                className="h-4 w-4 rounded border-ink/20 accent-ink"
              />
              <span className="text-sm">
                {t.workbook.translateUseVocab}
              </span>
            </label>
            <p className="ml-7 mt-1 text-xs text-ink/50">
              {t.workbook.translateUseVocabHint}
            </p>
          </div>
        </div>
      </div>

      {/* Start Button */}
      <div className="flex justify-end">
        <button
          onClick={handleStart}
          className="rounded-full bg-ink px-6 py-3 text-sm font-semibold text-paper shadow-soft transition hover:bg-ink/90"
        >
          {t.workbook.translateGenerate} →
        </button>
      </div>
    </div>
  );
}
