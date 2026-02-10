"use client";

import { useEffect } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { useParaphrase } from "./useParaphrase";
import { CheckCircle, XCircle, Sparkle } from "@phosphor-icons/react/dist/ssr";

interface ParaphrasePracticeProps {
  mode?: "static" | "ai";
  topic?: string;
  targetWord?: string;
  count?: number;
}

export default function ParaphrasePractice({
  mode = "ai",
  topic = "",
  targetWord = "",
  count = 3
}: ParaphrasePracticeProps) {
  const { t, locale } = useLocale();
  const {
    task,
    answer,
    result,
    loading,
    error,
    setAnswer,
    setMode,
    generateTask,
    checkParaphrase,
    reset
  } = useParaphrase();

  useEffect(() => {
    setMode(mode);
    if (mode === "ai") {
      generateTask(topic, targetWord, count, locale);
    }
  }, [count, generateTask, locale, mode, setMode, targetWord, topic]);

  const handleCheck = async () => {
    await checkParaphrase(locale);
  };

  const handleReset = () => {
    reset();
    generateTask(topic, targetWord, count, locale);
  };

  if (loading && !task) {
    return (
      <div className="flex h-64 items-center justify-center rounded-3xl border border-ink/10 bg-paper/80 shadow-soft">
        <div className="text-center">
          <Sparkle className="mx-auto mb-3 h-8 w-8 animate-pulse text-ink/40" weight="fill" />
          <p className="text-sm text-ink/60">{t.workbook.aiGenerating || "AI генерує..."}</p>
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
          onClick={() => generateTask(topic, targetWord, count, locale)}
          className="mt-4 rounded-full bg-ink px-4 py-2 text-xs font-semibold text-paper"
        >
          {t.common.retry}
        </button>
      </div>
    );
  }

  if (!task) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft">
        <h2 className="text-2xl font-semibold">{t.workbook.paraphraseTitle}</h2>
        <p className="mt-1 text-sm text-ink/60">
          {t.workbook.paraphraseHint}
        </p>
      </div>

      {/* Task */}
      <div className="rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft">
        <p className="text-xs uppercase tracking-[0.3em] text-ink/40">
          {t.workbook.paraphraseOriginal}
        </p>
        <p className="mt-3 text-lg font-medium text-ink">{task.original}</p>

        {/* Constraints */}
        {task.constraints && (
          <div className="mt-4 flex flex-wrap gap-2">
            {task.constraints.minLength && (
              <span className="rounded-full border border-ink/10 bg-paper px-3 py-1 text-xs text-ink/50">
                Min {task.constraints.minLength} слів
              </span>
            )}
            {task.constraints.maxLength && (
              <span className="rounded-full border border-ink/10 bg-paper px-3 py-1 text-xs text-ink/50">
                Max {task.constraints.maxLength} слів
              </span>
            )}
            {task.constraints.forbiddenWords && task.constraints.forbiddenWords.length > 0 && (
              <span className="rounded-full border border-ink/10 bg-paper px-3 py-1 text-xs text-ink/50">
                Заборонені: {task.constraints.forbiddenWords.join(", ")}
              </span>
            )}
          </div>
        )}

        {/* Answer Input */}
        <div className="mt-6">
          <p className="text-xs uppercase tracking-[0.3em] text-ink/40">
            {t.workbook.paraphraseYourVersion}
          </p>
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            disabled={!!result}
            placeholder={t.workbook.paraphrasePlaceholder}
            className={`mt-2 w-full rounded-2xl border px-4 py-3 text-sm transition ${
              result
                ? result.valid
                  ? "border-moss/40 bg-moss/10"
                  : "border-terracotta/40 bg-terracotta/10"
                : "border-ink/20 bg-paper"
            }`}
            rows={3}
          />
        </div>

        {/* Feedback */}
        {result && (
          <div className={`mt-4 rounded-2xl border px-4 py-3 ${
            result.valid
              ? "border-moss/20 bg-moss/5 text-moss"
              : "border-terracotta/20 bg-terracotta/5 text-terracotta"
          }`}>
            <div className="flex items-start gap-2">
              {result.valid ? (
                <CheckCircle weight="fill" className="mt-0.5 h-5 w-5 flex-shrink-0" />
              ) : (
                <XCircle weight="fill" className="mt-0.5 h-5 w-5 flex-shrink-0" />
              )}
              <p className="text-sm">{result.feedback}</p>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft">
        <div className="flex flex-wrap items-center gap-4">
          {!result ? (
            <button
              onClick={handleCheck}
              disabled={loading || !answer.trim()}
              className="rounded-full bg-ink px-6 py-2 text-sm font-semibold text-paper transition hover:bg-ink/90 disabled:opacity-50"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <Sparkle className="h-4 w-4 animate-pulse" weight="fill" />
                  {t.workbook.aiChecking}
                </span>
              ) : (
                t.workbook.paraphraseCheck
              )}
            </button>
          ) : (
            <button
              onClick={handleReset}
              className="rounded-full bg-ink px-6 py-2 text-sm font-semibold text-paper transition hover:bg-ink/90"
            >
              {t.workbook.paraphraseNewTask}
            </button>
          )}

          {error && <span className="text-sm text-terracotta">{error}</span>}
        </div>
      </div>
    </div>
  );
}
