"use client";

import { useState } from "react";
import { CheckCircle, XCircle, Lightning, BookOpen, Sparkle, X } from "@phosphor-icons/react";
import { useReadingComprehension, type ComprehensionQuestion, type UserAnswer } from "./hooks/useReadingComprehension";
import Loader from "@/components/ui/Loader";
import ErrorFeedbackModal from "@/components/ui/ErrorFeedbackModal";

interface ReadingComprehensionProps {
  text: string;
  textId: string;
  level: string;
  locale?: string;
  viewMode?: "pl" | "uk" | "dual";
  textTitle?: { pl: string; uk: string };
  textTopic?: string;
}

export default function ReadingComprehension({
  text,
  textId,
  level,
  locale = "uk",
  viewMode = "dual",
  textTitle,
  textTopic
}: ReadingComprehensionProps) {
  const {
    questions,
    answers,
    result,
    generating,
    checking,
    error,
    points,
    generateQuestions,
    checkAnswers,
    updateAnswer,
    reset
  } = useReadingComprehension();

  const [questionCount] = useState(10);
  const [showResultModal, setShowResultModal] = useState(false);
  const [addingVocab, setAddingVocab] = useState(false);
  const [vocabAdded, setVocabAdded] = useState(false);
  const [vocabMessage, setVocabMessage] = useState("");
  const [savingSession, setSavingSession] = useState(false);
  const [sessionSaved, setSessionSaved] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorDetails, setErrorDetails] = useState<any>(null);
  const [retryAction, setRetryAction] = useState<"generate" | "check" | null>(null);

  async function handleGenerate() {
    const success = await generateQuestions(text, level, questionCount, locale);
    if (!success && error) {
      setErrorDetails({
        endpoint: "/api/ai/run",
        payload: { mode: "reading_questions_generate", text, level, questionCount },
        response: error
      });
      setRetryAction("generate");
      setShowErrorModal(true);
    }
  }

  async function handleCheck() {
    const success = await checkAnswers(text, textId, locale);
    if (success) {
      setShowResultModal(true);
      // Auto-save session after successful check
      await handleSaveSession();
    } else if (error) {
      setErrorDetails({
        endpoint: "/api/ai/run",
        payload: { mode: "reading_comprehension_check", text, questions, answers },
        response: error
      });
      setRetryAction("check");
      setShowErrorModal(true);
    }
  }

  function handleReset() {
    reset();
    setShowResultModal(false);
    setVocabAdded(false);
    setVocabMessage("");
    setSessionSaved(false);
  }

  async function handleSaveSession() {
    if (!result || !questions) return;

    setSavingSession(true);

    try {
      const res = await fetch("/api/reading/comprehension/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          textId,
          textTitle: textTitle || { pl: "Unknown", uk: "Невідомо" },
          textLevel: level,
          textTopic: textTopic || "",
          questions,
          answers,
          result,
          viewMode
        })
      });

      if (res.ok) {
        setSessionSaved(true);
      }
    } catch (err) {
      console.error("Save session error:", err);
    } finally {
      setSavingSession(false);
    }
  }

  async function handleAddVocabulary() {
    if (!result?.suggestedVocab || result.suggestedVocab.length === 0) return;

    setAddingVocab(true);
    setVocabMessage("");

    try {
      let added = 0;
      let skipped = 0;

      for (const vocab of result.suggestedVocab) {
        const res = await fetch("/api/user/words/custom", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pl: vocab.lemma, uk: vocab.meaning })
        });
        if (res.ok) {
          added += 1;
        } else if (res.status === 409) {
          skipped += 1;
        } else if (res.status === 403) {
          setVocabMessage("Доступ до словника доступний лише для активної підписки.");
          setAddingVocab(false);
          return;
        } else {
          skipped += 1;
        }
      }

      setVocabAdded(true);

      if (added > 0) {
        setVocabMessage(`✓ Додано ${added} ${added === 1 ? "слово" : added < 5 ? "слова" : "слів"} до словника!`);
      } else if (skipped > 0) {
        setVocabMessage("Ці слова вже в словнику або не знайдені");
      }
    } catch (err) {
      console.error("Add vocabulary error:", err);
      setVocabMessage("Помилка додавання слів");
    } finally {
      setAddingVocab(false);
    }
  }

  // Check if all questions are answered
  function isAnswered(answer: UserAnswer): boolean {
    switch (answer.type) {
      case "open":
      case "short":
        return !!answer.textValue && answer.textValue.trim().length > 0;
      case "truefalse":
        return answer.boolValue !== undefined;
      case "multiple":
        return answer.optionIndex !== undefined;
      default:
        return false;
    }
  }

  const allAnswered = answers.length > 0 && answers.every(isAnswered);

  // Render question based on type
  function renderQuestion(question: ComprehensionQuestion, idx: number) {
    const displayLang = viewMode === "uk" ? "uk" : "pl";
    const questionText = question.question[displayLang];
    const answer = answers[idx];
    const isDisabled = checking || !!result;

    return (
      <div key={idx} className="rounded-2xl border border-ink/10 bg-paper/60 p-4">
        <div className="flex items-start gap-3">
          <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-moss/10 text-sm font-semibold text-moss">
            {idx + 1}
          </span>
          <div className="flex-1">
            <p className="text-sm font-medium text-ink/90">{questionText}</p>

            {/* Open-ended question */}
            {question.type === "open" && (
              <textarea
                value={answer?.textValue || ""}
                onChange={(e) => updateAnswer(idx, { textValue: e.target.value })}
                placeholder="Ваша відповідь..."
                rows={3}
                disabled={isDisabled}
                className="mt-3 w-full rounded-xl border border-ink/20 bg-paper px-3 py-2 text-sm resize-none focus:border-moss/40 focus:outline-none"
              />
            )}

            {/* Short answer question */}
            {question.type === "short" && (
              <input
                type="text"
                value={answer?.textValue || ""}
                onChange={(e) => updateAnswer(idx, { textValue: e.target.value })}
                placeholder="Коротка відповідь (1-3 слова)..."
                disabled={isDisabled}
                className="mt-3 w-full rounded-xl border border-ink/20 bg-paper px-3 py-2 text-sm focus:border-moss/40 focus:outline-none"
              />
            )}

            {/* True/False question */}
            {question.type === "truefalse" && (
              <div className="mt-3 flex gap-3">
                <button
                  onClick={() => updateAnswer(idx, { boolValue: true })}
                  disabled={isDisabled}
                  className={`flex-1 rounded-xl border px-4 py-2 text-sm font-medium transition ${
                    answer?.boolValue === true
                      ? "border-moss bg-moss text-paper"
                      : "border-ink/20 text-ink/70 hover:border-moss/40"
                  }`}
                >
                  ✓ Правда
                </button>
                <button
                  onClick={() => updateAnswer(idx, { boolValue: false })}
                  disabled={isDisabled}
                  className={`flex-1 rounded-xl border px-4 py-2 text-sm font-medium transition ${
                    answer?.boolValue === false
                      ? "border-terracotta bg-terracotta text-paper"
                      : "border-ink/20 text-ink/70 hover:border-terracotta/40"
                  }`}
                >
                  ✗ Неправда
                </button>
              </div>
            )}

            {/* Multiple choice question */}
            {question.type === "multiple" && question.options && (
              <div className="mt-3 space-y-2">
                {question.options.map((option, optIdx) => (
                  <button
                    key={optIdx}
                    onClick={() => updateAnswer(idx, { optionIndex: optIdx })}
                    disabled={isDisabled}
                    className={`w-full rounded-xl border px-4 py-2.5 text-left text-sm transition ${
                      answer?.optionIndex === optIdx
                        ? "border-moss bg-moss/10 text-moss font-medium"
                        : "border-ink/20 text-ink/70 hover:border-moss/30 hover:bg-moss/5"
                    }`}
                  >
                    <span className="mr-2 inline-block w-5 text-center font-semibold">
                      {String.fromCharCode(65 + optIdx)}.
                    </span>
                    {option[displayLang]}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Show generate button if no questions yet
  if (!questions) {
    return (
      <div className="rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft">
        <div className="flex items-center gap-2">
          <BookOpen size={24} weight="duotone" className="text-moss" />
          <h3 className="text-xl font-semibold">Перевірка розуміння</h3>
        </div>
        <p className="mt-2 text-sm text-ink/60">
          Згенеруйте питання до тексту і перевірте своє розуміння
        </p>

        <button
          onClick={handleGenerate}
          disabled={generating}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-moss px-6 py-3 text-sm font-semibold text-paper transition hover:bg-moss/90 disabled:opacity-50"
        >
          {generating ? (
            <>
              <Loader label="" />
              Генерую питання...
            </>
          ) : (
            <>
              <Lightning size={18} weight="fill" />
              Згенерувати питання (2 кредити)
            </>
          )}
        </button>

        {error && !showErrorModal && (
          <div className="mt-4 rounded-2xl border border-terracotta/20 bg-terracotta/5 p-4">
            <p className="text-sm font-medium text-terracotta">{error}</p>
            <button
              onClick={handleGenerate}
              className="mt-3 text-xs font-semibold text-terracotta underline hover:no-underline"
            >
              Спробувати ще раз
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error Feedback Modal */}
      <ErrorFeedbackModal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        error={error || "Невідома помилка"}
        context={retryAction === "generate" ? "Генерація питань" : "Перевірка розуміння"}
        onRetry={() => {
          setShowErrorModal(false);
          if (retryAction === "generate") {
            handleGenerate();
          } else if (retryAction === "check") {
            handleCheck();
          }
        }}
        errorDetails={errorDetails}
      />
      {/* Questions Form */}
      <div className="rounded-3xl border border-moss/20 bg-moss/5 p-6 shadow-soft">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen size={24} weight="duotone" className="text-moss" />
            <h3 className="text-xl font-semibold">Питання до тексту</h3>
          </div>
          <button
            onClick={handleReset}
            className="rounded-full px-3 py-1 text-xs font-medium text-ink/40 transition hover:bg-ink/5 hover:text-ink/60"
          >
            Скинути
          </button>
        </div>

        <div className="mt-6 space-y-4">
          {/* Multiple choice questions in 2 columns */}
          <div className="grid gap-4 md:grid-cols-2">
            {questions.questions
              .map((question, idx) => ({ question, idx }))
              .filter(({ question }) => question.type === "multiple")
              .map(({ question, idx }) => renderQuestion(question, idx))}
          </div>

          {/* Other question types */}
          <div className="space-y-4">
            {questions.questions
              .map((question, idx) => ({ question, idx }))
              .filter(({ question }) => question.type !== "multiple")
              .map(({ question, idx }) => renderQuestion(question, idx))}
          </div>
        </div>

        {!result && (
          <button
            onClick={handleCheck}
            disabled={checking || !allAnswered}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-semibold text-paper transition hover:bg-ink/90 disabled:opacity-50"
          >
            {checking ? (
              <>
                <Loader label="" />
                Перевіряю відповіді...
              </>
            ) : (
              <>
                <Lightning size={18} weight="fill" />
                Перевірити відповіді (2 кредити)
              </>
            )}
          </button>
        )}

        {error && !showErrorModal && (
          <div className="mt-4 rounded-2xl border border-terracotta/20 bg-terracotta/5 p-4">
            <p className="text-sm font-medium text-terracotta">{error}</p>
            <button
              onClick={handleCheck}
              className="mt-3 text-xs font-semibold text-terracotta underline hover:no-underline"
            >
              Спробувати ще раз
            </button>
          </div>
        )}
      </div>

      {/* Results Modal */}
      {result && showResultModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-gold/20 bg-paper p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <Sparkle size={32} weight="fill" className="text-gold" />
                <div>
                  <h3 className="text-2xl font-bold">
                    {Math.round(result.overall.pointsForRating)}/10 балів
                  </h3>
                  <p className="text-sm text-ink/60">{result.overall.feedback}</p>
                </div>
              </div>
              <button
                onClick={() => setShowResultModal(false)}
                className="rounded-full p-2 text-ink/40 transition hover:bg-ink/5 hover:text-ink/70"
              >
                <X size={24} />
              </button>
            </div>

            {/* Points Awarded */}
            {points !== null && (
              <div className="mt-4 rounded-2xl border border-gold/20 bg-gold/10 p-4">
                <p className="text-sm font-semibold text-gold">
                  ✨ Нараховано {points} балів!
                </p>
              </div>
            )}

            {/* Detailed Feedback */}
            <div className="mt-6 space-y-4">
              <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-ink/40">
                Детальний feedback
              </h4>
              {result.items.map((item, idx) => (
                <div
                  key={idx}
                  className={`rounded-2xl border p-4 ${
                    item.correct
                      ? "border-moss/20 bg-moss/5"
                      : "border-terracotta/20 bg-terracotta/5"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {item.correct ? (
                      <CheckCircle size={24} weight="fill" className="text-moss flex-shrink-0 mt-0.5" />
                    ) : (
                      <XCircle size={24} weight="fill" className="text-terracotta flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-medium text-ink/80">
                        Питання {item.questionIndex + 1}
                      </p>
                      <p className="mt-1 text-sm text-ink/60">
                        Ваша відповідь: <span className="font-medium">{item.userAnswer}</span>
                      </p>
                      {!item.correct && item.expectedAnswer && (
                        <p className="mt-1 text-sm text-ink/60">
                          Очікувана відповідь: <span className="font-medium">{item.expectedAnswer}</span>
                        </p>
                      )}
                      <p className="mt-2 text-sm text-ink/70">{item.feedback}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Suggested Vocabulary */}
            {result.suggestedVocab && result.suggestedVocab.length > 0 && (
              <div className="mt-6">
                <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-ink/40">
                  📚 Рекомендовані слова
                </h4>
                <div className="mt-4 space-y-3">
                  {result.suggestedVocab.map((word, idx) => (
                    <div
                      key={idx}
                      className="rounded-2xl border border-ink/10 bg-paper/60 p-4 text-sm"
                    >
                      <div className="flex items-baseline gap-2">
                        <span className="font-semibold text-ink">{word.lemma}</span>
                        <span className="text-ink/40">—</span>
                        <span className="text-ink/70">{word.meaning}</span>
                      </div>
                      <p className="mt-2 text-xs text-ink/50">{word.reason}</p>
                    </div>
                  ))}
                </div>
                <button
                  onClick={handleAddVocabulary}
                  disabled={addingVocab || vocabAdded}
                  className="mt-4 w-full rounded-full border border-ink/20 px-4 py-2 text-sm font-semibold text-ink transition hover:bg-ink/5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {addingVocab ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader label="" />
                      Додаю...
                    </span>
                  ) : vocabAdded ? (
                    "✓ Додано до словника"
                  ) : (
                    "Додати всі до словника"
                  )}
                </button>
                {vocabMessage && (
                  <p className={`mt-2 text-center text-xs ${vocabMessage.startsWith("✓") ? "text-moss" : "text-terracotta"}`}>
                    {vocabMessage}
                  </p>
                )}
              </div>
            )}

            {/* Auto-saved notification */}
            {sessionSaved && (
              <div className="mt-4 rounded-2xl border border-gold/20 bg-gold/10 p-3 text-center">
                <p className="text-sm font-semibold text-gold">
                  ✓ Результати автоматично збережено!
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="mt-4 space-y-3">
              <button
                onClick={async () => {
                  setShowResultModal(false);
                  reset();
                  await handleGenerate();
                }}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-moss px-4 py-3 text-sm font-semibold text-paper transition hover:bg-moss/90"
              >
                <Lightning size={18} weight="fill" />
                Згенерувати нові питання
              </button>
              <div className="flex gap-3">
                <button
                  onClick={handleReset}
                  className="flex-1 rounded-full border border-ink/20 px-4 py-2 text-sm font-semibold text-ink transition hover:bg-ink/5"
                >
                  Спробувати знову
                </button>
                <button
                  onClick={() => setShowResultModal(false)}
                  className="flex-1 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-paper transition hover:bg-ink/90"
                >
                  Закрити
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
