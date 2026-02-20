"use client";

import { useLocale } from "@/components/LocaleProvider";
import { Sparkle } from "@phosphor-icons/react";

interface StoryConfigProps {
  level: "A1" | "A2" | "B1" | "B2";
  onLevelChange: (level: "A1" | "A2" | "B1" | "B2") => void;
  topic: string;
  onTopicChange: (topic: string) => void;
}

export default function StoryConfig({ level, onLevelChange, topic, onTopicChange }: StoryConfigProps) {
  const { t } = useLocale();

  const topicSuggestions = [
    "Пригоди в Польщі",
    "Перший день на роботі",
    "Незвичайна подорож",
    "Зустріч зі старим другом",
    "Загублений у місті",
    "Вихідні на природі",
    "Смішна ситуація",
    "Мій ідеальний день"
  ];

  return (
    <div className="space-y-6">
      {/* Topic input */}
      <div className="rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft">
        <p className="text-xs uppercase tracking-[0.3em] text-ink/40 mb-4">
          {t.workbook.describeConfigTopicLabel}
        </p>

        <input
          type="text"
          value={topic}
          onChange={(e) => onTopicChange(e.target.value)}
          placeholder={t.workbook.storyConfigPlaceholder}
          className="w-full rounded-2xl border border-ink/20 bg-paper px-4 py-3 text-sm text-ink placeholder:text-ink/40 focus:border-moss/40 focus:outline-none focus:ring-0"
        />

        {/* Suggestions */}
        <div className="mt-4">
          <p className="text-xs text-ink/50 mb-2">{t.workbook.quickSelect}</p>
          <div className="flex flex-wrap gap-2">
            {topicSuggestions.map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => onTopicChange(suggestion)}
                className="rounded-full border border-ink/20 px-3 py-1 text-xs text-ink transition hover:bg-ink/5"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Level Selection */}
      <div className="rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft">
        <p className="text-xs uppercase tracking-[0.3em] text-ink/40 mb-4">
          {t.workbook.difficultyLevel}
        </p>

        <div className="grid grid-cols-4 gap-3">
          {(["A1", "A2", "B1", "B2"] as const).map((lvl) => (
            <button
              key={lvl}
              type="button"
              onClick={() => onLevelChange(lvl)}
              className={`rounded-2xl border p-4 text-center transition ${
                level === lvl
                  ? "border-moss bg-moss text-paper"
                  : "border-ink/20 text-ink hover:bg-ink/5"
              }`}
            >
              <div className="text-xl font-bold">{lvl}</div>
              <div className="mt-1 text-[10px] opacity-80">
                {lvl === "A1" && t.workbook.levelBeginner}
                {lvl === "A2" && t.workbook.levelBasic}
                {lvl === "B1" && t.workbook.levelIntermediate}
                {lvl === "B2" && t.workbook.levelAdvanced}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Instructions */}
      <div className="rounded-2xl border border-moss/20 bg-moss/5 p-4">
        <div className="flex items-start gap-3">
          <Sparkle size={20} weight="fill" className="text-moss flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-moss mb-1">{t.workbook.howItWorks}</p>
            <p className="text-xs text-ink/70">
              {t.workbook.storyConfigInfo}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
