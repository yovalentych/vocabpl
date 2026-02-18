// @ts-nocheck
"use client";

import { useState } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { CheckCircle, Circle, Sparkle, PaperPlaneRight } from "@phosphor-icons/react";
import { safeParseAIResponse } from "@/lib/workbook";
import TranslateResults from "./TranslateResults";

interface Sentence {
  id: string;
  source: string;
  userTranslation: string;
}

interface TranslateClassicPracticeProps {
  config: {
    direction: "uk_to_pl" | "pl_to_uk";
    level: "A1" | "A2" | "B1" | "B2";
    count: number;
  };
  onComplete: () => void;
}

// Static placeholder sentences for both directions
const UK_TO_PL_SENTENCES = [
  "Я хочу вивчити польську мову.",
  "Сьогодні гарна погода.",
  "Мені подобається ця книга.",
  "Де знаходиться найближча аптека?",
  "Я люблю подорожувати.",
  "Це дуже цікаво.",
  "Я хочу каву, будь ласка.",
  "Який сьогодні день тижня?",
  "Можна мені рахунок?",
  "Я вивчаю польську в університеті.",
  "Скільки це коштує?",
  "Дякую за допомогу."
];

const PL_TO_UK_SENTENCES = [
  "Dzień dobry, jak się masz?",
  "Chciałbym kupić bilet.",
  "Gdzie jest dworzec kolejowy?",
  "Czy mówisz po angielsku?",
  "Przepraszam, nie rozumiem.",
  "To jest bardzo dobre.",
  "Jaka jest pogoda dzisiaj?",
  "Pracuję w biurze.",
  "Lubię czytać książki.",
  "Czy mogę prosić o pomoc?",
  "To jest mój przyjaciel.",
  "Dziękuję bardzo."
];

