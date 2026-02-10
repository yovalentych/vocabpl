"use client";

import { useState } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { Sparkle } from "@phosphor-icons/react";

interface DialogueClassicConfigProps {
  onStart: (config: {
    scenario: string;
    level: "A1" | "A2" | "B1" | "B2";
  }) => void;
}

export default function DialogueClassicConfig({ onStart }: DialogueClassicConfigProps) {
  const { t } = useLocale();
  const [scenario, setScenario] = useState<string>("shop");
  const [level, setLevel] = useState<"A1" | "A2" | "B1" | "B2">("A2");

  const scenarios = [
    { id: "shop", label: "Магазин", emoji: "🛒", description: "Покупки та спілкування з продавцем" },
    { id: "restaurant", label: "Ресторан", emoji: "🍽️", description: "Замовлення їжі та напоїв" },
    { id: "station", label: "Вокзал", emoji: "🚂", description: "Покупка квитків та інформація про потяги" },
    { id: "hotel", label: "Готель", emoji: "🏨", description: "Реєстрація та обслуговування в готелі" },
    { id: "doctor", label: "Лікар", emoji: "⚕️", description: "Візит до лікаря та опис симптомів" }
  ];

  const handleStart = () => {
    onStart({ scenario, level });
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
          Оберіть сценарій діалогу та рівень складності
        </p>
      </div>

      {/* Scenario selection */}
      <div className="rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft">
        <p className="text-xs uppercase tracking-[0.3em] text-ink/40 mb-4">
          Оберіть сценарій
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          {scenarios.map((s) => {
            const isSelected = scenario === s.id;

            return (
              <button
                key={s.id}
                onClick={() => setScenario(s.id)}
                className={`rounded-2xl border p-4 text-left transition ${
                  isSelected
                    ? "border-gold bg-gold/5 ring-2 ring-gold/20"
                    : "border-ink/20 hover:border-ink/30 hover:bg-ink/5"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gold/10">
                    <span className="text-xl">{s.emoji}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-ink">{s.label}</p>
                    <p className="mt-1 text-xs text-ink/60">{s.description}</p>
                  </div>
                  {isSelected && (
                    <div className="flex-shrink-0 h-5 w-5 rounded-full bg-gold flex items-center justify-center">
                      <span className="text-xs text-paper">✓</span>
                    </div>
                  )}
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

      {/* Recommendation */}
      <div className="rounded-2xl border border-gold/20 bg-gold/5 p-4">
        <div className="flex items-start gap-3">
          <Sparkle size={20} weight="fill" className="text-gold flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-gold mb-1">Порада</p>
            <p className="text-xs text-ink/70">
              Уявіть себе у реальній ситуації. Відповідайте так, як би ви справді говорили.
              Це допоможе краще запам&apos;ятати корисні фрази для повсякденного спілкування.
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
          <span>Почати діалог</span>
          <span>→</span>
        </button>
      </div>
    </div>
  );
}
