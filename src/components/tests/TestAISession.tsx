"use client";

import { useState } from "react";
import { CheckCircle, XCircle, Lightning, ArrowClockwise, Plus, X } from "@phosphor-icons/react";
import type { TestQuestion, GeneratedTest } from "./TestAIGenerator";
import Loader from "@/components/ui/Loader";
import ErrorFeedbackModal from "@/components/ui/ErrorFeedbackModal";
import { safeJSONParse } from "@/lib/json-utils";
import { useLocale } from "@/components/LocaleProvider";

interface TestAISessionProps {
  test: GeneratedTest;
  onContinue?: (additionalQuestions: TestQuestion[]) => void;
  onNewTest?: () => void;
  locale?: string;
}

interface UserAnswer {
  questionId: string;
  value: string | string[];
}

interface CheckResult {
  overall: {
    score01: number;
    pointsForRating: number;
    feedback: string;
  };
  items: Array<{
    questionIndex: number;
    questionId: string;
    correct: boolean;
    userAnswer: string;
    expectedAnswer: string;
    feedback: string;
    partialCredit?: number;
  }>;
  suggestedVocab: Array<{
    lemma: string;
    meaning: string;
    reason: string;
  }>;
}

export default function TestAISession({
  test,
  onContinue,
  onNewTest,
  locale = "uk"
}: TestAISessionProps) {
  const { t } = useLocale();
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<CheckResult | null>(null);
  const [error, setError] = useState("");
  const [showResultModal, setShowResultModal] = useState(false);
  const [continuing, setContinuing] = useState(false);
  const [sessionSaved, setSessionSaved] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorDetails, setErrorDetails] = useState<any>(null);
  const [retryAction, setRetryAction] = useState<"check" | "continue" | null>(null);
  const [addedWords, setAddedWords] = useState<Set<string>>(new Set());
  const [addingWord, setAddingWord] = useState<string | null>(null);
  const [appealItem, setAppealItem] = useState<CheckResult["items"][number] | null>(null);
  const [appealNote, setAppealNote] = useState("");
  const [appealSending, setAppealSending] = useState(false);
  const [appealSentFor, setAppealSentFor] = useState<Set<string>>(new Set());

  const displayLang = locale === "uk" ? "uk" : "pl";

  function updateAnswer(questionId: string, value: string | string[]) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }

  function toggleMultipleChoice(questionId: string, optionId: string) {
    setAnswers((prev) => {
      const current = Array.isArray(prev[questionId]) ? prev[questionId] as string[] : [];
      const next = current.includes(optionId)
        ? current.filter((id) => id !== optionId)
        : [...current, optionId];
      return { ...prev, [questionId]: next };
    });
  }

  async function addWordToVocabulary(lemma: string, meaning: string) {
    setAddingWord(lemma);
    try {
      const res = await fetch("/api/user/words/custom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pl: lemma, uk: meaning })
      });

      if (res.ok) {
        setAddedWords((prev) => new Set(prev).add(lemma));
      }
    } catch (err) {
      console.error("Failed to add word:", err);
    } finally {
      setAddingWord(null);
    }
  }

  async function addAllWords() {
    if (!result?.suggestedVocab) return;

    for (const word of result.suggestedVocab) {
      if (!addedWords.has(word.lemma)) {
        await addWordToVocabulary(word.lemma, word.meaning);
      }
    }
  }

  const allAnswered = test.questions.every((q) => {
    const answer = answers[q.id];
    if (q.type === "multiple") {
      return Array.isArray(answer) && answer.length > 0;
    }
    return answer !== undefined && answer !== "";
  });

  async function handleCheck() {
    setChecking(true);
    setError("");

    try {
      const payload = {
        mode: "test_check",
        userInput: JSON.stringify({
          questions: test.questions,
          answers
        }),
        context: JSON.stringify({ uiLanguage: locale })
      };

      const res = await fetch("/api/ai/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Помилка перевірки");
      }

      const data = await res.json();

      const parseResult = safeJSONParse(data.text);
      if (!parseResult.success) {
        throw new Error(`Невірний формат JSON: ${parseResult.error}`);
      }

      setResult(parseResult.data);
      setShowResultModal(true);

      // Auto-save session
      await saveSession(parseResult.data);
    } catch (err) {
      console.error("Check test error:", err);
      const errorMessage = err instanceof Error ? err.message : "Помилка перевірки";
      setError(errorMessage);
      setErrorDetails({
        endpoint: "/api/ai/run",
        payload: { mode: "test_check", questions: test.questions, answers },
        response: err instanceof Error ? err.stack : String(err)
      });
      setRetryAction("check");
      setShowErrorModal(true);
    } finally {
      setChecking(false);
    }
  }

  async function saveSession(checkResult: CheckResult) {
    try {
      const payload = {
        testTopic: test.topic,
        testFocus: test.focus,
        testGrammarTopics: test.grammarTopics,
        testLevel: test.level,
        questions: test.questions,
        answers,
        result: checkResult,
        createdAt: new Date().toISOString()
      };

      const res = await fetch("/api/tests/ai-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setSessionSaved(true);
      }
    } catch (err) {
      console.error("Save session error:", err);
    }
  }

  async function handleContinue() {
    if (!onContinue) return;

    setContinuing(true);
    setError("");

    try {
      const payload = {
        mode: "test_generate",
        userInput: JSON.stringify({
          topic: test.topic,
          focus: test.focus,
          grammarTopics: test.grammarTopics,
          questionCount: 6, // Always generate 6 questions for continuation
          questionTypes: ["single", "multiple", "fillgap", "open"],
          level: test.level
        }),
        context: JSON.stringify({ uiLanguage: locale, level: test.level })
      };

      const res = await fetch("/api/ai/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error("Помилка генерації додаткових питань");
      }

      const data = await res.json();

      const parseResult = safeJSONParse(data.text);
      if (!parseResult.success || !parseResult.data?.questions) {
        throw new Error(`Невірний формат JSON: ${parseResult.error || "відсутні питання"}`);
      }

      onContinue(parseResult.data.questions);

      // If called from result modal, close it and reset
      if (showResultModal) {
        setShowResultModal(false);
        setResult(null);
        setAnswers({});
      }
      // If called before checking, just add questions (answers remain)
    } catch (err) {
      console.error("Continue test error:", err);
      const errorMessage = err instanceof Error ? err.message : "Помилка продовження тесту";
      setError(errorMessage);
      setErrorDetails({
        endpoint: "/api/ai/run",
        payload: { mode: "test_generate", topic: test.topic, focus: test.focus },
        response: err instanceof Error ? err.stack : String(err)
      });
      setRetryAction("continue");
      setShowErrorModal(true);
    } finally {
      setContinuing(false);
    }
  }

  async function submitAppeal() {
    if (!appealItem || !result) return;

    const question = test.questions.find((q) => q.id === appealItem.questionId);
    const message = [
      "AI Test Appeal",
      `Topic: ${test.topic}`,
      `Level: ${test.level}`,
      `Question ID: ${appealItem.questionId}`,
      `Question: ${question?.question?.pl || ""}`,
      `User answer: ${appealItem.userAnswer}`,
      `Expected: ${appealItem.expectedAnswer}`,
      `AI feedback: ${appealItem.feedback}`,
      appealNote ? `User note: ${appealNote}` : ""
    ]
      .filter(Boolean)
      .join("\n");

    setAppealSending(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: "AI Test Appeal",
          message
        })
      });

      if (res.ok) {
        setAppealSentFor((prev) => new Set(prev).add(appealItem.questionId));
        setAppealItem(null);
        setAppealNote("");
      }
    } catch (err) {
      console.error("Appeal send error:", err);
    } finally {
      setAppealSending(false);
    }
  }

  function renderQuestion(question: TestQuestion, idx: number) {
    const answer = answers[question.id];
    const isDisabled = checking || !!result;

    return (
      <div key={question.id} className="rounded-2xl border border-ink/10 bg-paper/60 p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-gold/10 text-sm font-semibold text-gold">
            {idx + 1}
          </span>
          <div className="flex-1">
            {question.question && (
              <p className="text-sm font-medium text-ink/90">
                {question.question[displayLang]}
              </p>
            )}

            {/* Single Choice */}
            {question.type === "single" && question.options && (
              <div className="mt-3 space-y-2">
                {question.options.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => updateAnswer(question.id, option.id)}
                    disabled={isDisabled}
                    className={`w-full rounded-xl border px-4 py-2.5 text-left text-sm transition ${
                      answer === option.id
                        ? "border-gold bg-gold/10 text-gold font-medium"
                        : "border-ink/20 text-ink/70 hover:border-gold/30 hover:bg-gold/5"
                    }`}
                  >
                    {option.pl}
                  </button>
                ))}
              </div>
            )}

            {/* Multiple Choice */}
            {question.type === "multiple" && question.options && (
              <div className="mt-3 space-y-2">
                {question.options.map((option) => {
                  const isSelected = Array.isArray(answer) && answer.includes(option.id);
                  return (
                    <button
                      key={option.id}
                      onClick={() => toggleMultipleChoice(question.id, option.id)}
                      disabled={isDisabled}
                      className={`flex w-full items-center gap-3 rounded-xl border px-4 py-2.5 text-left text-sm transition ${
                        isSelected
                          ? "border-gold bg-gold/10 text-gold font-medium"
                          : "border-ink/20 text-ink/70 hover:border-gold/30 hover:bg-gold/5"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="accent-gold"
                      />
                      {option.pl}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Fill Gap */}
            {question.type === "fillgap" && question.gapSentence && (
              <div className="mt-3">
                <p className="text-sm text-ink/60 mb-2">{question.gapSentence.pl}</p>
                {displayLang === "uk" && question.gapSentence.uk && (
                  <p className="text-xs text-ink/40 mb-2">({question.gapSentence.uk})</p>
                )}
                <input
                  type="text"
                  value={answer as string || ""}
                  onChange={(e) => updateAnswer(question.id, e.target.value)}
                  placeholder="Введіть відповідь польською..."
                  disabled={isDisabled}
                  className="w-full rounded-xl border border-ink/20 bg-paper px-3 py-2 text-sm focus:border-gold/40 focus:outline-none"
                />
              </div>
            )}

            {/* Open Answer */}
            {question.type === "open" && (
              <textarea
                value={answer as string || ""}
                onChange={(e) => updateAnswer(question.id, e.target.value)}
                placeholder={t.reading.yourAnswerPlaceholder}
                rows={3}
                disabled={isDisabled}
                className="mt-3 w-full rounded-xl border border-ink/20 bg-paper px-3 py-2 text-sm resize-none focus:border-gold/40 focus:outline-none"
              />
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Test Info */}
      <div className="rounded-3xl border border-gold/20 bg-gold/5 p-6 shadow-soft">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-xl font-semibold text-ink">{test.topic}</h3>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-ink/10 bg-paper px-3 py-1 text-xs font-semibold text-ink/60">
                {test.level}
              </span>
              {test.focus.map((f) => (
                <span key={f} className="rounded-full border border-gold/20 bg-gold/10 px-3 py-1 text-xs font-semibold text-gold">
                  {f === "grammar" ? "Граматика" : f === "vocabulary" ? "Лексика" : f === "orthography" ? "Ортографія" : "Словотвір"}
                </span>
              ))}
            </div>
          </div>
          <p className="text-2xl font-bold text-gold">{test.questions.length}</p>
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-4">
        {test.questions.map((question, idx) => renderQuestion(question, idx))}
      </div>

      {/* Action Buttons */}
      {!result && (
        <div className="sticky bottom-6 flex flex-col items-center gap-3">
          {/* Continue Button (add more questions) */}
          <button
            onClick={handleContinue}
            disabled={continuing || checking}
            className="flex items-center gap-2 rounded-full border-2 border-gold bg-paper px-6 py-2.5 text-sm font-semibold text-gold shadow-md transition hover:bg-gold/5 disabled:opacity-50"
          >
            {continuing ? (
              <>
                <Loader label="" />
                {t.common.generating}
              </>
            ) : (
              <>
                <Plus size={18} weight="bold" />
                {t.tests.generateMore}
              </>
            )}
          </button>

          {/* Check Button */}
          <button
            onClick={handleCheck}
            disabled={checking || !allAnswered || continuing}
            className="flex items-center gap-2 rounded-full bg-ink px-8 py-3 text-sm font-semibold text-paper shadow-lg transition hover:bg-ink/90 disabled:opacity-50"
          >
            {checking ? (
              <>
                <Loader label="" />
                {t.common.checking}
              </>
            ) : (
              <>
                <Lightning size={18} weight="fill" />
                {t.tests.checkAnswers}
              </>
            )}
          </button>

          {!allAnswered && (
            <p className="text-xs text-ink/50">
              {t.common.answerAllToCheck}
            </p>
          )}
        </div>
      )}

      {error && !showErrorModal && (
        <div className="rounded-2xl border border-terracotta/20 bg-terracotta/5 p-4">
          <p className="text-sm font-medium text-terracotta">{error}</p>
        </div>
      )}

      {/* Error Feedback Modal */}
      <ErrorFeedbackModal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        error={error}
        context={retryAction === "check" ? "Перевірка AI тесту" : "Продовження AI тесту"}
        onRetry={() => {
          setShowErrorModal(false);
          if (retryAction === "check") {
            handleCheck();
          } else if (retryAction === "continue") {
            handleContinue();
          }
        }}
        errorDetails={errorDetails}
      />

      {/* Result Modal */}
      {result && showResultModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-gold/20 bg-paper p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-2xl font-bold">
                  {Math.round(result.overall.pointsForRating)}/10 {t.common.points}
                </h3>
                <p className="mt-1 text-sm text-ink/60">{result.overall.feedback}</p>
              </div>
              <button
                onClick={() => setShowResultModal(false)}
                className="rounded-full p-2 text-ink/40 transition hover:bg-ink/5"
              >
                <X size={24} />
              </button>
            </div>

            {sessionSaved && (
              <div className="mt-4 rounded-2xl border border-gold/20 bg-gold/10 p-3 text-center">
                <p className="text-sm font-semibold text-gold">{"✓ " + t.common.autoSaved}</p>
              </div>
            )}

            {/* Detailed Results */}
            <div className="mt-6 space-y-3">
              <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-ink/40">
                {t.common.detailedResults}
              </h4>
              {result.items.map((item) => (
                <div
                  key={item.questionId}
                  className={`rounded-2xl border p-4 ${
                    item.correct
                      ? "border-moss/20 bg-moss/5"
                      : "border-terracotta/20 bg-terracotta/5"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {item.correct ? (
                      <CheckCircle size={24} weight="fill" className="text-moss flex-shrink-0" />
                    ) : (
                      <XCircle size={24} weight="fill" className="text-terracotta flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-medium">{t.common.question} {item.questionIndex + 1}</p>
                      <p className="mt-1 text-sm text-ink/60">{t.common.yourAnswer}: {item.userAnswer}</p>
                      {!item.correct && (
                        <p className="mt-1 text-sm text-ink/60">{t.tests.correctAnswer}: {item.expectedAnswer}</p>
                      )}
                      <p className="mt-2 text-sm text-ink/70">{item.feedback}</p>
                      {!item.correct && (
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <button
                            onClick={() => setAppealItem(item)}
                            disabled={appealSentFor.has(item.questionId)}
                            className="rounded-full border border-ink/20 px-3 py-1 text-xs font-semibold text-ink/70 transition hover:bg-ink/5 disabled:opacity-50"
                          >
                            {appealSentFor.has(item.questionId) ? t.tests.appealed + " ✓" : t.tests.appeal}
                          </button>
                          <span className="text-[11px] text-ink/40">
                            {t.tests.appealHint}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Suggested Vocabulary */}
            {result.suggestedVocab && result.suggestedVocab.length > 0 && (
              <div className="mt-6">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-ink/40">
                    {t.common.suggestedWords}
                  </h4>
                  <button
                    onClick={addAllWords}
                    disabled={addingWord !== null || result.suggestedVocab.every(w => addedWords.has(w.lemma))}
                    className="text-xs font-semibold text-moss transition hover:text-moss/80 disabled:text-ink/30"
                  >
                    {result.suggestedVocab.every(w => addedWords.has(w.lemma)) ? "✓ " + t.common.allAdded : t.common.addAll}
                  </button>
                </div>
                <div className="mt-3 space-y-2">
                  {result.suggestedVocab.map((word, idx) => {
                    const isAdded = addedWords.has(word.lemma);
                    const isAdding = addingWord === word.lemma;

                    return (
                      <div
                        key={idx}
                        className="flex items-start gap-3 rounded-2xl border border-ink/10 bg-paper/60 p-3"
                      >
                        <div className="flex-1">
                          <div className="flex items-baseline gap-2">
                            <span className="text-sm font-semibold">{word.lemma}</span>
                            <span className="text-ink/40">—</span>
                            <span className="text-sm text-ink/70">{word.meaning}</span>
                          </div>
                          <p className="mt-1 text-xs text-ink/50">{word.reason}</p>
                        </div>
                        <button
                          onClick={() => addWordToVocabulary(word.lemma, word.meaning)}
                          disabled={isAdded || isAdding}
                          className="flex-shrink-0 rounded-full bg-moss/10 px-3 py-1 text-xs font-semibold text-moss transition hover:bg-moss/20 disabled:bg-ink/5 disabled:text-ink/30"
                        >
                          {isAdding ? "..." : isAdded ? "✓" : t.common.add}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="mt-6 space-y-3">
              <button
                onClick={handleContinue}
                disabled={continuing}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-gold px-4 py-3 text-sm font-semibold text-paper transition hover:bg-gold/90 disabled:opacity-50"
              >
                {continuing ? (
                  <>
                    <Loader label="" />
                    {t.common.generating}
                  </>
                ) : (
                  <>
                    <Plus size={18} weight="bold" />
                    {t.tests.generateMore}
                  </>
                )}
              </button>

              <div className="flex gap-3">
                <button
                  onClick={onNewTest}
                  className="flex-1 rounded-full border border-ink/20 px-4 py-2 text-sm font-semibold text-ink transition hover:bg-ink/5"
                >
                  <span className="flex items-center justify-center gap-2">
                    <ArrowClockwise size={18} />
                    {t.tests.finishTest}
                  </span>
                </button>
                <button
                  onClick={() => setShowResultModal(false)}
                  className="flex-1 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-paper transition hover:bg-ink/90"
                >
                  {t.common.close}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {appealItem && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/60 p-4">
          <div className="w-full max-w-lg rounded-3xl border border-ink/10 bg-paper p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="text-lg font-semibold">Оскарження відповіді</h4>
                <p className="mt-1 text-sm text-ink/60">
                  Опиши, чому відповідь має бути зарахована.
                </p>
              </div>
              <button
                onClick={() => {
                  setAppealItem(null);
                  setAppealNote("");
                }}
                className="rounded-full p-2 text-ink/40 transition hover:bg-ink/5"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mt-4 rounded-2xl border border-ink/10 bg-paper/70 p-3 text-sm text-ink/70">
              <p>
                <span className="font-semibold">{t.common.yourAnswer}:</span> {appealItem.userAnswer}
              </p>
              <p className="mt-1">
                <span className="font-semibold">{t.tests.correctAnswer}:</span> {appealItem.expectedAnswer}
              </p>
            </div>

            <textarea
              value={appealNote}
              onChange={(e) => setAppealNote(e.target.value)}
              placeholder="Коротко поясни, чому твоя відповідь правильна..."
              rows={4}
              className="mt-4 w-full rounded-2xl border border-ink/20 bg-paper px-3 py-2 text-sm focus:border-gold/40 focus:outline-none"
            />

            <div className="mt-4 flex gap-3">
              <button
                onClick={() => {
                  setAppealItem(null);
                  setAppealNote("");
                }}
                className="flex-1 rounded-full border border-ink/20 px-4 py-2 text-sm font-semibold text-ink"
              >
                Скасувати
              </button>
              <button
                onClick={submitAppeal}
                disabled={appealSending || !appealNote.trim()}
                className="flex-1 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-paper disabled:opacity-50"
              >
                {appealSending ? "Надсилаю..." : "Надіслати"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
