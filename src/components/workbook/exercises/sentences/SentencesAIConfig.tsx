"use client";

import { useState } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { Sparkle } from "@phosphor-icons/react";

interface SentencesAIConfigProps {
  onStart: (config: {
    topic: string;
    level: "A1" | "A2" | "B1" | "B2";
    count: number;
  }) => void;
}

export default function SentencesAIConfig({ onStart }: SentencesAIConfigProps) {
  const { t } = useLocale();
  const [topic, setTopic] = useState("");
  const [level, setLevel] = useState<"A1" | "A2" | "B1" | "B2">("A2");
  const [count, setCount] = useState(5);

  const topicSuggestions = [
    "Подорожі",
    "Робота",
    "Хобі",
    "Їжа",
    "Сім'я",
    "Навчання",
    "Спорт",
    "Міське життя"
  ];

  const handleStart = () => {
    if (!topic.trim()) {
      return;
    }
    onStart({ topic: topic.trim(), level, count });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-3xl border border-gold/20 bg-gold/5 p-6 shadow-soft">
        <p className="text-xs uppercase tracking-[0.3em] text-gold/70 mb-2">
          Крок 1: Налаштування AI
        </p>
        <h2 className="text-2xl font-semibold text-ink">
          Режим з AI
        </h2>
        <p className="mt-2 text-sm text-ink/60">
          AI згенерує слова на вибрану тему та рівень
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
          placeholder="Наприклад: Подорожі, Робота, Хобі..."
          className="w-full rounded-2xl border border-ink/20 bg-paper px-4 py-3 text-sm text-ink placeholder:text-ink/40 focus:border-gold/40 focus:outline-none focus:ring-0"
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
            max={10}
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            className="w-full accent-gold"
          />

          <div className="flex justify-between text-xs text-ink/40">
            <span>3</span>
            <span>10</span>
          </div>
        </div>

        <p className="mt-3 text-xs text-ink/50">
          AI режим обмежений до 10 слів для економії кредитів
        </p>
      </div>

      {/* AI info */}
      <div className="rounded-2xl border border-gold/20 bg-gold/5 p-4">
        <div className="flex items-start gap-3">
          <Sparkle size={20} weight="fill" className="text-gold flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-gold mb-1">Як це працює</p>
            <p className="text-xs text-ink/70">
              AI згенерує набір слів відповідно до теми та рівня. Потім ви напишете речення,
              а AI перевірить їх та надасть детальний фідбек з порадами щодо покращення.
            </p>
            <p className="mt-2 text-xs text-gold/70">
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
          className="inline-flex items-center gap-2 rounded-full bg-gold px-8 py-3 text-sm font-semibold text-paper transition hover:bg-gold/90 disabled:cursor-not-allowed disabled:opacity-40"
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
