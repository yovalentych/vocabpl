"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/components/LocaleProvider";
import MaterialSelector from "../../shared/MaterialSelector";
import { useCloze } from "./useCloze";

interface ClozeConfigProps {
  onStartPractice: (config: {
    materialId?: string;
    trainingMode?: boolean;
    queueIds?: string[];
    aiMode?: boolean;
    aiTopic?: string;
    hintTypes?: ("word" | "translation" | "context")[];
  }) => void;
}

export default function ClozeConfig({ onStartPractice }: ClozeConfigProps) {
  const { t, locale } = useLocale();
  const {
    materials,
    activeMaterialId,
    loading,
    hintsDefault,
    setHintsDefault,
    loadMaterials,
    selectMaterial
  } = useCloze();

  const [mode, setMode] = useState<"static" | "ai">("static");
  const [aiTopic, setAiTopic] = useState("");
  const [selectedHintTypes, setSelectedHintTypes] = useState<("word" | "translation" | "context")[]>(["word", "translation", "context"]);

  useEffect(() => {
    if (mode === "static") {
      loadMaterials();
    }
  }, [mode, loadMaterials]);

  const handleStartPractice = () => {
    if (mode === "static" && !activeMaterialId) return;
    if (mode === "ai" && !aiTopic.trim()) return;

    onStartPractice({
      materialId: mode === "static" ? activeMaterialId ?? undefined : undefined,
      aiMode: mode === "ai",
      aiTopic: mode === "ai" ? aiTopic : undefined,
      hintTypes: mode === "ai" ? selectedHintTypes : undefined
    });
  };

  const toggleHintType = (type: "word" | "translation" | "context") => {
    setSelectedHintTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  return (
    <div className="space-y-6">
      {/* Mode Selection */}
      <div className="rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft">
        <h3 className="text-xl font-semibold">{t.workbook.settings.mode}</h3>
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => setMode("static")}
            className={`flex-1 rounded-2xl border px-4 py-3 text-sm transition ${
              mode === "static" ? "border-ink bg-ink/5" : "border-ink/10 bg-paper hover:border-ink/30"
            }`}
          >
            <div className="font-semibold">{t.workbook.clozeStatic}</div>
            <div className="mt-1 text-xs text-ink/60">{t.workbook.clozeStaticHint}</div>
          </button>
          <button
            onClick={() => setMode("ai")}
            className={`flex-1 rounded-2xl border px-4 py-3 text-sm transition ${
              mode === "ai" ? "border-ink bg-ink/5" : "border-ink/10 bg-paper hover:border-ink/30"
            }`}
          >
            <div className="font-semibold">{t.workbook.clozeAi}</div>
            <div className="mt-1 text-xs text-ink/60">{t.workbook.clozeAiHint}</div>
          </button>
        </div>
      </div>

      {/* Static Mode - Material Selection */}
      {mode === "static" && (
        <div className="rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft">
          <h3 className="text-xl font-semibold">{t.workbook.contentTitle}</h3>
          <p className="mt-2 text-sm text-ink/60">{t.workbook.clozeConfigHint}</p>

          <div className="mt-4">
            {loading ? (
              <div className="grid gap-3 md:grid-cols-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-24 animate-pulse rounded-2xl bg-ink/5" />
                ))}
              </div>
            ) : (
              <MaterialSelector
                materials={materials.map((m) => ({
                  _id: m._id,
                  title: m.title,
                  level: m.level
                }))}
                selectedId={activeMaterialId}
                onSelect={selectMaterial}
              />
            )}
          </div>
        </div>
      )}

      {/* AI Mode - Topic & Hint Types */}
      {mode === "ai" && (
        <>
          <div className="rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft">
            <h3 className="text-xl font-semibold">{t.workbook.clozeHintTypes}</h3>
            <p className="mt-2 text-sm text-ink/60">{t.workbook.clozeHintTypesHint}</p>

            <div className="mt-4 space-y-3">
              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={selectedHintTypes.includes("word")}
                  onChange={() => toggleHintType("word")}
                  className="h-4 w-4 rounded border-ink/20 accent-ink"
                />
                <div>
                  <span className="text-sm font-semibold">[Слово в дужках]</span>
                  <p className="text-xs text-ink/60">Підказка: (kupić)</p>
                </div>
              </label>

              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={selectedHintTypes.includes("translation")}
                  onChange={() => toggleHintType("translation")}
                  className="h-4 w-4 rounded border-ink/20 accent-ink"
                />
                <div>
                  <span className="text-sm font-semibold">[Український переклад]</span>
                  <p className="text-xs text-ink/60">Підказка: (купити)</p>
                </div>
              </label>

              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={selectedHintTypes.includes("context")}
                  onChange={() => toggleHintType("context")}
                  className="h-4 w-4 rounded border-ink/20 accent-ink"
                />
                <div>
                  <span className="text-sm font-semibold">[Контекст]</span>
                  <p className="text-xs text-ink/60">Підказка: (дієслово, що означає придбати щось)</p>
                </div>
              </label>
            </div>
          </div>
        </>
      )}

      {/* Settings */}
      <div className="rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft">
        <h3 className="text-xl font-semibold">{t.workbook.exerciseSettingsTitle}</h3>
        <div className="mt-4 space-y-3">
          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={hintsDefault}
              onChange={(e) => setHintsDefault(e.target.checked)}
              className="h-4 w-4 rounded border-ink/20 accent-ink"
            />
            <span className="text-sm">{t.workbook.clozeHintsDefaultLabel}</span>
          </label>
        </div>
      </div>

      {/* Start Button */}
      <div className="flex justify-end">
        <button
          onClick={handleStartPractice}
          disabled={
            (mode === "static" && !activeMaterialId) ||
            (mode === "ai" && !aiTopic.trim()) ||
            (mode === "ai" && selectedHintTypes.length === 0)
          }
          className="rounded-full bg-ink px-6 py-3 text-sm font-semibold text-paper shadow-soft transition hover:bg-ink/90 disabled:opacity-50"
        >
          {t.workbook.startPractice || "Почати практику"} →
        </button>
      </div>
    </div>
  );
}
