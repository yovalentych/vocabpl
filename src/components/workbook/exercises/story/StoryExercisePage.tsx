"use client";

import { useState } from "react";
import { ArrowLeft } from "@phosphor-icons/react";
import Link from "next/link";
import { useLocale } from "@/components/LocaleProvider";
import StoryLanding from "./StoryLanding";
import StoryConfig from "./StoryConfig";
import StoryPractice from "./StoryPractice";

type Mode = "landing" | "classic-config" | "classic-practice" | "ai-config" | "ai-practice";

export default function StoryExercisePage() {
  const { t } = useLocale();
  const [mode, setMode] = useState<Mode>("landing");
  const [level, setLevel] = useState<"A1" | "A2" | "B1" | "B2">("A2");
  const [topic, setTopic] = useState("");
  const [useAI, setUseAI] = useState(false);

  const handleSelectMode = (selectedMode: "classic" | "ai") => {
    setUseAI(selectedMode === "ai");
    if (selectedMode === "classic") {
      setMode("classic-config");
    } else {
      setMode("ai-config");
    }
  };

  const handleConfigDone = () => {
    if (useAI) {
      setMode("ai-practice");
    } else {
      setMode("classic-practice");
    }
  };

  const handleBackToLanding = () => {
    setMode("landing");
    setUseAI(false);
    setTopic("");
  };

  return (
    <div className="space-y-6">
      {mode !== "landing" && (
        <button
          onClick={handleBackToLanding}
          className="inline-flex items-center gap-2 text-sm text-ink/60 transition hover:text-ink"
        >
          <ArrowLeft size={16} weight="bold" />
          <span>{t.workbook.backToModeSelect}</span>
        </button>
      )}

      {mode === "landing" && (
        <>
          <Link
            href="/class/workbook"
            className="inline-flex items-center gap-2 text-sm text-ink/60 transition hover:text-ink"
          >
            <ArrowLeft size={16} weight="bold" />
            <span>{t.workbook.backToExercises}</span>
          </Link>
          <StoryLanding onSelectMode={handleSelectMode} />
        </>
      )}

      {(mode === "classic-config" || mode === "ai-config") && (
        <div className="space-y-6">
          <div className="rounded-3xl border border-moss/20 bg-moss/5 p-6 shadow-soft">
            <p className="text-xs uppercase tracking-[0.3em] text-moss/70 mb-2">
              {t.workbook.step1Setup}
            </p>
            <h2 className="text-2xl font-semibold text-ink">
              {useAI ? t.workbook.storyAIMode : t.workbook.storyClassicMode}
            </h2>
            <p className="mt-2 text-sm text-ink/60">
              {useAI ? t.workbook.storyAIConfigDesc : t.workbook.storyClassicDesc}
            </p>
          </div>

          <StoryConfig
            level={level}
            onLevelChange={setLevel}
            topic={topic}
            onTopicChange={setTopic}
          />

          <div className="flex justify-center">
            <button
              onClick={handleConfigDone}
              className="inline-flex items-center gap-2 rounded-full bg-moss px-8 py-3 text-sm font-semibold text-paper transition hover:bg-moss/90"
            >
              <span>{t.workbook.storyStartWriting}</span>
              <span>→</span>
            </button>
          </div>
        </div>
      )}

      {(mode === "classic-practice" || mode === "ai-practice") && (
        <StoryPractice level={level} topic={topic} onComplete={handleBackToLanding} />
      )}
    </div>
  );
}
