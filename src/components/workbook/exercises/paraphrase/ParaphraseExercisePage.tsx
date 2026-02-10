"use client";

import { useState } from "react";
import { ArrowLeft } from "@phosphor-icons/react";
import Link from "next/link";
import ParaphraseLanding from "./ParaphraseLanding";
import ParaphraseClassicConfig from "./ParaphraseClassicConfig";
import ParaphraseClassicPractice from "./ParaphraseClassicPractice";
import ParaphraseAIConfig from "./ParaphraseAIConfig";
import ParaphraseAIPractice from "./ParaphraseAIPractice";

type Mode = "landing" | "classic-config" | "classic-practice" | "ai-config" | "ai-practice";

export default function ParaphraseExercisePage() {
  const [mode, setMode] = useState<Mode>("landing");
  const [classicConfig, setClassicConfig] = useState<any>(null);
  const [aiConfig, setAIConfig] = useState<any>(null);

  const handleSelectMode = (selectedMode: "classic" | "ai") => {
    if (selectedMode === "classic") {
      setMode("classic-config");
    } else {
      setMode("ai-config");
    }
  };

  const handleClassicConfigDone = (config: any) => {
    setClassicConfig(config);
    setMode("classic-practice");
  };

  const handleAIConfigDone = (config: any) => {
    setAIConfig(config);
    setMode("ai-practice");
  };

  const handleBackToLanding = () => {
    setMode("landing");
    setClassicConfig(null);
    setAIConfig(null);
  };

  return (
    <div className="space-y-6">
      {/* Back button */}
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
          <ParaphraseLanding onSelectMode={handleSelectMode} />
        </>
      )}

      {mode === "classic-config" && (
        <ParaphraseClassicConfig onStart={handleClassicConfigDone} />
      )}

      {mode === "classic-practice" && classicConfig && (
        <ParaphraseClassicPractice
          config={classicConfig}
          onComplete={handleBackToLanding}
        />
      )}

      {mode === "ai-config" && (
        <ParaphraseAIConfig onStart={handleAIConfigDone} />
      )}

      {mode === "ai-practice" && aiConfig && (
        <ParaphraseAIPractice
          config={aiConfig}
          onComplete={handleBackToLanding}
        />
      )}
    </div>
  );
}
