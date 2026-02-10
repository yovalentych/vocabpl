"use client";

import { useState } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { Sparkle } from "@phosphor-icons/react";

interface MatchAIConfigProps {
  onStart: (config: {
    topic: string;
    pairType: "translation" | "semantic" | "definition";
    level: "A1" | "A2" | "B1" | "B2";
    pairCount: number;
  }) => void;
}

export default function MatchAIConfig({ onStart }: MatchAIConfigProps) {
  const { t } = useLocale();
  const [topic, setTopic] = useState("");
  const [pairType, setPairType] = useState<"translation" | "semantic" | "definition">("translation");
  const [level, setLevel] = useState<"A1" | "A2" | "B1" | "B2">("A2");
  const [pairCount, setPairCount] = useState(10);

  const topicSuggestions = [
    "Подорожі",
    "Робота",
    "Їжа та напої",
    "Хобі",
    "Спорт",
    "Погода",
    "Покупки",
    "Родина"
  ];

  const pairTypeOptions = [
    { id: "translation" as const, label: "Переклад", description: "Польське слово ↔ Український переклад" },
    { id: "semantic" as const, label: "Семантичні пари", description: "Синоніми, антоніми, пов'язані слова" },
    { id: "definition" as const, label: "Визначення", description: "Слово ↔ Тлумачення значення" }
  ];

  const handleStart = () => {
    if (!topic.trim()) return;
    onStart({ topic: topic.trim(), pairType, level, pairCount });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-3xl border border-moss/20 bg-moss/5 p-6 shadow-soft">
        <p className="text-xs uppercase tracking-[0.3em] text-moss/70 mb-2">
          Крок 1: Налаштування AI
        </p>
        <h2 className="text-2xl font-semibold text-ink">
          Режим з AI
        </h2>
        <p className="mt-2 text-sm text-ink/60">
          AI створить пари для знаходження відповідностей на вибрану тему
        </p>
      </div>

      {/* Topic input */}
      <div className="rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft">
        <p className="text-xs uppercase tracking-[0.3em] text-ink/40 mb-4">
          Тема для вправи
        </p>

        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Наприклад: Подорожі, Робота, Їжа..."
          className="w-full rounded-2xl border border-ink/20 bg-paper px-4 py-3 text-sm text-ink placeholder:text-ink/40 focus:border-moss/40 focus:outline-none focus:ring-0"
        />

        {/* Suggestions */}
        <div className="mt-4">
          <p className="text-xs text-ink/50 mb-2">Швидкий вибір:</p>
          <div className="flex flex-wrap gap-2">
            {topicSuggestions.map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => setTopic(suggestion)}
                className="rounded-full border border-ink/20 px-3 py-1 text-xs text-ink transition hover:bg-ink/5"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
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
                    ? "border-moss bg-moss/5"
                    : "border-ink/20 hover:bg-ink/5"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 ${
                      isSelected
                        ? "border-moss bg-moss"
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
            max={15}
            value={pairCount}
            onChange={(e) => setPairCount(Number(e.target.value))}
            className="w-full accent-moss"
          />

          <div className="flex justify-between text-xs text-ink/40">
            <span>8</span>
            <span>15</span>
          </div>
        </div>

        <p className="mt-3 text-xs text-ink/50">
          AI режим обмежений до 15 пар для економії кредитів
        </p>
      </div>

      {/* AI info */}
      <div className="rounded-2xl border border-moss/20 bg-moss/5 p-4">
        <div className="flex items-start gap-3">
          <Sparkle size={20} weight="fill" className="text-moss flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-moss mb-1">Як це працює</p>
            <p className="text-xs text-ink/70">
              AI створить пари для знаходження відповідностей на вашу тему та рівень.
              Після завершення AI перевірить результати та надасть детальний фідбек.
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
          disabled={!topic.trim()}
          className="inline-flex items-center gap-2 rounded-full bg-moss px-8 py-3 text-sm font-semibold text-paper transition hover:bg-moss/90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Sparkle size={18} weight="fill" />
          <span>Згенерувати завдання</span>
          <span>→</span>
        </button>
      </div>

      {!topic.trim() && (
        <p className="text-center text-xs text-terracotta">
          Введіть тему для вправи
        </p>
      )}
    </div>
  );
}
