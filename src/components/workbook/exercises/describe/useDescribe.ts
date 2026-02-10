import { useCallback, useState } from "react";

interface DescribeImage {
  url: string;
  thumb?: string;
  alt?: string | null;
  author?: string | null;
  authorUrl?: string | null;
  sourceUrl?: string | null;
}

export interface DescribeResult {
  overall?: {
    score01: number;
    band: string;
    pointsForRating?: number;
    xp?: number;
  };
  feedbackUk?: string;
  improvedPl?: string;
  translationUk?: string;
  suggestedVocab?: { lemma: string; meaningUk: string; reasonUk?: string }[];
}

export function useDescribe() {
  const [image, setImage] = useState<DescribeImage | null>(null);
  const [description, setDescription] = useState("");
  const [result, setResult] = useState<DescribeResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [points, setPoints] = useState<number | null>(null);

  const fetchImage = useCallback(async (prompt: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/unsplash/search?query=${encodeURIComponent(prompt)}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.image) {
        setError(data?.error || "Failed to load image");
        setLoading(false);
        return false;
      }
      setImage(data.image);
      setDescription("");
      setResult(null);
      setPoints(null);
      setLoading(false);
      return true;
    } catch (err) {
      setError("Failed to load image");
      setLoading(false);
      return false;
    }
  }, []);

  const checkDescription = useCallback(
    async (prompt: string, level: string, uiLanguage: string) => {
      if (!image) return false;
      setChecking(true);
      setError(null);

      const payload = {
        exerciseType: "describe",
        action: "check",
        level,
        prompt,
        image: {
          url: image.url,
          alt: image.alt,
          author: image.author
        },
        description
      };

      try {
        const res = await fetch("/api/ai/run", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode: "describe_check",
            userInput: JSON.stringify(payload),
            context: JSON.stringify({ uiLanguage })
          })
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(data?.error || "AI error");
          setChecking(false);
          return false;
        }
        const parsed = JSON.parse(String(data?.text || "{}"));
        setResult(parsed);

        // Calculate points based on score if not provided
        const score = parsed?.overall?.score01 || 0;
        const calculatedPoints = parsed?.overall?.pointsForRating || Math.round(score * 10);

        // Save to history
        const saveAttempt = await fetch("/api/workbook/describe/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt,
            level,
            imageUrl: image.url,
            imageAlt: image.alt,
            description,
            score,
            points: calculatedPoints,
            feedback: parsed.feedbackUk,
            improvedPl: parsed.improvedPl,
            translationUk: parsed.translationUk
          })
        }).catch(() => null);

        // Also track in exercises (for general stats and leaderboard)
        const trackAttempt = await fetch("/api/exercises/attempt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "describe",
            materialId: `describe-${Date.now()}`,
            score,
            points: calculatedPoints
          })
        }).catch(() => null);

        // Set points for UI
        setPoints(calculatedPoints);
        setChecking(false);
        return true;
      } catch (err) {
        setError("AI error");
        setChecking(false);
        return false;
      }
    },
    [description, image]
  );

  return {
    image,
    description,
    result,
    loading,
    checking,
    error,
    points,
    setDescription,
    fetchImage,
    checkDescription
  };
}
