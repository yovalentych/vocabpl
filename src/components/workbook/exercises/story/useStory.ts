import { useState } from "react";
import { validateGeneratedContent } from "@/lib/difficulty";
import { safeParseAIResponse } from "@/lib/workbook";

export interface StoryMaterial {
  _id: string;
  title: string;
  level: string;
  content: {
    text: string;
    author?: string;
    source?: string;
  };
}

export interface StoryFeedback {
  score: number;
  overall: string;
  suggestions: string[];
  vocabulary?: { pl: string; uk: string }[];
}

export function useStory() {
  const [mode, setMode] = useState<"read" | "write">("read");
  const [materials, setMaterials] = useState<StoryMaterial[]>([]);
  const [activeMaterialId, setActiveMaterialId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [awarded, setAwarded] = useState(false);
  const [points, setPoints] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Write mode state
  const [aiStory, setAiStory] = useState<{ prompt: string; text: string } | null>(null);
  const [userText, setUserText] = useState("");
  const [feedback, setFeedback] = useState<StoryFeedback | null>(null);
  const [hints, setHints] = useState<string[]>([]);

  const activeMaterial = materials.find((m) => m._id === activeMaterialId) || null;

  async function loadMaterials() {
    setLoading(true);
    try {
      const res = await fetch("/api/exercises?type=story&level=A1");
      if (!res.ok) return;
      const data = await res.json().catch(() => ({}));
      const items = data.items || [];
      setMaterials(items);
      if (items.length > 0 && !activeMaterialId) {
        setActiveMaterialId(items[0]._id);
      }

      // Load completed from localStorage
      const stored = localStorage.getItem("story_completed");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setCompleted(new Set(parsed));
        } catch {
          // ignore
        }
      }
    } finally {
      setLoading(false);
    }
  }

  function selectMaterial(materialId: string) {
    setActiveMaterialId(materialId);
    setAwarded(false);
    setPoints(null);
  }

  async function markAsComplete(): Promise<boolean> {
    if (!activeMaterial || awarded) return false;

    try {
      const res = await fetch("/api/exercises/attempt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "story",
          materialId: activeMaterial._id,
          score: 1.0 // Full score for reading
        })
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        setPoints(Number(data?.points || 0));
        setAwarded(true);

        // Mark as completed
        const newCompleted = new Set(completed);
        newCompleted.add(activeMaterial._id);
        setCompleted(newCompleted);
        localStorage.setItem("story_completed", JSON.stringify([...newCompleted]));

        return true;
      }
    } catch (error) {
      console.error("Failed to mark story as complete:", error);
    }

    return false;
  }

  function goToNext() {
    if (!materials.length || !activeMaterialId) return;

    const currentIndex = materials.findIndex((m) => m._id === activeMaterialId);
    const nextIndex = (currentIndex + 1) % materials.length;
    selectMaterial(materials[nextIndex]._id);
  }

  function goToPrevious() {
    if (!materials.length || !activeMaterialId) return;

    const currentIndex = materials.findIndex((m) => m._id === activeMaterialId);
    const prevIndex = currentIndex === 0 ? materials.length - 1 : currentIndex - 1;
    selectMaterial(materials[prevIndex]._id);
  }

  // AI Write Mode Functions
  async function generateStory(
    topic: string,
    level: "A1" | "A2" | "B1" | "B2",
    locale: string = "uk"
  ): Promise<boolean> {
    setLoading(true);
    setError(null);

    try {
      const payload = {
        exerciseType: "story",
        action: "generate",
        topic,
        level
      };

      const res = await fetch("/api/ai/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "story_generate",
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

      const parsed = safeParseAIResponse(data?.text);

      if (parsed?.prompt && parsed?.text) {
        // Validate content quality
        const validation = validateGeneratedContent({
          content: { text: parsed.text },
          level: level as any,
          exerciseType: "reading" // Story is similar to reading
        });

        // If quality is too low, reject and retry
        if (!validation.valid || validation.score < 0.6) {
          fetch("/api/admin/content-quality-log", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "story_generate",
              level,
              topic,
              validation: {
                valid: validation.valid,
                score: validation.score,
                errors: validation.errors.map(e => e.message)
              },
              metrics: validation.metrics
            })
          }).catch(() => null);

          setError(`Якість згенерованої історії недостатня (score: ${(validation.score * 100).toFixed(0)}%). Спробуйте ще раз.`);
          return false;
        }

        setAiStory({ prompt: parsed.prompt, text: parsed.text });
        setUserText("");
        setFeedback(null);
        setHints([]);
        return true;
      } else {
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

  async function checkWriting(locale: string = "uk"): Promise<boolean> {
    if (!aiStory || !userText.trim()) return false;

    setLoading(true);
    setError(null);

    try {
      const payload = {
        prompt: aiStory.prompt,
        aiExample: aiStory.text,
        userText
      };

      const res = await fetch("/api/ai/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "story_check",
          userInput: JSON.stringify(payload),
          context: JSON.stringify({ uiLanguage: locale })
        })
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data?.error || "AI error");
        return false;
      }

      const parsed = safeParseAIResponse(data?.text);
      if (parsed?.feedback) {
        setFeedback(parsed.feedback);

        // Save attempt with points
        if (parsed.feedback.score !== undefined) {
          try {
            await fetch("/api/exercises/attempt", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                type: "story",
                materialId: "ai_generated",
                score: parsed.feedback.score
              })
            });
          } catch (err) {
            console.error("Failed to save attempt:", err);
          }
          setPoints(Number(parsed.feedback.score * 10 || 0));
          setAwarded(true);
        }

        return true;
      } else {
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

  async function getHints(locale: string = "uk"): Promise<void> {
    if (!aiStory || !userText.trim()) return;

    try {
      const payload = {
        prompt: aiStory.prompt,
        currentText: userText
      };

      const res = await fetch("/api/ai/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "story_hints",
          userInput: JSON.stringify(payload),
          context: JSON.stringify({ uiLanguage: locale })
        })
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        const parsed = safeParseAIResponse(data?.text);
        if (parsed?.hints && Array.isArray(parsed.hints)) {
          setHints(parsed.hints);
        }
      }
    } catch {
      // Ignore network errors for hints
    }
  }

  function resetWriteMode() {
    setAiStory(null);
    setUserText("");
    setFeedback(null);
    setHints([]);
    setAwarded(false);
    setPoints(null);
    setError(null);
  }

  return {
    // State
    mode,
    materials,
    activeMaterial,
    activeMaterialId,
    loading,
    completed,
    awarded,
    points,
    error,

    // Write mode state
    aiStory,
    userText,
    feedback,
    hints,

    // Actions
    setMode,
    setUserText,
    loadMaterials,
    selectMaterial,
    markAsComplete,
    goToNext,
    goToPrevious,

    // AI Write mode actions
    generateStory,
    checkWriting,
    getHints,
    resetWriteMode
  };
}
