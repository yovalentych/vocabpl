"use client";

import { useState } from "react";
import { ArrowLeft } from "@phosphor-icons/react";
import Link from "next/link";
import { useLocale } from "@/components/LocaleProvider";
import TranslateLanding from "./TranslateLanding";
import TranslateClassicConfig from "./TranslateClassicConfig";
import TranslateClassicPractice from "./TranslateClassicPractice";
import TranslateAIConfig from "./TranslateAIConfig";
import TranslateAIPractice from "./TranslateAIPractice";

type Mode = "landing" | "classic-config" | "classic-practice" | "ai-config" | "ai-practice";

export default function TranslateExercisePage() {
  const { t } = useLocale();
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
          <TranslateLanding onSelectMode={handleSelectMode} />
        </>
      )}

      {mode === "classic-config" && (
        <TranslateClassicConfig onStart={handleClassicConfigDone} />
      )}

      {mode === "classic-practice" && classicConfig && (
        <TranslateClassicPractice
          config={classicConfig}
          onComplete={handleBackToLanding}
        />
      )}

      {mode === "ai-config" && (
        <TranslateAIConfig onStart={handleAIConfigDone} />
      )}

      {mode === "ai-practice" && aiConfig && (
        <TranslateAIPractice
          config={aiConfig}
          onComplete={handleBackToLanding}
        />
      )}
    </div>
  );
}
