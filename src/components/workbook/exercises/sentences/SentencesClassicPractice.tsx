// @ts-nocheck
"use client";

import { useState, useEffect } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { CheckCircle, Circle, FloppyDisk, Sparkle, PaperPlaneRight } from "@phosphor-icons/react";
import SentencesResults from "./SentencesResults";

interface Word {
  id: string;
  pl: string;
  uk: string;
  type: string;
  sentences: string[];
}

interface SentencesClassicPracticeProps {
  config: {
    selectedTypes: string[];
    includeFavorites: boolean;
    includeMyWords: boolean;
    count: number;
  };
  onComplete: () => void;
}

export default function SentencesClassicPractice({ config, onComplete }: SentencesClassicPracticeProps) {
  const { t } = useLocale();
  const [words, setWords] = useState<Word[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isCheckingAI, setIsCheckingAI] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Load words from API
  useEffect(() => {
    async function loadWords() {
      try {
        const selected = [...config.selectedTypes];
        if (config.includeFavorites) selected.push("favorites");
        if (config.includeMyWords) selected.push("my_words");

        const params = new URLSearchParams();
        params.set("types", selected.join(","));
        params.set("count", String(config.count));

        const res = await fetch(`/api/workbook/words?${params.toString()}`);
        const data = await res.json();

        const items: Word[] = (data.items || []).map((word: any) => ({
          ...word,
          sentences: ["", "", ""]
        }));

        setWords(items);
        setActiveId(items[0]?.id || null);
      } catch (error) {
        console.error("Failed to load words:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadWords();
  }, [config]);

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

  const countSentences = (sentences: string[]) => {
    return sentences.map((s) => s.trim()).filter(Boolean).length;
  };

  const scoreForCount = (count: number) => {
    if (count >= 3) return 1;
    if (count === 2) return 0.75;
    if (count === 1) return 0.5;
    return 0;
  };

  const totalPoints = words.reduce((sum, word) => {
    const count = countSentences(word.sentences);
    return sum + scoreForCount(count);
  }, 0);

  const handleCheckWithAI = async () => {
    // Get words with at least one sentence
    const completed = words.filter((word) => countSentences(word.sentences) > 0);

    if (completed.length === 0) {
      alert("Будь ласка, напишіть хоча б одне речення");
      return;
    }

    setIsCheckingAI(true);
    setError(null);

    try {
      const items = completed.map((word) => ({
        word: word.pl,
        translation: word.uk,
        sentences: word.sentences.filter(s => s.trim())
      }));

      const res = await fetch("/api/ai/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "sentences_check",
          userInput: JSON.stringify({
            exerciseType: "sentences",
            action: "check",
            items
          }),
          context: JSON.stringify({ uiLanguage: t.locale || "uk" })
        })
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const errorCode = data?.code;
        const message =
          errorCode === "ai_quota"
            ? "Ліміт AI кредитів вичерпано"
            : errorCode === "pvs_unavailable"
              ? "Потрібен AI план"
              : data?.error || "Помилка AI";
        setError(message);
        return;
      }

      const result = JSON.parse(String(data?.text || "{}"));

      // Save points to database
      if (result?.overall?.pointsForRating) {
        await fetch("/api/exercises/attempt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            exercise: "sentences",
            points: result.overall.pointsForRating,
            xp: result.overall.xp || 0
          })
        });
      }

      // Show results
      const totalSentences = completed.reduce((sum, word) => sum + countSentences(word.sentences), 0);
      setResults({
        mode: "classic",
        totalWords: words.length,
        totalSentences,
        aiCheck: result
      });
      setShowResults(true);
    } catch (error) {
      console.error("Failed to check with AI:", error);
      setError("Помилка перевірки");
    } finally {
      setIsCheckingAI(false);
    }
  };

  const handleSubmitForReview = async () => {
    const completed = words.filter((word) => countSentences(word.sentences) > 0);

    if (completed.length === 0) {
      alert("Будь ласка, напишіть хоча б одне речення");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/workbook/exercises/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exerciseType: "sentences",
          items: completed.map((word) => ({
            word: word.pl,
            translation: word.uk,
            sentences: word.sentences.filter(s => s.trim())
          }))
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.error || "Помилка надсилання");
        return;
      }

      // Save minimal points for submission
      const totalSentences = completed.reduce((sum, word) => sum + countSentences(word.sentences), 0);
      await fetch("/api/exercises/attempt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exercise: "sentences",
          points: totalSentences,
          xp: totalSentences * 2
        })
      });

      alert("✅ Вправу надіслано на перевірку! Очікуйте фідбек від викладача.");
      onComplete();
    } catch (error) {
      console.error("Failed to submit:", error);
      setError("Помилка надсилання");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-3xl border border-ink/10 bg-paper/80 p-8 shadow-soft text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-moss/20 border-t-moss mx-auto" />
        <p className="mt-4 text-sm text-ink/60">Завантаження слів...</p>
      </div>
    );
  }

  if (!activeWord) {
    return (
      <div className="rounded-3xl border border-ink/10 bg-paper/80 p-8 shadow-soft text-center">
        <p className="text-sm text-ink/60">
          Слова не знайдено. Спробуйте інші налаштування.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        {/* Left sidebar - word list */}
        <div className="rounded-3xl border border-ink/10 bg-paper/80 p-4 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs uppercase tracking-[0.3em] text-ink/40">
              Слова
            </p>
            <div className="text-xs text-ink/50">
              {activeIndex + 1} / {words.length}
            </div>
          </div>

          <div className="space-y-2">
            {words.map((word) => {
              const isActive = word.id === activeId;
              const sentenceCount = countSentences(word.sentences);
              const score = scoreForCount(sentenceCount);

              return (
                <button
                  key={word.id}
                  onClick={() => setActiveId(word.id)}
                  className={`w-full rounded-2xl border p-3 text-left transition ${
                    isActive
                      ? "border-moss bg-moss/5"
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
                  <div className="mt-2 flex items-center gap-2 text-xs text-ink/50">
                    <span>{sentenceCount} / 3 речень</span>
                    {score > 0 && (
                      <span className="text-gold">+{score} pts</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Total points */}
          <div className="mt-4 rounded-2xl border border-ink/10 bg-fog p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-[0.2em] text-ink/40">
                Всього
              </span>
              <span className="text-lg font-bold text-gold">
                {totalPoints.toFixed(1)} pts
              </span>
            </div>
          </div>
        </div>

        {/* Right panel - sentence input */}
        <div className="space-y-6">
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
                    className="w-full rounded-2xl border border-ink/20 bg-paper px-4 py-3 text-sm text-ink placeholder:text-ink/40 focus:border-moss/40 focus:outline-none focus:ring-0"
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
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleCheckWithAI}
                disabled={isCheckingAI || totalPoints === 0}
                className="inline-flex items-center gap-2 rounded-full bg-moss px-6 py-3 text-sm font-semibold text-paper transition hover:bg-moss/90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isCheckingAI ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-paper/20 border-t-paper" />
                    <span>AI перевіряє...</span>
                  </>
                ) : (
                  <>
                    <Sparkle size={18} weight="fill" />
                    <span>Перевірити з AI</span>
                  </>
                )}
              </button>

              <button
                onClick={handleSubmitForReview}
                disabled={isSubmitting || totalPoints === 0}
                className="inline-flex items-center gap-2 rounded-full bg-terracotta px-6 py-3 text-sm font-semibold text-paper transition hover:bg-terracotta/90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isSubmitting ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-paper/20 border-t-paper" />
                    <span>Надсилання...</span>
                  </>
                ) : (
                  <>
                    <PaperPlaneRight size={18} weight="fill" />
                    <span>Надіслати на перевірку</span>
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

            <p className="text-xs text-ink/50">
              💡 Перевірка з AI дає детальний фідбек та оцінку. Відправка на перевірку — для ручного review від викладача.
            </p>
          </div>
        </div>
      </div>

      {/* Results Modal */}
      {showResults && results && (
        <SentencesResults
          results={results}
          onClose={() => {
            setShowResults(false);
            onComplete();
          }}
        />
      )}
    </>
  );
}
