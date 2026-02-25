// @ts-nocheck
"use client";

import { useState, useEffect } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { CheckCircle, Circle, Sparkle } from "@phosphor-icons/react";
import { countSentences, safeParseAIResponse } from "@/lib/workbook";
import { calculatePoints } from "@/lib/scoring";
import SentencesResults from "./SentencesResults";

interface Word {
  id: string;
  pl: string;
  uk: string;
  type: string;
  sentences: string[];
}

interface SentencesAIPracticeProps {
  config: {
    topic: string;
    level: "A1" | "A2" | "B1" | "B2";
    count: number;
  };
  onComplete: () => void;
}

export default function SentencesAIPractice({ config, onComplete }: SentencesAIPracticeProps) {
  const { t, locale } = useLocale();
  const [words, setWords] = useState<Word[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(true);
  const [isChecking, setIsChecking] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [checkResult, setCheckResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Generate words with AI
  useEffect(() => {
    let cancelled = false;

    async function generateWords() {
      try {
        setError(null);
        const res = await fetch("/api/ai/run", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode: "sentences_generate",
            userInput: JSON.stringify({
              topic: config.topic,
              level: config.level,
              count: config.count
            }),
            context: JSON.stringify({ uiLanguage: locale })
          })
        });

        if (cancelled) return;

        if (!res.ok) {
          let data = {};
          try { data = await res.json(); } catch {}
          const errorCode = data?.code;
          const message =
            errorCode === "ai_quota"
              ? "Ліміт AI кредитів вичерпано"
              : errorCode === "pvs_unavailable"
                ? "Потрібен AI план"
                : data?.error || "Помилка AI";
          setError(message);
          setIsGenerating(false);
          return;
        }

        const data = await res.json();
        const result = safeParseAIResponse(data?.text);

        if (!result || !result.words || result.words.length === 0) {
          setError("AI не змогла згенерувати слова. Спробуйте іншу тему.");
          setIsGenerating(false);
          return;
        }

        const generatedWords: Word[] = result.words
          .filter((word: any) => word?.pl && word?.uk)
          .map((word: any, idx: number) => ({
            id: `ai-${idx}`,
            pl: String(word.pl).trim(),
            uk: String(word.uk).trim(),
            type: word.type || "word",
            sentences: ["", "", ""]
          }));

        if (generatedWords.length === 0) {
          setError("Всі згенеровані слова були невалідні. Спробуйте ще раз.");
          setIsGenerating(false);
          return;
        }

        setWords(generatedWords);
        setActiveId(generatedWords[0]?.id || null);
      } catch (err) {
        if (!cancelled) {
          console.error("Failed to generate words:", err);
          setError("Помилка мережі");
        }
      } finally {
        if (!cancelled) setIsGenerating(false);
      }
    }

    generateWords();
    return () => { cancelled = true; };
  }, [config.topic, config.level, config.count, locale]);

  const activeWord = words.find((w) => w.id === activeId);
  const activeIndex = words.findIndex((w) => w.id === activeId);

  const updateSentence = (wordId: string, index: number, value: string) => {
    setWords((prev) =>
      prev.map((word) => {
        if (word.id === wordId) {
          const sentences = [...word.sentences];
          sentences[index] = value;
          return { ...word, sentences };
        }
        return word;
      })
    );
  };

  const totalSentences = words.reduce((sum, word) => sum + countSentences(word.sentences), 0);

  const handleCheckWithAI = async () => {
    if (totalSentences === 0) {
      setError("Напишіть хоча б одне речення перед перевіркою");
      return;
    }

    setIsChecking(true);
    setError(null);

    try {
      const items = words.map((word) => ({
        wordId: word.id,
        word: word.pl,
        meaning: word.uk,
        type: word.type,
        sentences: word.sentences.filter((s) => s.trim())
      }));

      const payload = {
        exerciseType: "sentences",
        action: "check",
        items
      };

      const res = await fetch("/api/ai/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "sentences_check",
          userInput: JSON.stringify(payload),
          context: JSON.stringify({ uiLanguage: locale })
        })
      });

      if (!res.ok) {
        let data = {};
        try { data = await res.json(); } catch {}
        const errorCode = data?.code;
        const message =
          errorCode === "ai_quota"
            ? "Ліміт AI кредитів вичерпано"
            : errorCode === "pvs_unavailable"
              ? "Потрібен AI план"
              : data?.error || "Помилка AI";
        setError(message);
        setIsChecking(false);
        return;
      }

      const data = await res.json();
      const result = safeParseAIResponse(data?.text);

      if (!result || !result.items) {
        setError("AI повернула неправильний формат відповіді. Спробуйте ще раз.");
        setIsChecking(false);
        return;
      }

      setCheckResult(result);

      // Save points to database if we have a valid score
      if (result?.overall?.score01 != null) {
        try {
          await fetch("/api/exercises/attempt", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              exercise: "sentences",
              points: calculatePoints({ score01: result.overall.score01, level: config.level, itemCount: config.count, exercise: "sentences" })
            })
          });
        } catch (err) {
          console.error("Failed to save points:", err);
        }
      }

      // Show results modal
      setShowResults(true);
    } catch (err) {
      console.error("Failed to check with AI:", err);
      setError("Помилка мережі");
    } finally {
      setIsChecking(false);
    }
  };

  if (isGenerating) {
    return (
      <div className="rounded-3xl border border-ink/10 bg-paper/80 p-8 shadow-soft text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Sparkle size={24} weight="fill" className="text-gold animate-pulse" />
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold/20 border-t-gold" />
        </div>
        <p className="text-sm font-semibold text-ink mb-2">AI генерує завдання...</p>
        <p className="text-xs text-ink/60">
          Тема: <span className="font-medium">{config.topic}</span> · Рівень: <span className="font-medium">{config.level}</span>
        </p>
      </div>
    );
  }

  if (error && words.length === 0) {
    return (
      <div className="rounded-3xl border border-terracotta/20 bg-terracotta/5 p-8 shadow-soft text-center">
        <p className="text-sm font-semibold text-terracotta mb-2">Помилка</p>
        <p className="text-sm text-ink/70">{error}</p>
        <button
          onClick={onComplete}
          className="mt-4 inline-flex items-center gap-2 rounded-full border border-ink/20 px-4 py-2 text-xs font-semibold text-ink transition hover:bg-ink/5"
        >
          {t.common.retry}
        </button>
      </div>
    );
  }

  if (!activeWord) {
    return (
      <div className="rounded-3xl border border-ink/10 bg-paper/80 p-8 shadow-soft text-center">
        <p className="text-sm text-ink/60">
          Слова не згенеровано. Спробуйте ще раз.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-6 grid-cols-1 md:grid-cols-[260px_1fr] lg:grid-cols-[300px_1fr]">
        {/* Left sidebar - word list */}
        <div className="rounded-3xl border border-ink/10 bg-paper/80 p-4 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs uppercase tracking-[0.3em] text-ink/40">
              Слова AI
            </p>
            <div className="text-xs text-ink/50">
              {activeIndex + 1} / {words.length}
            </div>
          </div>

          <div className="space-y-2">
            {words.map((word) => {
              const isActive = word.id === activeId;
              const sentenceCount = countSentences(word.sentences);

              return (
                <button
                  key={word.id}
                  onClick={() => setActiveId(word.id)}
                  className={`w-full rounded-2xl border p-3 text-left transition ${
                    isActive
                      ? "border-gold bg-gold/5"
                      : "border-ink/10 hover:border-ink/30 hover:bg-paper"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-ink truncate">
                        {word.pl}
                      </p>
                      <p className="text-xs text-ink/60 truncate">{word.uk}</p>
                    </div>

                    {/* Status indicator */}
                    <div className="flex-shrink-0">
                      {sentenceCount >= 3 ? (
                        <CheckCircle size={18} weight="fill" className="text-moss" />
                      ) : sentenceCount > 0 ? (
                        <Circle size={18} weight="fill" className="text-gold/50" />
                      ) : (
                        <Circle size={18} className="text-ink/20" />
                      )}
                    </div>
                  </div>

                  {/* Sentence count */}
                  <div className="mt-2 text-xs text-ink/50">
                    {sentenceCount} / 3 речень
                  </div>
                </button>
              );
            })}
          </div>

          {/* Stats */}
          <div className="mt-4 rounded-2xl border border-ink/10 bg-fog p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs uppercase tracking-[0.2em] text-ink/40">
                Прогрес
              </span>
              <span className="text-sm font-bold text-gold">
                {totalSentences} / {words.length * 3}
              </span>
            </div>
            <div className="h-2 rounded-full bg-ink/10 overflow-hidden">
              <div
                className="h-full bg-gold transition-all"
                style={{ width: `${(totalSentences / (words.length * 3)) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Right panel - sentence input */}
        <div className="space-y-6">
          {/* Theme badge */}
          <div className="rounded-2xl border border-gold/20 bg-gold/5 px-4 py-2 inline-flex items-center gap-2">
            <Sparkle size={16} weight="fill" className="text-gold" />
            <span className="text-xs font-semibold text-gold">
              Тема: {config.topic} · {config.level}
            </span>
          </div>

          {/* Active word card */}
          <div className="rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-ink/40">
                  {activeWord.type}
                </p>
                <h3 className="mt-2 text-2xl font-semibold text-ink">
                  {activeWord.pl}
                </h3>
                <p className="mt-1 text-sm text-ink/60">{activeWord.uk}</p>
              </div>

              {/* Progress */}
              <div className="text-right">
                <p className="text-xs text-ink/50">
                  Слово {activeIndex + 1} з {words.length}
                </p>
              </div>
            </div>
          </div>

          {/* Sentence inputs */}
          <div className="rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft">
            <p className="text-xs uppercase tracking-[0.3em] text-ink/40 mb-4">
              Напишіть речення
            </p>

            <div className="space-y-4">
              {activeWord.sentences.map((sentence, index) => (
                <div key={index}>
                  <label className="block text-xs text-ink/60 mb-2">
                    Речення {index + 1}
                  </label>
                  <textarea
                    value={sentence}
                    onChange={(e) => updateSentence(activeWord.id, index, e.target.value)}
                    placeholder="Напишіть речення польською..."
                    rows={3}
                    maxLength={500}
                    className="w-full rounded-2xl border border-ink/20 bg-paper px-4 py-3 text-sm text-ink placeholder:text-ink/40 focus:border-gold/40 focus:outline-none focus:ring-0"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="rounded-2xl border border-terracotta/20 bg-terracotta/5 p-4 text-sm text-terracotta">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleCheckWithAI}
              disabled={isChecking || totalSentences === 0}
              className="inline-flex items-center gap-2 rounded-full bg-gold px-6 py-3 text-sm font-semibold text-paper transition hover:bg-gold/90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isChecking ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-paper/20 border-t-paper" />
                  <span>Перевірка AI...</span>
                </>
              ) : (
                <>
                  <Sparkle size={18} weight="fill" />
                  <span>Перевірити з AI</span>
                </>
              )}
            </button>

            <button
              onClick={() => {
                const currentIndex = words.findIndex((w) => w.id === activeId);
                const nextWord = words[currentIndex + 1];
                if (nextWord) {
                  setActiveId(nextWord.id);
                }
              }}
              disabled={activeIndex === words.length - 1}
              className="inline-flex items-center gap-2 rounded-full border border-ink/20 px-6 py-3 text-sm font-semibold text-ink transition hover:bg-ink/5 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <span>Наступне слово</span>
              <span>→</span>
            </button>
          </div>
        </div>
      </div>

      {/* Results Modal */}
      {showResults && checkResult && (
        <SentencesResults
          results={{
            mode: "ai",
            totalWords: words.length,
            totalSentences,
            aiCheck: checkResult,
            topic: config.topic,
            level: config.level
          }}
          onClose={() => {
            setShowResults(false);
            onComplete();
          }}
        />
      )}
    </>
  );
}
