"use client";

import { useState } from "react";
import { Sparkle } from "@phosphor-icons/react";

interface TranslateClassicConfigProps {
  onStart: (config: {
    direction: "uk_to_pl" | "pl_to_uk";
    level: "A1" | "A2" | "B1" | "B2";
    count: number;
  }) => void;
}

export default function TranslateClassicConfig({ onStart }: TranslateClassicConfigProps) {
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
          Крок 1: Налаштування
        </p>
        <h2 className="text-2xl font-semibold text-ink">
          Класичний режим
        </h2>
        <p className="mt-2 text-sm text-ink/60">
          Налаштуйте напрямок перекладу, рівень та кількість речень
        </p>
      </div>

      {/* Direction selection */}
      <div className="rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft">
        <p className="text-xs uppercase tracking-[0.3em] text-ink/40 mb-4">
          Напрямок перекладу
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
              <p className="text-sm font-semibold text-ink">Українська → Польська</p>
              <p className="text-xs text-ink/60">Перекладайте речення з української на польську</p>
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
              <p className="text-sm font-semibold text-ink">Польська → Українська</p>
              <p className="text-xs text-ink/60">Перекладайте речення з польської на українську</p>
            </div>
          </label>
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
                  ? "border-moss bg-moss text-paper"
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
            <span className="text-2xl font-bold text-ink">{count}</span>
            <span className="text-xs text-ink/50">речень</span>
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
            <p className="text-xs font-semibold text-moss mb-1">Порада</p>
            <p className="text-xs text-ink/70">
              Для ефективного навчання намагайтеся перекладати речення максимально точно,
              звертаючи увагу на граматичні конструкції та порядок слів.
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
          <span>Почати практику</span>
          <span>→</span>
        </button>
      </div>
    </div>
  );
}
