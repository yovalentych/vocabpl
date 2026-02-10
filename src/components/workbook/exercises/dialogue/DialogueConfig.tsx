"use client";

import { useState } from "react";
import { useLocale } from "@/components/LocaleProvider";

interface DialogueConfigProps {
  onStartPractice: (config: {
    mode: "static" | "ai";
    scenario?: string;
    startBy?: "user" | "ai";
  }) => void;
}

export default function DialogueConfig({ onStartPractice }: DialogueConfigProps) {
  const { t } = useLocale();
  const [mode, setMode] = useState<"static" | "ai">("ai");
  const [scenario, setScenario] = useState("");
  const [startBy, setStartBy] = useState<"user" | "ai">("ai");

  const handleStart = () => {
    onStartPractice({ mode, scenario, startBy });
  };

  return (
    <div className="space-y-6">
      {/* Mode Selection */}
      <div className="rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft">
        <h3 className="text-xl font-semibold">{t.workbook.dialogueConfigTitle}</h3>
        <p className="mt-2 text-sm text-ink/60">
          {t.workbook.dialogueConfigHint}
        </p>

        <div className="mt-6 space-y-4">
          {/* Mode Toggle */}
          <div>
            <label className="block text-xs uppercase tracking-[0.3em] text-ink/40">
              {t.workbook.dialogueMode}
            </label>
            <div className="mt-2 flex gap-2">
              <button
                onClick={() => setMode("ai")}
                className={`flex-1 rounded-2xl border px-4 py-3 text-sm transition ${
                  mode === "ai" ? "border-ink bg-ink/5" : "border-ink/10 bg-paper hover:border-ink/30"
                }`}
              >
                <div className="font-semibold">{t.workbook.dialogueAiMode}</div>
                <div className="mt-1 text-xs text-ink/60">{t.workbook.dialogueAiHint}</div>
              </button>
              <button
                onClick={() => setMode("static")}
                className={`flex-1 rounded-2xl border px-4 py-3 text-sm transition ${
                  mode === "static" ? "border-ink bg-ink/5" : "border-ink/10 bg-paper hover:border-ink/30"
                }`}
              >
                <div className="font-semibold">{t.workbook.dialogueStatic}</div>
                <div className="mt-1 text-xs text-ink/60">{t.workbook.dialogueStaticHint}</div>
              </button>
            </div>
          </div>

          {/* AI mode settings */}
          {mode === "ai" && (
            <>
              {/* Scenario */}
              <div>
                <label className="block text-xs uppercase tracking-[0.3em] text-ink/40">
                  {t.workbook.dialogueScenario}
                </label>
                <input
                  type="text"
                  value={scenario}
                  onChange={(e) => setScenario(e.target.value)}
                  placeholder={t.workbook.dialogueScenarioPlaceholder}
                  className="mt-2 w-full rounded-2xl border border-ink/20 bg-paper px-4 py-2 text-sm"
                />
              </div>

              {/* Start By */}
              <div>
                <label className="block text-xs uppercase tracking-[0.3em] text-ink/40">
                  {t.workbook.dialogueStartBy}
                </label>
                <select
                  value={startBy}
                  onChange={(e) => setStartBy(e.target.value as "user" | "ai")}
                  className="mt-2 w-full rounded-2xl border border-ink/20 bg-paper px-4 py-2 text-sm"
                >
                  <option value="ai">AI починає розмову</option>
                  <option value="user">Я починаю розмову</option>
                </select>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Start Button */}
      <div className="flex justify-end">
        <button
          onClick={handleStart}
          className="rounded-full bg-ink px-6 py-3 text-sm font-semibold text-paper shadow-soft transition hover:bg-ink/90"
        >
          {t.workbook.startPractice || "Почати практику"} →
        </button>
      </div>
    </div>
  );
}
