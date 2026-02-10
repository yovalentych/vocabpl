"use client";

import { useState } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { Sparkle } from "@phosphor-icons/react";

interface MatchClassicConfigProps {
  onStart: (config: {
    pairType: "translation" | "semantic" | "definition";
    level: "A1" | "A2" | "B1" | "B2";
    pairCount: number;
  }) => void;
}

export default function MatchClassicConfig({ onStart }: MatchClassicConfigProps) {
  const { t } = useLocale();
  const [pairType, setPairType] = useState<"translation" | "semantic" | "definition">("translation");
  const [level, setLevel] = useState<"A1" | "A2" | "B1" | "B2">("A2");
  const [pairCount, setPairCount] = useState(12);

  const pairTypeOptions = [
    { id: "translation" as const, label: "Переклад", description: "Польське слово ↔ Український переклад" },
    { id: "semantic" as const, label: "Семантичні пари", description: "Синоніми, антоніми, пов'язані слова" },
    { id: "definition" as const, label: "Визначення", description: "Слово ↔ Тлумачення значення" }
  ];

  const handleStart = () => {
    onStart({ pairType, level, pairCount });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-3xl border border-terracotta/20 bg-terracotta/5 p-6 shadow-soft">
        <p className="text-xs uppercase tracking-[0.3em] text-terracotta/70 mb-2">
          Крок 1: Налаштування
        </p>
        <h2 className="text-2xl font-semibold text-ink">
          Класичний режим
        </h2>
        <p className="mt-2 text-sm text-ink/60">
          Оберіть тип пар, рівень та кількість для практики
        </p>
      </div>

      {/* Pair type selection */}
      <div className="rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft">
        <p className="text-xs uppercase tracking-[0.3em] text-ink/40 mb-4">
          Тип пар
        </p>

        <div className="space-y-3">
          {pairTypeOptions.map((option) => {
            const isSelected = pairType === option.id;

            return (
              <button
                key={option.id}
                onClick={() => setPairType(option.id)}
                className={`w-full rounded-2xl border p-4 text-left transition ${
                  isSelected
                    ? "border-terracotta bg-terracotta/5"
                    : "border-ink/20 hover:bg-ink/5"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 ${
                      isSelected
                        ? "border-terracotta bg-terracotta"
                        : "border-ink/30"
                    }`}
                  >
                    {isSelected && (
                      <div className="h-2 w-2 rounded-full bg-paper" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-ink">{option.label}</p>
                    <p className="text-xs text-ink/60 mt-1">{option.description}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
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
                  ? "border-terracotta bg-terracotta text-paper"
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

      {/* Pair count */}
      <div className="rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft">
        <p className="text-xs uppercase tracking-[0.3em] text-ink/40 mb-4">
          Кількість пар
        </p>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-ink">{pairCount}</span>
            <span className="text-xs text-ink/50">пар</span>
          </div>

          <input
            type="range"
            min={8}
            max={20}
            value={pairCount}
            onChange={(e) => setPairCount(Number(e.target.value))}
            className="w-full accent-terracotta"
          />

          <div className="flex justify-between text-xs text-ink/40">
            <span>8</span>
            <span>20</span>
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
              Для початківців рекомендуємо рівень A1-A2 з 8-12 парами.
              Для досвідчених учнів - B1-B2 з 15-20 парами для кращої практики.
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
          <span>Почати практику</span>
          <span>→</span>
        </button>
      </div>
    </div>
  );
}
