"use client";

import { useEffect } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { useTranslate, TranslateDirection } from "./useTranslate";
import { CheckCircle, XCircle, Sparkle, Plus } from "@phosphor-icons/react/dist/ssr";
import VocabSuggestions from "../../shared/VocabSuggestions";

interface TranslatePracticeProps {
  direction?: TranslateDirection;
  count?: number;
  prompt?: string;
  useVocab?: boolean;
  level?: "A1" | "A2" | "B1" | "B2";
}

export default function TranslatePractice({
  direction = "uk_to_pl",
  count = 6,
  prompt = "",
  useVocab = true,
  level = "A1"
}: TranslatePracticeProps) {
  const { t, locale } = useLocale();
  const {
    task,
    answers,
    result,
    loading,
    error,
    setDirection,
    setCount,
    setPrompt,
    setUseVocab,
    setLevel,
    generateTask,
    checkTask,
    updateAnswer,
    addVocabWord,
    addAllVocab,
    reset
  } = useTranslate();

  useEffect(() => {
    // Set config from props
    setDirection(direction);
    setCount(count);
    setPrompt(prompt);
    setUseVocab(useVocab);
    setLevel(level);

    // Auto-generate task
    generateTask(locale);
  }, [count, direction, generateTask, level, locale, prompt, setCount, setDirection, setLevel, setPrompt, setUseVocab, useVocab]);

  const handleCheck = async () => {
    await checkTask(locale);
  };

  const handleReset = () => {
    reset();
    generateTask(locale);
  };

  // Collect all suggested vocab
  const allSuggestedVocab: { pl: string; uk: string }[] = [];
  if (result) {
    result.items.forEach((item) => {
      if (item.suggestedVocab) {
        allSuggestedVocab.push(...item.suggestedVocab);
      }
    });
  }

  if (loading && !task) {
    return (
      <div className="flex h-64 items-center justify-center rounded-3xl border border-ink/10 bg-paper/80 shadow-soft">
        <div className="text-center">
          <Sparkle className="mx-auto mb-3 h-8 w-8 animate-pulse text-ink/40" weight="fill" />
          <p className="text-sm text-ink/60">{t.workbook.aiGenerating || "AI генерує завдання..."}</p>
        </div>
      </div>
    );
  }

  if (error && !task) {
    return (
      <div className="rounded-3xl border border-ink/10 bg-paper/80 p-8 text-center shadow-soft">
        <XCircle className="mx-auto mb-3 h-12 w-12 text-terracotta" weight="fill" />
        <p className="text-sm text-terracotta">{error}</p>
        <button
          onClick={() => generateTask(locale)}
          className="mt-4 rounded-full bg-ink px-4 py-2 text-xs font-semibold text-paper"
        >
          {t.common.retry || "Спробувати знову"}
        </button>
      </div>
    );
  }

  if (!task) {
    return null;
  }

  const directionLabel = task.direction === "uk_to_pl" ? "Українська → Польська" : "Польська → Українська";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold">{t.workbook.translateTitle || "Переклад"}</h2>
            <p className="mt-1 text-sm text-ink/60">
              {directionLabel} · {task.topic && `${task.topic} · `}{task.items.length} {t.workbook.sentences || "речень"}
            </p>
          </div>
          {result && (
            <div className="rounded-full border border-ink/10 bg-paper px-4 py-2 text-sm">
              {t.workbook.score}: {Math.round(result.score * 100)}%
            </div>
          )}
        </div>
      </div>

      {/* Translation Items */}
      <div className="space-y-4">
        {task.items.map((item, idx) => {
          const userAnswer = answers[item.id] || "";
          const itemResult = result?.items.find((r) => r.id === item.id);
          const isCorrect = itemResult?.correct;
          const feedback = itemResult?.feedback;

          return (
            <div key={item.id} className="rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="text-xs uppercase tracking-[0.3em] text-ink/40">
                    {t.workbook.translateItem || "Речення"} {idx + 1}
                  </p>
                  <p className="mt-2 text-lg font-medium text-ink">{item.source}</p>

                  {item.hints && (
                    <p className="mt-2 text-xs text-ink/50">
                      💡 {item.hints}
                    </p>
                  )}

                  {/* Answer Input */}
                  <textarea
                    value={userAnswer}
                    onChange={(e) => updateAnswer(item.id, e.target.value)}
                    disabled={!!result}
                    placeholder={t.workbook.translatePlaceholder || "Введіть переклад..."}
                    className={`mt-3 w-full rounded-2xl border px-4 py-3 text-sm transition ${
                      result
                        ? isCorrect
                          ? "border-moss/40 bg-moss/10"
                          : "border-terracotta/40 bg-terracotta/10"
                        : "border-ink/20 bg-paper"
                    }`}
                    rows={2}
                  />

                  {/* Feedback */}
                  {feedback && (
                    <div className={`mt-3 rounded-2xl border px-4 py-3 text-sm ${
                      isCorrect ? "border-moss/20 bg-moss/5 text-moss" : "border-terracotta/20 bg-terracotta/5 text-terracotta"
                    }`}>
                      {feedback}
                    </div>
                  )}
                </div>

                {/* Status Icon */}
                {result && (
                  <div>
                    {isCorrect ? (
                      <CheckCircle weight="fill" className="h-6 w-6 text-moss" />
                    ) : (
                      <XCircle weight="fill" className="h-6 w-6 text-terracotta" />
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Suggested Vocabulary */}
      {allSuggestedVocab.length > 0 && (
        <VocabSuggestions
          suggestions={allSuggestedVocab}
          onAdd={async (pl, uk) => {
            await addVocabWord({ pl, uk });
          }}
          onAddAll={addAllVocab}
          title={t.workbook.translateSuggestedTitle}
        />
      )}

      {/* Actions */}
      <div className="rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft">
        <div className="flex flex-wrap items-center gap-4">
          {!result ? (
            <button
              onClick={handleCheck}
              disabled={loading || Object.keys(answers).length === 0}
              className="rounded-full bg-ink px-6 py-2 text-sm font-semibold text-paper transition hover:bg-ink/90 disabled:opacity-50"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <Sparkle className="h-4 w-4 animate-pulse" weight="fill" />
                  {t.workbook.aiChecking || "AI перевіряє..."}
                </span>
              ) : (
                t.workbook.translateCheck || "Перевірити"
              )}
            </button>
          ) : (
            <>
              <button
                onClick={handleReset}
                className="rounded-full bg-ink px-6 py-2 text-sm font-semibold text-paper transition hover:bg-ink/90"
              >
                {t.workbook.translateNewTask}
              </button>

              {result.points !== undefined && (
                <span className="text-sm font-semibold text-moss">
                  +{result.points} {t.workbook.points}
                </span>
              )}
            </>
          )}

          {error && (
            <span className="text-sm text-terracotta">{error}</span>
          )}
        </div>
      </div>
    </div>
  );
}
