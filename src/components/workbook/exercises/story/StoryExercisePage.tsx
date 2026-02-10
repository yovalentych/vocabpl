"use client";

import { useState } from "react";
import { ArrowLeft } from "@phosphor-icons/react";
import Link from "next/link";
import StoryLanding from "./StoryLanding";
import StoryConfig from "./StoryConfig";
import StoryPractice from "./StoryPractice";

type Mode = "landing" | "classic-config" | "classic-practice" | "ai-config" | "ai-practice";

export default function StoryExercisePage() {
  const [mode, setMode] = useState<Mode>("landing");
  const [level, setLevel] = useState<"A1" | "A2" | "B1" | "B2">("A2");
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
  };

  return (
    <div className="space-y-6">
      {mode !== "landing" && (
        <button
          onClick={handleBackToLanding}
          className="inline-flex items-center gap-2 text-sm text-ink/60 transition hover:text-ink"
        >
          <ArrowLeft size={16} weight="bold" />
          <span>Назад до вибору режиму</span>
        </button>
      )}

      {mode === "landing" && (
        <>
          <Link
            href="/class/workbook"
            className="inline-flex items-center gap-2 text-sm text-ink/60 transition hover:text-ink"
          >
            <ArrowLeft size={16} weight="bold" />
            <span>Назад до вправ</span>
          </Link>
          <StoryLanding onSelectMode={handleSelectMode} />
        </>
      )}

      {(mode === "classic-config" || mode === "ai-config") && (
        <div className="space-y-6">
          <div className="rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft">
            <p className="text-xs uppercase tracking-[0.3em] text-ink/40 mb-4">
              {useAI ? "Крок 1: Налаштування AI" : "Крок 1: Налаштування"}
            </p>
            <h2 className="text-2xl font-semibold text-ink mb-2">
              {useAI ? "Режим з AI" : "Класичний режим"}
            </h2>
            <p className="text-sm text-ink/60 mb-6">
              {useAI
                ? "AI допоможе створити початок історії на вашу тему"
                : "Напишіть історію на вільну тему"}
            </p>
            <StoryConfig level={level} onLevelChange={setLevel} />
          </div>

          <div className="flex justify-center">
            <button
              onClick={handleConfigDone}
              className="inline-flex items-center gap-2 rounded-full bg-moss px-8 py-3 text-sm font-semibold text-paper transition hover:bg-moss/90"
            >
              <span>Почати писати</span>
              <span>→</span>
            </button>
          </div>
        </div>
      )}

      {(mode === "classic-practice" || mode === "ai-practice") && (
        <StoryPractice level={level} onComplete={handleBackToLanding} />
      )}
    </div>
  );
}