export default function TranslateClassicPractice({ config, onComplete }: TranslateClassicPracticeProps) {
  const { t } = useLocale();
  const sourcePool = config.direction === "uk_to_pl" ? UK_TO_PL_SENTENCES : PL_TO_UK_SENTENCES;
  const selectedSources = sourcePool.slice(0, config.count);

  const [sentences, setSentences] = useState<Sentence[]>(
    selectedSources.map((source, idx) => ({
      id: `sentence-${idx}`,
      source,
      userTranslation: ""
    }))
  );

  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [aiCheckResult, setAiCheckResult] = useState<any>(null);
  const [isCheckingAI, setIsCheckingAI] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const isProcessing = isCheckingAI || isSubmitting;

  const updateTranslation = (id: string, value: string) => {
    setSentences((prev) =>
      prev.map((sent) =>
        sent.id === id ? { ...sent, userTranslation: value } : sent
      )
    );
  };

  const completedCount = sentences.filter((s) => s.userTranslation.trim()).length;
  const accuracy = sentences.length > 0 ? (completedCount / sentences.length) * 100 : 0;
  const score = completedCount;

  const handleCheckWithAI = async () => {
    const completed = sentences.filter((s) => s.userTranslation.trim());

    if (completed.length === 0) {
      setError("Будь ласка, перекладіть хоча б одне речення");
      return;
    }

    setIsCheckingAI(true);
    setError(null);

    try {
      const items = completed.map((sentence) => ({
        source: sentence.source,
        translation: sentence.userTranslation.trim(),
        direction: config.direction
      }));

      const res = await fetch("/api/ai/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "translate_check",
          userInput: JSON.stringify({
            exerciseType: "translate",
            action: "check",
            direction: config.direction,
            level: config.level,
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

      const result = safeParseAIResponse(data?.text);

      if (!result || !result.items) {
        setError("AI повернула неправильний формат відповіді. Спробуйте ще раз.");
        return;
      }

      // Save points to database
      if (result?.overall?.pointsForRating) {
        try {
          await fetch("/api/exercises/attempt", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              exercise: "translate",
              points: result.overall.pointsForRating,
              xp: result.overall.xp || 0
            })
          });
        } catch (err) {
          console.error("Failed to save points:", err);
        }
      }

      // Store AI result and show results
      setAiCheckResult(result);
      setResults({
        mode: "classic",
        total: sentences.length,
        completed: completed.length,
        accuracy: result.overall?.accuracy || accuracy,
        score: result.overall?.points || score,
        aiCheck: result,
        direction: config.direction,
        level: config.level
      });
      setShowResults(true);
    } catch (err) {
      console.error("Failed to check with AI:", err);
      setError("Помилка перевірки");
    } finally {
      setIsCheckingAI(false);
    }
  };

  const handleSubmitForReview = async () => {
    const completed = sentences.filter((s) => s.userTranslation.trim());

    if (completed.length === 0) {
      setError("Будь ласка, перекладіть хоча б одне речення");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/workbook/exercises/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exerciseType: "translate",
          level: config.level,
          direction: config.direction,
          items: completed.map((s) => ({
            source: s.source,
            translation: s.userTranslation
          }))
        })
      });

      if (!res.ok) {
        let data = {};
        try { data = await res.json(); } catch {}
        setError(data?.error || "Помилка надсилання");
        return;
      }

      // Save minimal points for submission
      try {
        await fetch("/api/exercises/attempt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            exercise: "translate",
            points: completed.length,
            xp: completed.length * 2
          })
        });
      } catch (err) {
        console.error("Failed to save points:", err);
      }

      setSuccessMessage("Вправу надіслано на перевірку! Очікуйте фідбек від викладача.");
      setTimeout(() => onComplete(), 2000);
    } catch (err) {
      console.error("Failed to submit:", err);
      setError("Помилка надсилання");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="rounded-3xl border border-moss/20 bg-moss/5 p-6 shadow-soft">
          <p className="text-xs uppercase tracking-[0.3em] text-moss/70 mb-2">
            Крок 2: Практика
          </p>
          <h2 className="text-2xl font-semibold text-ink">
            Переклад речень
          </h2>
          <p className="mt-2 text-sm text-ink/60">
            {config.direction === "uk_to_pl"
              ? "Перекладіть речення з української на польську"
              : "Перекладіть речення з польської на українську"}
            {" · "}
            Рівень: {config.level}
          </p>
        </div>

        {/* Progress */}
        <div className="rounded-3xl border border-ink/10 bg-paper/80 p-4 shadow-soft">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs uppercase tracking-[0.3em] text-ink/40">Прогрес</p>
            <p className="text-sm font-semibold text-ink">
              {completedCount} / {sentences.length}
            </p>
          </div>
          <div className="h-2 rounded-full bg-ink/10 overflow-hidden">
            <div
              className="h-full bg-moss transition-all"
              style={{ width: `${(completedCount / sentences.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Sentences */}
        <div className="space-y-4">
          {sentences.map((sentence, index) => {
            const isCompleted = sentence.userTranslation.trim().length > 0;

            return (
              <div
                key={sentence.id}
                className="rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-full border border-ink/20 bg-fog">
                    <span className="text-xs font-semibold text-ink">{index + 1}</span>
                  </div>

                  <div className="flex-1 space-y-4">
                    {/* Source sentence */}
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-ink/40 mb-2">
                        {config.direction === "uk_to_pl" ? "Українська" : "Польська"}
                      </p>
                      <p className="text-base font-medium text-ink">{sentence.source}</p>
                    </div>

                    {/* Translation input */}
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-ink/40 mb-2">
                        {config.direction === "uk_to_pl" ? "Польська" : "Українська"}
                      </p>
                      <textarea
                        value={sentence.userTranslation}
                        onChange={(e) => updateTranslation(sentence.id, e.target.value)}
                        placeholder={
                          config.direction === "uk_to_pl"
                            ? "Введіть переклад польською..."
                            : "Введіть переклад українською..."
                        }
                        rows={2}
                        maxLength={500}
                        className="w-full rounded-2xl border border-ink/20 bg-paper px-4 py-3 text-sm text-ink placeholder:text-ink/40 focus:border-moss/40 focus:outline-none focus:ring-0"
                      />
                    </div>
                  </div>

                  {/* Status indicator */}
                  <div className="flex-shrink-0">
                    {isCompleted ? (
                      <CheckCircle size={20} weight="fill" className="text-moss" />
                    ) : (
                      <Circle size={20} className="text-ink/20" />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Success message */}
        {successMessage && (
          <div className="rounded-2xl border border-moss/20 bg-moss/5 p-4 text-sm text-moss">
            {successMessage}
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="rounded-2xl border border-terracotta/20 bg-terracotta/5 p-4 text-sm text-terracotta">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={handleCheckWithAI}
              disabled={isProcessing || completedCount === 0}
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
              disabled={isProcessing || completedCount === 0}
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
          </div>

          <p className="text-center text-xs text-ink/50">
            Перевірка з AI дає детальний фідбек та оцінку. Відправка на перевірку — для ручного review від викладача.
          </p>
        </div>
      </div>

      {/* Results Modal */}
      {showResults && results && (
        <TranslateResults
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
