"use client";

import { useState } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { ExerciseType } from "../types";
import { useAIPrompt } from "./useAIPrompt";
import { Sparkle } from "@phosphor-icons/react/dist/ssr";

interface AIExercisePanelProps {
  exercise: ExerciseType;
  onUsePrompt?: (prompt: string) => void;
}

export default function AIExercisePanel({ exercise, onUsePrompt }: AIExercisePanelProps) {
  const { t, locale } = useLocale();
  const { generatePrompt, setTopic, aiState } = useAIPrompt();
  const [localTopic, setLocalTopic] = useState("");

  const topic = aiState.topics[exercise] || localTopic;
  const prompt = aiState.prompts[exercise];
  const status = aiState.status[exercise] || "idle";
  const message = aiState.message;

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setTopic(exercise, topic);
    await generatePrompt(exercise, topic, locale);
  };

  const handleUse = () => {
    if (prompt && onUsePrompt) {
      onUsePrompt(prompt.prompt);
    }
  };

  return (
    <div className="rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft">
      <div className="flex items-center gap-2">
        <Sparkle weight="fill" className="h-5 w-5 text-ink/40" />
        <h3 className="text-xl font-semibold">
          {t.workbook.aiExerciseTitle}
        </h3>
      </div>
      <p className="mt-2 text-sm text-ink/60">
        {t.workbook.aiExerciseHint}
      </p>

      <div className="mt-4 space-y-4">
        {/* Topic Input */}
        <div>
          <label className="block text-xs uppercase tracking-[0.3em] text-ink/40">
            {t.workbook.aiTopicLabel}
          </label>
          <input
            type="text"
            value={topic}
            onChange={(e) => {
              setLocalTopic(e.target.value);
              setTopic(exercise, e.target.value);
            }}
            placeholder={t.workbook.aiTopicPlaceholder}
            className="mt-2 w-full rounded-2xl border border-ink/20 bg-paper px-4 py-2 text-sm"
          />
        </div>

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={status === "loading" || !topic.trim()}
          className="rounded-full bg-ink px-6 py-2 text-sm font-semibold text-paper transition hover:bg-ink/90 disabled:opacity-50"
        >
          {status === "loading" ? (
            <span className="inline-flex items-center gap-2">
              <Sparkle className="h-4 w-4 animate-pulse" weight="fill" />
              {t.workbook.aiGenerating || "AI генерує..."}
            </span>
          ) : (
            t.workbook.aiGenerate
          )}
        </button>

        {/* Error Message */}
        {message && status === "error" && (
          <div className="rounded-2xl border border-terracotta/20 bg-terracotta/5 px-4 py-3 text-sm text-terracotta">
            {message}
          </div>
        )}

        {/* Generated Prompt */}
        {prompt && (
          <div className="rounded-2xl border border-moss/20 bg-moss/5 p-4">
            {prompt.title && (
              <p className="text-sm font-semibold text-moss">{prompt.title}</p>
            )}
            <p className="mt-2 text-sm text-ink">{prompt.prompt}</p>

            {onUsePrompt && (
              <button
                onClick={handleUse}
                className="mt-3 rounded-full border border-moss/40 px-4 py-2 text-xs font-semibold text-moss hover:bg-moss/10"
              >
                {t.workbook.aiUsePrompt}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
