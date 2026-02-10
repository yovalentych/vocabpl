"use client";

import { useState } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { Pen, ClockCounterClockwise } from "@phosphor-icons/react/dist/ssr";
import DescribeConfig from "./DescribeConfig";
import DescribePractice from "./DescribePractice";
import DescribeHistory from "./DescribeHistory";

type Tab = "practice" | "history";

export default function DescribeExercise() {
  const { t } = useLocale();
  const [activeTab, setActiveTab] = useState<Tab>("practice");
  const [config, setConfig] = useState<{ prompt: string; level: "A1" | "A2" | "B1" | "B2" } | null>(null);

  const handleStartPractice = (newConfig: { prompt: string; level: "A1" | "A2" | "B1" | "B2" }) => {
    setConfig(newConfig);
  };

  const handleNewExercise = () => {
    setConfig(null);
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => setActiveTab("practice")}
          className={`flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold transition-all ${
            activeTab === "practice"
              ? "bg-ink text-paper shadow-soft"
              : "border border-ink/20 bg-paper/80 text-ink hover:bg-ink/5"
          }`}
        >
          <Pen size={18} weight={activeTab === "practice" ? "fill" : "regular"} />
          {t.workbook.describePracticeTab || "Практика"}
        </button>

        <button
          onClick={() => setActiveTab("history")}
          className={`flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold transition-all ${
            activeTab === "history"
              ? "bg-ink text-paper shadow-soft"
              : "border border-ink/20 bg-paper/80 text-ink hover:bg-ink/5"
          }`}
        >
          <ClockCounterClockwise size={18} weight={activeTab === "history" ? "fill" : "regular"} />
          {t.workbook.describeHistoryTab || "Історія результатів"}
        </button>
      </div>

      {/* Content */}
      {activeTab === "practice" && (
        <>
          {!config ? (
            <DescribeConfig onStartPractice={handleStartPractice} />
          ) : (
            <>
              <div className="flex justify-end">
                <button
                  onClick={handleNewExercise}
                  className="rounded-full border border-ink/20 px-4 py-2 text-xs font-semibold text-ink hover:bg-ink/5"
                >
                  {t.workbook.describeNewExercise || "Нова вправа"}
                </button>
              </div>
              <DescribePractice prompt={config.prompt} level={config.level} />
            </>
          )}
        </>
      )}

      {activeTab === "history" && <DescribeHistory />}
    </div>
  );
}
