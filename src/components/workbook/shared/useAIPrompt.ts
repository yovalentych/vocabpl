import { useCallback } from "react";
import { useWorkbookContext } from "../WorkbookContext";
import { ExerciseType } from "../types";

export function useAIPrompt() {
  const { state, dispatch } = useWorkbookContext();

  const generatePrompt = useCallback(
    async (exercise: ExerciseType, topic: string, locale: string = "pl"): Promise<boolean> => {
      dispatch({ type: "SET_AI_MESSAGE", message: null });
      dispatch({ type: "SET_AI_STATUS", exercise, status: "loading" });

      const mode =
        exercise === "dialogue"
          ? "workbook_dialogue_prompt"
          : exercise === "describe"
            ? "workbook_describe_prompt"
            : "workbook_sentence_prompt";

      try {
        const res = await fetch("/api/ai/run", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode,
            userInput: topic,
            context: JSON.stringify({ uiLanguage: locale }),
            provider: "pvs"
          })
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          dispatch({ type: "SET_AI_STATUS", exercise, status: "error" });
          const errorCode = data?.code;
          const message =
            errorCode === "ai_quota"
              ? "AI quota exceeded"
              : errorCode === "pvs_unavailable"
                ? "AI plan required"
                : data?.error || "AI error";
          dispatch({ type: "SET_AI_MESSAGE", message });
          return false;
        }

        const text = String(data?.text || "");
        let prompt: { title?: string; prompt: string } | null = null;

        try {
          const parsed = JSON.parse(text);
          if (parsed?.prompt) {
            prompt = { title: parsed?.title, prompt: String(parsed.prompt) };
          }
        } catch {
          prompt = { prompt: text };
        }

        if (prompt) {
          dispatch({ type: "SET_AI_PROMPT", exercise, prompt });
        }

        dispatch({ type: "SET_AI_STATUS", exercise, status: "idle" });
        return true;
      } catch (error) {
        dispatch({ type: "SET_AI_STATUS", exercise, status: "error" });
        dispatch({ type: "SET_AI_MESSAGE", message: "Network error" });
        return false;
      }
    },
    [dispatch]
  );

  const setTopic = useCallback(
    (exercise: ExerciseType, topic: string) => {
      dispatch({ type: "SET_AI_TOPIC", exercise, topic });
    },
    [dispatch]
  );

  const toggleAI = useCallback(
    (exercise: ExerciseType) => {
      dispatch({ type: "TOGGLE_AI", exercise });
    },
    [dispatch]
  );

  return {
    generatePrompt,
    setTopic,
    toggleAI,
    aiState: state.ai
  };
}
