"use client";

import { useState } from "react";
import { ArrowLeft } from "@phosphor-icons/react";
import Link from "next/link";
import { useLocale } from "@/components/LocaleProvider";
import DescribeLanding from "./DescribeLanding";
import DescribeConfig from "./DescribeConfig";
import DescribePractice from "./DescribePractice";

type Mode = "landing" | "classic-config" | "classic-practice" | "ai-config" | "ai-practice";

export default function DescribeExercisePage() {
  const { t } = useLocale();
  const [mode, setMode] = useState<Mode>("landing");
  const [config, setConfig] = useState<{
    prompt: string;
    level: "A1" | "A2" | "B1" | "B2";
  }>({
    prompt: "",
    level: "A2"
  });
  const [useAI, setUseAI] = useState(false);

  const handleSelectMode = (selectedMode: "classic" | "ai") => {
    setUseAI(selectedMode === "ai");
    if (selectedMode === "classic") {
      setMode("classic-config");
    } else {
      setMode("ai-config");
    }
  };

  const handleStart = (cfg: { prompt: string; level: "A1" | "A2" | "B1" | "B2"; category?: string }) => {
    setConfig({ prompt: cfg.prompt, level: cfg.level });
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
          <DescribeLanding onSelectMode={handleSelectMode} />
        </>
      )}

      {(mode === "classic-config" || mode === "ai-config") && (
        <DescribeConfig onStartPractice={handleStart} />
      )}

      {(mode === "classic-practice" || mode === "ai-practice") && (
        <DescribePractice
          prompt={config.prompt}
          level={config.level}
          onComplete={handleBackToLanding}
        />
      )}
    </div>
  );
}
