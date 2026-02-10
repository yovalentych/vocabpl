"use client";

import { useLocale } from "@/components/LocaleProvider";
import AIExercisePanel from "../../shared/AIExercisePanel";

interface StoryConfigProps {
  level: "A1" | "A2" | "B1" | "B2";
  onLevelChange: (level: "A1" | "A2" | "B1" | "B2") => void;
}

export default function StoryConfig({ level, onLevelChange }: StoryConfigProps) {
  const { t } = useLocale();

  return (
    <div className="space-y-6">
      <AIExercisePanel exercise="story" onUsePrompt={() => {}} />

      <div className="rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft">
        <h3 className="text-xl font-semibold">
          {t.workbook.storyConfigTitle || "Налаштування мікроісторії"}
        </h3>
        <p className="mt-2 text-sm text-ink/60">
          {t.workbook.storyConfigHint || "Оберіть рівень складності для вашої історії"}
        </p>

        {/* Level Selection */}
        <div className="mt-6">
          <label className="block text-xs uppercase tracking-[0.2em] text-ink/40">
            Рівень складності
          </label>
          <div className="mt-3 flex flex-wrap gap-3">
            {(["A1", "A2", "B1", "B2"] as const).map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => onLevelChange(lvl)}
                className={`rounded-full border px-6 py-3 text-sm font-semibold transition ${
                  level === lvl
                    ? "border-moss bg-moss text-paper"
                    : "border-ink/10 bg-paper hover:border-ink/20"
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-6 rounded-2xl border border-gold/20 bg-gold/5 p-4">
          <p className="text-sm text-ink/70">
            💡 <strong>Підказка:</strong> Напишіть коротку історію (мінімум 50 слів) польською мовою.
            AI перевірить граматику, лексику та стиль написання.
          </p>
        </div>
      </div>
    </div>
  );
}
