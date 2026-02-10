// @ts-nocheck
"use client";

import { useState } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { CheckCircle, Circle, Sparkle, PaperPlaneRight } from "@phosphor-icons/react";
import ClozeResults from "./ClozeResults";

interface ClozeClassicPracticeProps {
  config: {
    level: "A1" | "A2" | "B1" | "B2";
    sentenceCount: number;
  };
  onComplete: () => void;
}

// Static placeholder data - in real app this would come from database
const generateStaticExercise = (level: string, count: number) => {
  const exercises = {
    A1: [
      { text: "Dzisiaj jest ___ pogoda.", answer: "ładna", hint: "гарна (прикметник)" },
      { text: "Mam ___ lata.", answer: "dwadzieścia", hint: "20 (числівник)" },
      { text: "Lubię ___ kawę.", answer: "pić", hint: "пити (дієслово)" },
      { text: "To jest ___ książka.", answer: "moja", hint: "моя (присвійний займенник)" },
      { text: "Mieszkam w ___.", answer: "Warszawie", hint: "Варшава (місцевий відмінок)" },
    ],
    A2: [
      { text: "Wczoraj ___ do kina.", answer: "poszedłem", hint: "пішов (минулий час)" },
      { text: "Ona ___ po polsku.", answer: "mówi", hint: "говорить (теперішній час)" },
      { text: "Będę ___ w bibliotece.", answer: "uczyć się", hint: "вчитися (інфінітив)" },
      { text: "To jest ___ niż tamto.", answer: "lepsze", hint: "краще (вищий ступінь)" },
      { text: "Spotkałem ___ przyjaciela.", answer: "mojego", hint: "мого (знахідний відмінок)" },
    ]
  };

  const levelExercises = exercises[level] || exercises.A2;
  return levelExercises.slice(0, Math.min(count, levelExercises.length));
};

export default function ClozeClassicPractice({ config, onComplete }: ClozeClassicPracticeProps) {
  const { t } = useLocale();
  const [items] = useState(() => generateStaticExercise(config.level, config.sentenceCount));
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [isCheckingAI, setIsCheckingAI] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateAnswer = (index: number, value: string) => {
    setAnswers((prev) => ({ ...prev, [index]: value }));
  };

  const checkAnswer = (index: number): "correct" | "partial" | "empty" => {
    const userAnswer = (answers[index] || "").trim().toLowerCase();
    const correctAnswer = items[index].answer.toLowerCase();

    if (!userAnswer) return "empty";
    if (userAnswer === correctAnswer) return "correct";
    return "partial";
  };

  const handleCheckWithAI = async () => {
    const filledAnswers = Object.entries(answers).filter(([_, value]) => value.trim());

    if (filledAnswers.length === 0) {
      alert("Будь ласка, заповніть хоча б одну пропуск");
      return;
    }

    setIsCheckingAI(true);
    setError(null);

    try {
      const exerciseItems = filledAnswers.map(([indexStr, userAnswer]) => {
        const index = parseInt(indexStr);
        return {
          sentence: items[index].text,
          correctAnswer: items[index].answer,
          userAnswer: userAnswer.trim(),
          hint: items[index].hint
        };
      });

      const res = await fetch("/api/ai/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "cloze_check",
          userInput: JSON.stringify({
            exerciseType: "cloze",
            action: "check",
            level: config.level,
            items: exerciseItems
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
            exercise: "cloze",
            points: result.overall.pointsForRating,
            xp: result.overall.xp || 0
          })
        });
      }

      // Show results
      setShowResults(true);
    } catch (error) {
      console.error("Failed to check with AI:", error);
      setError("Помилка перевірки");
    } finally {
      setIsCheckingAI(false);
    }
  };

  const handleSubmitForReview = async () => {
    const filledAnswers = Object.entries(answers).filter(([_, value]) => value.trim());

    if (filledAnswers.length === 0) {
      alert("Будь ласка, заповніть хоча б одну пропуск");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const exerciseItems = filledAnswers.map(([indexStr, userAnswer]) => {
        const index = parseInt(indexStr);
        return {
          sentence: items[index].text,
          correctAnswer: items[index].answer,
          userAnswer: userAnswer.trim(),
          hint: items[index].hint
        };
      });

      const res = await fetch("/api/workbook/exercises/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exerciseType: "cloze",
          level: config.level,
          items: exerciseItems
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.error || "Помилка надсилання");
        return;
      }

      // Save minimal points for submission
      await fetch("/api/exercises/attempt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exercise: "cloze",
          points: filledAnswers.length,
          xp: filledAnswers.length * 2
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

  const filledCount = Object.values(answers).filter((a) => a.trim()).length;
  const correctCount = items.filter((_, idx) => checkAnswer(idx) === "correct").length;

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="rounded-3xl border border-gold/20 bg-gold/5 p-6 shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-gold/70 mb-2">
                Класичний режим
              </p>
              <h2 className="text-xl font-semibold text-ink">
                Заповніть пропуски
              </h2>
              <p className="mt-1 text-sm text-ink/60">
                Рівень: {config.level} · {items.length} речень
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gold">{filledCount}/{items.length}</div>
              <div className="text-xs text-ink/50">заповнено</div>
            </div>
          </div>
        </div>

        {/* Exercise items */}
        <div className="space-y-4">
          {items.map((item, index) => {
            const status = checkAnswer(index);
            const userAnswer = answers[index] || "";

            // Split text by gap marker
            const parts = item.text.split("___");

            return (
              <div
                key={index}
                className="rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-fog text-xs font-semibold text-ink">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    {/* Sentence with gap */}
                    <div className="mb-3 flex flex-wrap items-center gap-2 text-base text-ink">
                      <span>{parts[0]}</span>
                      <input
                        type="text"
                        value={userAnswer}
                        onChange={(e) => updateAnswer(index, e.target.value)}
                        placeholder="..."
                        className="inline-block min-w-[120px] rounded-xl border border-ink/20 bg-paper px-3 py-1.5 text-sm text-ink placeholder:text-ink/30 focus:border-gold/40 focus:outline-none"
                      />
                      <span>{parts[1]}</span>
                    </div>

                    {/* Hint */}
                    <div className="rounded-xl border border-gold/20 bg-gold/5 px-3 py-2">
                      <p className="text-xs text-ink/70">
                        <span className="font-semibold text-gold">Підказка:</span> {item.hint}
                      </p>
                    </div>

                    {/* Status indicator (after checking) */}
                    {userAnswer && status !== "empty" && (
                      <div className="mt-2 flex items-center gap-2">
                        {status === "correct" ? (
                          <CheckCircle size={16} weight="fill" className="text-moss" />
                        ) : (
                          <Circle size={16} weight="fill" className="text-terracotta" />
                        )}
                        <span className={`text-xs ${status === "correct" ? "text-moss" : "text-terracotta"}`}>
                          {status === "correct" ? "Правильно!" : "Перевірте відповідь"}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

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
              disabled={isCheckingAI || filledCount === 0}
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
              disabled={isSubmitting || filledCount === 0}
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
            💡 Перевірка з AI дає детальний фідбек та оцінку. Відправка на перевірку — для ручного review від викладача.
          </p>

          <div className="text-center text-sm text-ink/60">
            Заповнено: {filledCount} з {items.length}
          </div>
        </div>
      </div>

      {/* Results Modal */}
      {showResults && (
        <ClozeResults
          results={{
            mode: "classic",
            totalGaps: items.length,
            correctCount,
            score: correctCount / items.length,
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
