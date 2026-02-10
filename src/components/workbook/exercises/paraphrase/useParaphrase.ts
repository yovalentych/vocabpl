import { useState } from "react";

export interface ParaphraseTask {
  id: string;
  original: string;
  constraints?: {
    minLength?: number;
    maxLength?: number;
    forbiddenWords?: string[];
  };
}

export interface ParaphraseResult {
  valid: boolean;
  feedback: string;
  suggestedVocab?: { pl: string; uk: string }[];
  score: number;
}

export function useParaphrase() {
  const [mode, setMode] = useState<"static" | "ai">("ai");
  const [task, setTask] = useState<ParaphraseTask | null>(null);
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState<ParaphraseResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focusMode, setFocusMode] = useState(false);

  async function generateTask(
    topic: string = "",
    targetWord: string = "",
    count: number = 3,
    locale: string = "pl"
  ): Promise<boolean> {
    setLoading(true);
    setError(null);

    try {
      const payload = {
        exerciseType: "paraphrase",
        action: "generate",
        topic,
        targetWord: targetWord || undefined,
        count: Math.max(2, Math.min(6, count))
      };

      const res = await fetch("/api/ai/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "paraphrase_generate",
          userInput: JSON.stringify(payload),
          context: JSON.stringify({ uiLanguage: locale })
        })
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const errorCode = data?.code;
        const message =
          errorCode === "ai_quota"
            ? "AI quota exceeded"
            : errorCode === "pvs_unavailable"
              ? "AI plan required"
              : data?.error || "AI error";
        setError(message);
        return false;
      }

      try {
        const parsed = JSON.parse(String(data?.text || ""));
        if (parsed?.task) {
          setTask(parsed.task);
          setAnswer("");
          setResult(null);
          return true;
        } else {
          setError("Failed to parse AI response");
          return false;
        }
      } catch {
        setError("Failed to parse AI response");
        return false;
      }
    } catch {
      setError("Network error");
      return false;
    } finally {
      setLoading(false);
    }
  }

  async function checkParaphrase(locale: string = "pl"): Promise<boolean> {
    if (!task || !answer.trim()) return false;

    setLoading(true);
    setError(null);

    try {
      const payload = {
        original: task.original,
        paraphrase: answer,
        constraints: task.constraints
      };

      const res = await fetch("/api/ai/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "paraphrase_check",
          userInput: JSON.stringify(payload),
          context: JSON.stringify({ uiLanguage: locale })
        })
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data?.error || "AI error");
        return false;
      }

      try {
        const parsed = JSON.parse(String(data?.text || ""));
        if (parsed?.result) {
          setResult(parsed.result);

          // Save attempt
          if (parsed.result.score !== undefined) {
            await fetch("/api/exercises/attempt", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                type: "paraphrase",
                materialId: task.id,
                score: parsed.result.score
              })
            });
          }

          return true;
        } else {
          setError("Failed to parse AI response");
          return false;
        }
      } catch {
        setError("Failed to parse AI response");
        return false;
      }
    } catch {
      setError("Network error");
      return false;
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setTask(null);
    setAnswer("");
    setResult(null);
    setError(null);
  }

  return {
    // State
    mode,
    task,
    answer,
    result,
    loading,
    error,
    focusMode,

    // Actions
    setMode,
    setAnswer,
    setFocusMode,
    generateTask,
    checkParaphrase,
    reset
  };
}
