import { useState } from "react";
import { validateGeneratedContent } from "@/lib/difficulty";

export type TranslateDirection = "uk_to_pl" | "pl_to_uk";

export interface TranslateItem {
  id: string;
  source: string;
  hints?: string | null;
  targetVocab?: string[];
}

export interface TranslateTask {
  id: string;
  level: string;
  direction: TranslateDirection;
  topic: string;
  items: TranslateItem[];
}

export interface TranslateResult {
  items: {
    id: string;
    correct: boolean;
    feedback?: string;
    suggestedVocab?: { pl: string; uk: string }[];
  }[];
  score: number;
  points: number;
}

export function useTranslate() {
  const [direction, setDirection] = useState<TranslateDirection>("uk_to_pl");
  const [count, setCount] = useState(6);
  const [prompt, setPrompt] = useState("");
  const [useVocab, setUseVocab] = useState(true);
  const [level, setLevel] = useState<"A1" | "A2" | "B1" | "B2">("A1");
  const [task, setTask] = useState<TranslateTask | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<TranslateResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Vocab saving state
  const [vocabStatus, setVocabStatus] = useState<Record<string, "idle" | "saving" | "done" | "error">>({});
  const [bulkLoading, setBulkLoading] = useState(false);

  async function generateTask(locale: string = "pl"): Promise<boolean> {
    setLoading(true);
    setError(null);

    try {
      // Get vocab pool if enabled
      let vocabPool: { id: string; lemma: string }[] = [];
      if (useVocab) {
        const res = await fetch("/api/words/random?count=20");
        const data = await res.json().catch(() => ({}));
        vocabPool = Array.isArray(data.items)
          ? data.items.map((item: any) => ({ id: String(item.id || item._id || item.pl), lemma: String(item.pl) }))
          : [];
      }

      const payload = {
        exerciseType: "translate_sentences",
        action: "generate",
        level,
        direction,
        prompt,
        count: Math.max(3, Math.min(20, count)),
        vocabPool
      };

      const res = await fetch("/api/ai/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "translate_generate",
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
          // Validate content quality
          const validation = validateGeneratedContent({
            content: parsed.task,
            level: level as any,
            exerciseType: "translation"
          });

          // Log validation results
          console.log("📊 Translation content validation:", {
            valid: validation.valid,
            score: validation.score,
            metrics: validation.metrics
          });

          if (validation.errors.length > 0) {
            console.warn("⚠️ Content quality issues:", validation.errors);
          }

          // If quality is too low, reject and retry
          if (!validation.valid || validation.score < 0.6) {
            console.error("❌ Translation quality too low, rejecting...");

            // Log to backend for monitoring
            fetch("/api/admin/content-quality-log", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                type: "translate_generate",
                level,
                direction,
                prompt,
                validation: {
                  valid: validation.valid,
                  score: validation.score,
                  errors: validation.errors.map(e => e.message)
                },
                metrics: validation.metrics
              })
            }).catch(() => null);

            setError(`Якість згенерованого завдання недостатня (score: ${(validation.score * 100).toFixed(0)}%). Спробуйте ще раз.`);
            return false;
          }

          setTask(parsed.task);
          setAnswers({});
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
    } catch (err) {
      setError("Network error");
      return false;
    } finally {
      setLoading(false);
    }
  }

  async function checkTask(locale: string = "pl"): Promise<boolean> {
    if (!task) return false;

    setLoading(true);
    setError(null);

    try {
      const items = task.items.map((item) => ({
        id: item.id,
        source: item.source,
        user: answers[item.id] || ""
      }));

      const payload = {
        exerciseType: "translate_sentences",
        action: "check",
        taskId: task.id,
        level: task.level,
        direction: task.direction,
        items
      };

      const res = await fetch("/api/ai/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "translate_check",
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
        if (parsed?.result) {
          setResult(parsed.result);

          // Save attempt
          if (parsed.result.score !== undefined) {
            await fetch("/api/exercises/attempt", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                type: "translate",
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
    } catch (err) {
      setError("Network error");
      return false;
    } finally {
      setLoading(false);
    }
  }

  function updateAnswer(itemId: string, value: string) {
    setAnswers((prev) => ({ ...prev, [itemId]: value }));
  }

  async function addVocabWord(word: { pl: string; uk: string }): Promise<boolean> {
    setVocabStatus((prev) => ({ ...prev, [word.pl]: "saving" }));

    try {
      const res = await fetch("/api/words", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pl: word.pl,
          uk: word.uk,
          type: "phrase"
        })
      });

      if (res.ok) {
        setVocabStatus((prev) => ({ ...prev, [word.pl]: "done" }));
        return true;
      } else {
        setVocabStatus((prev) => ({ ...prev, [word.pl]: "error" }));
        return false;
      }
    } catch {
      setVocabStatus((prev) => ({ ...prev, [word.pl]: "error" }));
      return false;
    }
  }

  async function addAllVocab() {
    if (!result) return;

    setBulkLoading(true);

    const allWords: { pl: string; uk: string }[] = [];
    result.items.forEach((item) => {
      if (item.suggestedVocab) {
        allWords.push(...item.suggestedVocab);
      }
    });

    await Promise.all(allWords.map((word) => addVocabWord(word)));

    setBulkLoading(false);
  }

  function reset() {
    setTask(null);
    setAnswers({});
    setResult(null);
    setError(null);
    setVocabStatus({});
  }

  return {
    // State
    direction,
    count,
    prompt,
    useVocab,
    level,
    task,
    answers,
    result,
    loading,
    error,
    vocabStatus,
    bulkLoading,

    // Actions
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
  };
}
