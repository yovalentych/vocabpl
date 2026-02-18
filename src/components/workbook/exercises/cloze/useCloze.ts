import { useCallback, useState } from "react";
import { safeParseAIResponse } from "@/lib/workbook";

export interface ClozeGap {
  answers: string[];
  hint?: string;
}

export interface ClozeItem {
  id?: string;
  text: string;
  gaps: ClozeGap[];
}

export interface ClozeMaterial {
  _id: string;
  title: string;
  level: string;
  content: {
    items: ClozeItem[];
  };
}

export interface ClozeScore {
  total: number;
  correct: number;
  score: number;
}

export function useCloze() {
  const [materials, setMaterials] = useState<ClozeMaterial[]>([]);
  const [activeMaterialId, setActiveMaterialId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [hintsOpen, setHintsOpen] = useState<Record<string, boolean>>({});
  const [hintsDefault, setHintsDefault] = useState(true);
  const [focusMode, setFocusMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [awarded, setAwarded] = useState(false);
  const [points, setPoints] = useState<number | null>(null);

  // Training mode state
  const [trainingActive, setTrainingActive] = useState(false);
  const [queue, setQueue] = useState<string[]>([]);
  const [queueIndex, setQueueIndex] = useState(0);

  const activeMaterial = materials.find((m) => m._id === activeMaterialId) || null;

  const normalizeAnswer = useCallback((value: string): string => {
    return value.trim().toLowerCase();
  }, []);

  const isGapCorrect = useCallback(
    (gap: ClozeGap, value: string): boolean => {
      if (!gap || !Array.isArray(gap.answers)) return false;
      const normalized = normalizeAnswer(value);
      return gap.answers.some((ans) => normalizeAnswer(ans) === normalized);
    },
    [normalizeAnswer]
  );

  const computeScore = useCallback(
    (material: ClozeMaterial | null, userAnswers: Record<string, string>): ClozeScore => {
      if (!material) return { total: 0, correct: 0, score: 0 };

      const items = material.content?.items || [];
      let total = 0;
      let correct = 0;

      items.forEach((item, idx) => {
        (item.gaps || []).forEach((gap, gapIdx) => {
          total += 1;
          const key = `${item.id || idx}-${gapIdx}`;
          const answer = userAnswers[key] || "";
          if (isGapCorrect(gap, answer)) {
            correct += 1;
          }
        });
      });

      const score = total === 0 ? 0 : correct / total;
      return { total, correct, score };
    },
    [isGapCorrect]
  );

  const loadMaterials = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/exercises?type=cloze&level=A1");
      if (!res.ok) return;
      const data = await res.json().catch(() => ({}));
      const items = data.items || [];
      setMaterials(items);
      if (items.length > 0) {
        setActiveMaterialId((prev) => prev ?? items[0]._id);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const selectMaterial = useCallback((materialId: string) => {
    setActiveMaterialId(materialId);
    setAnswers({});
    setAwarded(false);
    setPoints(null);
    setTrainingActive(false);
    setQueue([]);
    setQueueIndex(0);
  }, []);

  const updateAnswer = useCallback((key: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  }, []);

  const toggleHints = useCallback(
    (itemKey: string) => {
      setHintsOpen((prev) => {
        const current = prev[itemKey] ?? hintsDefault;
        return { ...prev, [itemKey]: !current };
      });
    },
    [hintsDefault]
  );

  const submitAttempt = useCallback(async (): Promise<boolean> => {
    if (!activeMaterial || awarded) return false;

    const result = computeScore(activeMaterial, answers);

    try {
      const res = await fetch("/api/exercises/attempt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "cloze",
          materialId: activeMaterial._id,
          score: result.score
        })
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        setPoints(Number(data?.points || 0));
        setAwarded(true);
        return true;
      }
    } catch (error) {
      console.error("Failed to submit attempt:", error);
    }

    return false;
  }, [activeMaterial, answers, awarded, computeScore]);

  const startTraining = useCallback((materialIds: string[]) => {
    if (materialIds.length === 0) return;

    setQueue(materialIds);
    setQueueIndex(0);
    setTrainingActive(true);
    setActiveMaterialId(materialIds[0]);
    setAnswers({});
    setAwarded(false);
    setPoints(null);
  }, []);

  const goToNextInQueue = useCallback(() => {
    if (!trainingActive || queueIndex >= queue.length - 1) return;

    const nextIndex = queueIndex + 1;
    setQueueIndex(nextIndex);
    setActiveMaterialId(queue[nextIndex]);
    setAnswers({});
    setAwarded(false);
    setPoints(null);
  }, [queue, queueIndex, trainingActive]);

  const goToPreviousInQueue = useCallback(() => {
    if (!trainingActive || queueIndex <= 0) return;

    const prevIndex = queueIndex - 1;
    setQueueIndex(prevIndex);
    setActiveMaterialId(queue[prevIndex]);
    setAnswers({});
    setAwarded(false);
    setPoints(null);
  }, [queue, queueIndex, trainingActive]);

  const exitTraining = useCallback(() => {
    setTrainingActive(false);
    setQueue([]);
    setQueueIndex(0);
  }, []);

  // Generate AI cloze exercise
  const generateAI = useCallback(async (topic: string, hintTypes: ("word" | "translation" | "context")[], locale: string = "uk"): Promise<boolean> => {
    setLoading(true);

    try {
      const payload = {
        exerciseType: "cloze",
        action: "generate",
        topic,
        hintTypes,
        count: 6
      };

      const res = await fetch("/api/ai/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "cloze_generate",
          userInput: JSON.stringify(payload),
          context: JSON.stringify({ uiLanguage: locale })
        })
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setLoading(false);
        return false;
      }

      const result = safeParseAIResponse(data?.text);

      if (result?.task) {
        // Convert AI task to material format
        const aiMaterial: ClozeMaterial = {
          _id: `ai-${Date.now()}`,
          title: result.task.title || topic,
          level: result.task.level || "A1",
          content: {
            items: result.task.items || []
          }
        };

        setMaterials([aiMaterial]);
        setActiveMaterialId(aiMaterial._id);
        setAnswers({});
        setAwarded(false);
        setPoints(null);
        setLoading(false);
        return true;
      }

      setLoading(false);
      return false;
    } catch (error) {
      console.error("Failed to generate AI cloze:", error);
      setLoading(false);
      return false;
    }
  }, []);

  // Check with AI
  const checkWithAI = useCallback(async (locale: string = "uk"): Promise<any> => {
    if (!activeMaterial) return null;

    try {
      const items = (activeMaterial.content?.items || []).map((item, idx) => ({
        id: item.id || String(idx),
        text: item.text,
        gaps: (item.gaps || []).map((gap, gapIdx) => {
          const key = `${item.id || idx}-${gapIdx}`;
          return {
            expected: gap.answers,
            user: answers[key] || ""
          };
        })
      }));

      const payload = {
        exerciseType: "cloze",
        action: "check",
        items
      };

      const res = await fetch("/api/ai/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "cloze_check",
          userInput: JSON.stringify(payload),
          context: JSON.stringify({ uiLanguage: locale })
        })
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        return null;
      }

      const result = safeParseAIResponse(data?.text);
      if (!result) return null;

      // Save points if available
      if (result?.overall?.pointsForRating) {
        try {
          await fetch("/api/exercises/attempt", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              exercise: "cloze",
              points: result.overall.pointsForRating,
              xp: result.overall.xp || 0
            })
          });
          setPoints(result.overall.pointsForRating);
          setAwarded(true);
        } catch (error) {
          console.error("Failed to save points:", error);
        }
      }

      return result;
    } catch (error) {
      console.error("Failed to check with AI:", error);
      return null;
    }
  }, [activeMaterial, answers]);

  return {
    // State
    materials,
    activeMaterial,
    activeMaterialId,
    answers,
    hintsOpen,
    hintsDefault,
    focusMode,
    loading,
    awarded,
    points,
    trainingActive,
    queue,
    queueIndex,

    // Actions
    loadMaterials,
    selectMaterial,
    updateAnswer,
    toggleHints,
    setHintsDefault,
    setFocusMode,
    submitAttempt,
    computeScore,
    isGapCorrect,

    // Training
    startTraining,
    goToNextInQueue,
    goToPreviousInQueue,
    exitTraining,

    // AI
    generateAI,
    checkWithAI
  };
}
