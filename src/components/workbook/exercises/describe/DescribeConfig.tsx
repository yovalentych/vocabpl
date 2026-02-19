"use client";

import { useState } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { Sparkle } from "@phosphor-icons/react";

interface DescribeConfigProps {
  onStartPractice: (config: {
    prompt: string;
    level: "A1" | "A2" | "B1" | "B2";
  }) => void;
}

export default function DescribeConfig({ onStartPractice }: DescribeConfigProps) {
  const { t } = useLocale();
  const [prompt, setPrompt] = useState("");
  const [level, setLevel] = useState<"A1" | "A2" | "B1" | "B2">("A1");

  const suggestions = [
    "Парк восени",
    "Вулиця Кракова",
    "Ранок у кав'ярні",
    "Родина на пікніку",
    "Ринок старого міста",
    "Зимовий пейзаж",
    "Кухня ресторану",
    "Пляж влітку"
  ];

  const handleStart = () => {
    if (!prompt.trim()) return;
    onStartPractice({ prompt: prompt.trim(), level });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-3xl border border-moss/20 bg-moss/5 p-6 shadow-soft">
        <p className="text-xs uppercase tracking-[0.3em] text-moss/70 mb-2">
          Крок 1: Налаштування AI
        </p>
        <h2 className="text-2xl font-semibold text-ink">
          {t.workbook.describeConfigTitle || "Опис зображення"}
        </h2>
        <p className="mt-2 text-sm text-ink/60">
          {t.workbook.describeConfigHint || "AI згенерує зображення за вашим описом, а ви опишете його польською"}
        </p>
      </div>

      {/* Topic input */}
      <div className="rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft">
        <p className="text-xs uppercase tracking-[0.3em] text-ink/40 mb-4">
          Тема або опис сцени
        </p>

        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Наприклад: Парк восени, Вулиця Кракова..."
          className="w-full rounded-2xl border border-ink/20 bg-paper px-4 py-3 text-sm text-ink placeholder:text-ink/40 focus:border-moss/40 focus:outline-none focus:ring-0"
        />

        {/* Suggestions */}
        <div className="mt-4">
          <p className="text-xs text-ink/50 mb-2">Швидкий вибір:</p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => setPrompt(suggestion)}
                className="rounded-full border border-ink/20 px-3 py-1 text-xs text-ink transition hover:bg-ink/5"
              >
                {suggestion}
              </button>
            ))}
          </div>
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

      {/* AI info */}
      <div className="rounded-2xl border border-moss/20 bg-moss/5 p-4">
        <div className="flex items-start gap-3">
          <Sparkle size={20} weight="fill" className="text-moss flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-moss mb-1">Як це працює</p>
            <p className="text-xs text-ink/70">
              AI згенерує зображення за вашою темою. Ви опишете його польською мовою,
              а AI перевірить граматику, лексику та точність опису.
            </p>
            <p className="mt-2 text-xs text-moss/70">
              Вартість: 2 кредити за генерацію + 2 кредити за перевірку
            </p>
          </div>
        </div>
      </div>

      {/* Start button */}
      <div className="flex justify-center">
        <button
          onClick={handleStart}
          disabled={!prompt.trim()}
          className="inline-flex items-center gap-2 rounded-full bg-moss px-8 py-3 text-sm font-semibold text-paper transition hover:bg-moss/90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Sparkle size={18} weight="fill" />
          <span>{t.workbook.startPractice || "Почати практику"}</span>
          <span>→</span>
        </button>
      </div>

      {!prompt.trim() && (
        <p className="text-center text-xs text-terracotta">
          Введіть тему або оберіть зі списку
        </p>
      )}
    </div>
  );
}
