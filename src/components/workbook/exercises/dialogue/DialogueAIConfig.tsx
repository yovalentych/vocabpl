"use client";

import { useState } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { Sparkle } from "@phosphor-icons/react";

interface DialogueAIConfigProps {
  onStart: (config: {
    situation: string;
    level: "A1" | "A2" | "B1" | "B2";
    turns: number;
  }) => void;
}

export default function DialogueAIConfig({ onStart }: DialogueAIConfigProps) {
  const { t } = useLocale();
  const [situation, setSituation] = useState("");
  const [level, setLevel] = useState<"A1" | "A2" | "B1" | "B2">("A2");
  const [turns, setTurns] = useState(4);

  const situationSuggestions = [
    "Замовлення каві в кав&apos;ярні",
    "Питання про дорогу до музею",
    "Скарга на шумних сусідів",
    "Запис до перукарні",
    "Обговорення планів на вихідні",
    "Проблема з інтернетом",
    "Повернення товару в магазині",
    "Планування зустрічі з другом"
  ];

  const handleStart = () => {
    if (!situation.trim()) {
      return;
    }
    onStart({ situation: situation.trim(), level, turns });
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
          AI створить унікальний діалог на вашу ситуацію та рівень
        </p>
      </div>

      {/* Situation input */}
      <div className="rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft">
        <p className="text-xs uppercase tracking-[0.3em] text-ink/40 mb-4">
          Ситуація або тема діалогу
        </p>

        <textarea
          value={situation}
          onChange={(e) => setSituation(e.target.value)}
          placeholder="Наприклад: Розмова з лікарем про головний біль, замовлення піци по телефону..."
          rows={3}
          className="w-full rounded-2xl border border-ink/20 bg-paper px-4 py-3 text-sm text-ink placeholder:text-ink/40 focus:border-moss/40 focus:outline-none focus:ring-0"
        />

        {/* Suggestions */}
        <div className="mt-4">
          <p className="text-xs text-ink/50 mb-2">Швидкий вибір:</p>
          <div className="flex flex-wrap gap-2">
            {situationSuggestions.map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => setSituation(suggestion.replace("&apos;", "'"))}
                className="rounded-full border border-ink/20 px-3 py-1 text-xs text-ink transition hover:bg-ink/5"
                dangerouslySetInnerHTML={{ __html: suggestion }}
              />
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

      {/* Number of turns */}
      <div className="rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft">
        <p className="text-xs uppercase tracking-[0.3em] text-ink/40 mb-4">
          Кількість обмінів репліками
        </p>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-ink">{turns}</span>
            <span className="text-xs text-ink/50">обмінів</span>
          </div>

          <input
            type="range"
            min={3}
            max={6}
            value={turns}
            onChange={(e) => setTurns(Number(e.target.value))}
            className="w-full accent-moss"
          />

          <div className="flex justify-between text-xs text-ink/40">
            <span>3</span>
            <span>6</span>
          </div>
        </div>

        <p className="mt-3 text-xs text-ink/50">
          Один обмін = питання AI та ваша відповідь
        </p>
      </div>

      {/* AI info */}
      <div className="rounded-2xl border border-moss/20 bg-moss/5 p-4">
        <div className="flex items-start gap-3">
          <Sparkle size={20} weight="fill" className="text-moss flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-moss mb-1">Як це працює</p>
            <p className="text-xs text-ink/70">
              AI створить діалог на вашу тему. Ви будете вести розмову, відповідаючи
              на репліки AI. Після завершення отримаєте детальний фідбек про природність
              та граматичну правильність ваших відповідей.
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
          disabled={!situation.trim()}
          className="inline-flex items-center gap-2 rounded-full bg-moss px-8 py-3 text-sm font-semibold text-paper transition hover:bg-moss/90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Sparkle size={18} weight="fill" />
          <span>Створити діалог</span>
          <span>→</span>
        </button>
      </div>

      {!situation.trim() && (
        <p className="text-center text-xs text-terracotta">
          Опишіть ситуацію для діалогу
        </p>
      )}
    </div>
  );
}
