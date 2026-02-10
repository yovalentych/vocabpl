"use client";

import { useState, useEffect } from "react";
import { useLocale } from "@/components/LocaleProvider";
import AIExercisePanel from "../../shared/AIExercisePanel";

interface ParaphraseConfigProps {
  onStartPractice: (config: {
    mode: "static" | "ai";
    topic?: string;
    targetWord?: string;
    count?: number;
  }) => void;
}

export default function ParaphraseConfig({ onStartPractice }: ParaphraseConfigProps) {
  const { t } = useLocale();
  const [mode, setMode] = useState<"static" | "ai">("ai");
  const [topic, setTopic] = useState("");
  const [targetWord, setTargetWord] = useState("");
  const [count, setCount] = useState(3);
  const [vocabularyWords, setVocabularyWords] = useState<{ pl: string; uk: string }[]>([]);
  const [loadingVocab, setLoadingVocab] = useState(false);

  // Load user's vocabulary for word selection
  useEffect(() => {
    if (mode === "ai") {
      loadVocabulary();
    }
  }, [mode]);

  async function loadVocabulary() {
    setLoadingVocab(true);
    try {
      const res = await fetch("/api/words/random?count=50");
      const data = await res.json().catch(() => ({}));
      const items = Array.isArray(data.items) ? data.items : [];
      setVocabularyWords(
        items
          .filter((item: any) => item?.pl && item?.uk)
          .map((item: any) => ({ pl: String(item.pl), uk: String(item.uk) }))
      );
    } finally {
      setLoadingVocab(false);
    }
  }

  const handleStart = () => {
    onStartPractice({
      mode,
      topic: mode === "ai" ? topic : undefined,
      targetWord: mode === "ai" ? targetWord : undefined,
      count: mode === "ai" ? count : undefined
    });
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft">
        <h3 className="text-xl font-semibold">{t.workbook.paraphraseConfigTitle}</h3>
        <p className="mt-2 text-sm text-ink/60">
          {t.workbook.paraphraseConfigHint}
        </p>

        <div className="mt-6">
          <label className="block text-xs uppercase tracking-[0.3em] text-ink/40">
            {t.workbook.paraphraseMode}
          </label>
          <div className="mt-2 flex gap-2">
            <button
              onClick={() => setMode("ai")}
              className={`flex-1 rounded-2xl border px-4 py-3 text-sm transition ${
                mode === "ai" ? "border-ink bg-ink/5" : "border-ink/10 bg-paper hover:border-ink/30"
              }`}
            >
              <div className="font-semibold">AI Generation</div>
              <div className="mt-1 text-xs text-ink/60">AI згенерує завдання</div>
            </button>
            <button
              onClick={() => setMode("static")}
              className={`flex-1 rounded-2xl border px-4 py-3 text-sm transition ${
                mode === "static" ? "border-ink bg-ink/5" : "border-ink/10 bg-paper hover:border-ink/30"
              }`}
            >
              <div className="font-semibold">{t.workbook.paraphraseStatic}</div>
              <div className="mt-1 text-xs text-ink/60">Практика з текстами</div>
            </button>
          </div>
        </div>
      </div>

      {/* AI Mode Settings */}
      {mode === "ai" && (
        <>
          <AIExercisePanel exercise="paraphrase" onUsePrompt={(prompt) => setTopic(prompt)} />

          <div className="rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft">
            <h3 className="text-xl font-semibold">
              {t.workbook.paraphraseTargetWord}
            </h3>
            <p className="mt-2 text-sm text-ink/60">
              Виберіть слово зі словника, яке обов&apos;язково має бути використане
            </p>

            <div className="mt-4">
              <label className="block text-xs uppercase tracking-[0.3em] text-ink/40">
                {t.workbook.paraphraseWordSearch}
              </label>
              <input
                type="text"
                value={targetWord}
                onChange={(e) => setTargetWord(e.target.value)}
                placeholder={t.workbook.paraphraseWordPlaceholder}
                className="mt-2 w-full rounded-2xl border border-ink/20 bg-paper px-4 py-2 text-sm"
              />
            </div>

            {/* Vocabulary Suggestions */}
            {!loadingVocab && vocabularyWords.length > 0 && (
              <div className="mt-4">
                <p className="text-xs uppercase tracking-[0.3em] text-ink/40">
                  {t.workbook.paraphraseVocabList}
                </p>
                <div className="mt-2 flex max-h-40 flex-wrap gap-2 overflow-y-auto">
                  {vocabularyWords.slice(0, 30).map((word, idx) => (
                    <button
                      key={idx}
                      onClick={() => setTargetWord(word.pl)}
                      className={`rounded-full border px-3 py-1 text-xs transition ${
                        targetWord === word.pl
                          ? "border-ink bg-ink text-paper"
                          : "border-ink/10 bg-paper hover:border-ink/30"
                      }`}
                    >
                      {word.pl} <span className="text-ink/50">({word.uk})</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft">
            <h3 className="text-xl font-semibold">
              {t.workbook.paraphraseCount}
            </h3>
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-ink">{count}</span>
                <span className="text-xs text-ink/50">речень</span>
              </div>
              <input
                type="range"
                min="2"
                max="6"
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                className="w-full accent-ink"
              />
              <div className="flex justify-between text-xs text-ink/40">
                <span>2</span>
                <span>6</span>
              </div>
            </div>
          </div>
        </>
      )}

      <div className="flex justify-end">
        <button
          onClick={handleStart}
          disabled={mode === "ai" && !topic.trim()}
          className="rounded-full bg-ink px-6 py-3 text-sm font-semibold text-paper shadow-soft transition hover:bg-ink/90 disabled:opacity-50"
        >
          {t.workbook.startPractice || "Почати практику"} →
        </button>
      </div>
    </div>
  );
}
