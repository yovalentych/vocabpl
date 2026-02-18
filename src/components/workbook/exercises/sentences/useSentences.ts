// @ts-nocheck
"use client";

import { useCallback } from "react";
import { useWorkbookContext } from "../../WorkbookContext";
import { WorkbookWord } from "../../types";
import { countSentences, scoreForCount, safeParseAIResponse } from "@/lib/workbook";

export function useSentences() {
  const { state, dispatch } = useWorkbookContext();
  const sentencesState = state.exercises.sentences;

  // Generate words based on configuration
  const generateWords = useCallback(async () => {
    dispatch({
      type: "UPDATE_EXERCISE_STATE",
      exercise: "sentences",
      payload: { isLoading: true }
    });

    try {
      const selected = [...sentencesState.selectedTypes];
      if (sentencesState.includeFavorites) selected.push("favorites");
      if (sentencesState.includeMyWords) selected.push("my_words");

      const params = new URLSearchParams();
      params.set("types", selected.join(","));
      params.set("count", String(sentencesState.count));

      const res = await fetch(`/api/workbook/words?${params.toString()}`);
      const data = await res.json();

      const locked = Boolean(data.locked);
      const items: WorkbookWord[] = (data.items || []).map((word: any) => ({
        ...word,
        sentences: ["", "", ""]
      }));

      dispatch({
        type: "UPDATE_EXERCISE_STATE",
        exercise: "sentences",
        payload: {
          items,
          activeId: items[0]?.id || null,
          locked,
          isLoading: false
        }
      });
    } catch (error) {
      console.error("Failed to generate words:", error);
      dispatch({ type: "SET_ERROR", payload: "Failed to generate words" });
      dispatch({
        type: "UPDATE_EXERCISE_STATE",
        exercise: "sentences",
        payload: { isLoading: false }
      });
    }
  }, [sentencesState.selectedTypes, sentencesState.includeFavorites, sentencesState.includeMyWords, sentencesState.count, dispatch]);

  // Update sentence for a specific word
  const updateSentence = useCallback(
    (wordId: string, index: number, value: string) => {
      const items = sentencesState.items.map((item) => {
        if (item.id === wordId) {
          const sentences = [...item.sentences];
          sentences[index] = value;
          return { ...item, sentences };
        }
        return item;
      });

      dispatch({
        type: "UPDATE_EXERCISE_STATE",
        exercise: "sentences",
        payload: { items }
      });
    },
    [sentencesState.items, dispatch]
  );

  // Set active word
  const setActiveWord = useCallback(
    (wordId: string) => {
      dispatch({
        type: "UPDATE_EXERCISE_STATE",
        exercise: "sentences",
        payload: { activeId: wordId }
      });
    },
    [dispatch]
  );

  // Re-export shared helpers for backward compatibility
  // countSentences and scoreForCount are imported from @/lib/workbook

  // Save entry to API
  const saveEntry = useCallback(async () => {
    const payload = sentencesState.items.map((item) => ({
      wordId: item.id,
      pl: item.pl,
      uk: item.uk,
      type: item.type,
      text: item.sentences.map((s) => s.trim()).filter(Boolean).join("\n")
    }));

    // Check if at least one item has text
    if (!payload.some((item) => item.text.trim())) {
      dispatch({ type: "SET_ERROR", payload: "Please write at least one sentence" });
      return false;
    }

    dispatch({ type: "SET_LOADING", payload: true });

    try {
      const res = await fetch("/api/workbook/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: payload })
      });

      if (!res.ok) {
        throw new Error("Failed to save entry");
      }

      const data = await res.json();

      // Update history with new entry
      dispatch({
        type: "UPDATE_HISTORY_STATE",
        payload: {
          entries: [data.entry, ...state.history.entries]
        }
      });

      dispatch({ type: "SET_LOADING", payload: false });

      // Show success message briefly
      dispatch({ type: "SET_ERROR", payload: "Entry saved successfully!" });
      setTimeout(() => {
        dispatch({ type: "SET_ERROR", payload: null });
      }, 2000);

      return true;
    } catch (error) {
      console.error("Failed to save entry:", error);
      dispatch({ type: "SET_ERROR", payload: "Failed to save entry" });
      dispatch({ type: "SET_LOADING", payload: false });
      return false;
    }
  }, [sentencesState.items, state.history.entries, dispatch]);

  // Update configuration
  const updateConfig = useCallback(
    (updates: Partial<typeof sentencesState>) => {
      dispatch({
        type: "UPDATE_EXERCISE_STATE",
        exercise: "sentences",
        payload: updates
      });
    },
    [dispatch]
  );

  // Check with AI
  const checkWithAI = useCallback(
    async (locale: string = "uk") => {
      dispatch({
        type: "UPDATE_EXERCISE_STATE",
        exercise: "sentences",
        payload: { checkLoading: true, checkResult: null }
      });

      try {
        // Prepare items for checking
        const items = sentencesState.items.map((item) => ({
          wordId: item.id,
          word: item.pl,
          meaning: item.uk,
          type: item.type,
          sentences: item.sentences.filter((s) => s.trim())
        }));

        const payload = {
          exerciseType: "sentences",
          action: "check",
          items
        };

        const res = await fetch("/api/ai/run", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode: "sentences_check",
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
          dispatch({ type: "SET_ERROR", payload: message });
          dispatch({
            type: "UPDATE_EXERCISE_STATE",
            exercise: "sentences",
            payload: { checkLoading: false }
          });
          return false;
        }

        // Parse result
        const result = safeParseAIResponse(data?.text);

        if (!result || !result.items) {
          dispatch({ type: "SET_ERROR", payload: "AI повернула неправильний формат відповіді" });
          dispatch({
            type: "UPDATE_EXERCISE_STATE",
            exercise: "sentences",
            payload: { checkLoading: false }
          });
          return false;
        }

        // Save points to database if we have a valid score
        if (result?.overall?.pointsForRating) {
          try {
            await fetch("/api/exercises/attempt", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                exercise: "sentences",
                points: result.overall.pointsForRating,
                xp: result.overall.xp || 0
              })
            });
          } catch (error) {
            console.error("Failed to save points:", error);
          }
        }

        dispatch({
          type: "UPDATE_EXERCISE_STATE",
          exercise: "sentences",
          payload: {
            checkLoading: false,
            checkResult: result
          }
        });

        return true;
      } catch (error) {
        console.error("Failed to check with AI:", error);
        dispatch({ type: "SET_ERROR", payload: "Network error" });
        dispatch({
          type: "UPDATE_EXERCISE_STATE",
          exercise: "sentences",
          payload: { checkLoading: false }
        });
        return false;
      }
    },
    [sentencesState.items, dispatch]
  );

  return {
    // State
    state: sentencesState,

    // Actions
    generateWords,
    updateSentence,
    setActiveWord,
    saveEntry,
    updateConfig,
    checkWithAI,

    // Helpers
    countSentences,
    scoreForCount
  };
}
