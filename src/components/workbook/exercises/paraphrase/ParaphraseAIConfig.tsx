"use client";

import { useState } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { Sparkle } from "@phosphor-icons/react";

interface ParaphraseAIConfigProps {
  onStart: (config: {
    topic: string;
    level: "A1" | "A2" | "B1" | "B2";
    count: number;
  }) => void;
}

export default function ParaphraseAIConfig({ onStart }: ParaphraseAIConfigProps) {
  const { t } = useLocale();
  const [topic, setTopic] = useState("");
  const [level, setLevel] = useState<"A1" | "A2" | "B1" | "B2">("A2");
  const [count, setCount] = useState(5);

  const topicSuggestions = [
    "Podróże", "Technologia", "Nauka", "Kultura",
    "Sport", "Środowisko", "Praca", "Zdrowie"
  ];

  const handleStart = () => {
    if (!topic.trim()) return;
    onStart({ topic: topic.trim(), level, count });
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-moss/20 bg-moss/5 p-6 shadow-soft">
        <p className="text-xs uppercase tracking-[0.3em] text-moss/70 mb-2">
          {t.workbook.step1SetupAI}
        </p>
        <h2 className="text-2xl font-semibold text-ink">{t.workbook.aiMode}</h2>
        <p className="mt-2 text-sm text-ink/60">{t.workbook.paraphraseAIDesc}</p>
      </div>

      <div className="rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft">
        <p className="text-xs uppercase tracking-[0.3em] text-ink/40 mb-4">
          {t.workbook.aiConfigTopicLabel}
        </p>
        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder={t.workbook.aiConfigTopicPlaceholder}
          className="w-full rounded-2xl border border-ink/20 bg-paper px-4 py-3 text-sm text-ink placeholder:text-ink/40 focus:border-moss/40 focus:outline-none focus:ring-0"
        />
        <div className="mt-4">
          <p className="text-xs text-ink/50 mb-2">{t.workbook.quickSelect}</p>
          <div className="flex flex-wrap gap-2">
            {topicSuggestions.map((s) => (
              <button key={s} onClick={() => setTopic(s)} className="rounded-full border border-ink/20 px-3 py-1 text-xs text-ink transition hover:bg-ink/5">
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft">
        <p className="text-xs uppercase tracking-[0.3em] text-ink/40 mb-4">{t.workbook.difficultyLevel}</p>
        <div className="grid grid-cols-4 gap-3">
          {(["A1", "A2", "B1", "B2"] as const).map((lvl) => (
            <button
              key={lvl}
              onClick={() => setLevel(lvl)}
              className={`rounded-2xl border p-4 text-center transition ${level === lvl ? "border-moss bg-moss text-paper" : "border-ink/20 text-ink hover:bg-ink/5"}`}
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

      <div className="rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft">
        <p className="text-xs uppercase tracking-[0.3em] text-ink/40 mb-4">{t.workbook.aiConfigSentenceCount}</p>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-ink">{count}</span>
            <span className="text-xs text-ink/50">{t.workbook.aiConfigSentencesUnit}</span>
          </div>
          <input type="range" min={5} max={8} value={count} onChange={(e) => setCount(Number(e.target.value))} className="w-full accent-moss" />
          <div className="flex justify-between text-xs text-ink/40"><span>5</span><span>8</span></div>
        </div>
        <p className="mt-3 text-xs text-ink/50">
          {t.workbook.aiConfigCreditLimit.replace("{max}", "8").replace("{unit}", t.workbook.aiConfigSentencesUnit)}
        </p>
      </div>

      <div className="rounded-2xl border border-moss/20 bg-moss/5 p-4">
        <div className="flex items-start gap-3">
          <Sparkle size={20} weight="fill" className="text-moss flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-moss mb-1">{t.workbook.howItWorks}</p>
            <p className="text-xs text-ink/70">{t.workbook.paraphraseAIInfo}</p>
            <p className="mt-2 text-xs text-moss/70">{t.workbook.aiConfigCreditCost}</p>
          </div>
        </div>
      </div>

      <div className="flex justify-center">
        <button onClick={handleStart} disabled={!topic.trim()} className="inline-flex items-center gap-2 rounded-full bg-moss px-8 py-3 text-sm font-semibold text-paper transition hover:bg-moss/90 disabled:cursor-not-allowed disabled:opacity-40">
          <Sparkle size={18} weight="fill" />
          <span>{t.workbook.aiConfigGenerate}</span>
          <span>→</span>
        </button>
      </div>

      {!topic.trim() && (
        <p className="text-center text-xs text-terracotta">{t.workbook.aiConfigInputHint}</p>
      )}
    </div>
  );
}
