import { useState } from "react";
import { validateGeneratedContent } from "@/lib/difficulty";

export interface AIGeneratedText {
  id: string;
  title: { pl: string; uk: string };
  text: { pl: string; uk: string };
  topic: string;
  level: string;
}

export interface AIGlossaryWord {
  pl: string;
  uk: string;
  difficulty: "easy" | "medium" | "hard";
  context: string;
}

export interface AIExplanation {
  explanation: string;
  breakdown: {
    grammar: string;
    vocabulary: string;
    context: string;
  };
  examples: string[];
}

export function useReadingAI() {
  const [generating, setGenerating] = useState(false);
  const [generatedText, setGeneratedText] = useState<AIGeneratedText | null>(null);
  const [glossary, setGlossary] = useState<AIGlossaryWord[]>([]);
  const [explanation, setExplanation] = useState<AIExplanation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function generateText(topic: string, level: string, length: number, locale: string = "uk"): Promise<boolean> {
    setGenerating(true);
    setError(null);

    try {
      const res = await fetch("/api/ai/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "reading_text_generate",
          userInput: JSON.stringify({ topic, level, length }),
          context: JSON.stringify({ uiLanguage: locale })
        })
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.error || "Failed to generate text");
        return false;
      }

      const data = await res.json();
      const parsed = JSON.parse(data.text);

      // Validate content quality
      const validation = validateGeneratedContent({
        content: parsed,
        level: level as any,
        exerciseType: "reading"
      });

      // Log validation results
      console.log("📊 Reading content validation:", {
        valid: validation.valid,
        score: validation.score,
        metrics: validation.metrics
      });

      if (validation.errors.length > 0) {
        console.warn("⚠️ Content quality issues:", validation.errors);
      }

      // If quality is too low, reject and retry
      if (!validation.valid || validation.score < 0.6) {
        console.error("❌ Content quality too low, rejecting...");
        setError(`Якість згенерованого контенту недостатня (score: ${(validation.score * 100).toFixed(0)}%). Спробуйте ще раз.`);

        // Log to backend for monitoring
        fetch("/api/admin/content-quality-log", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "reading_text_generate",
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

        return false;
      }

      const generated: AIGeneratedText = {
        id: `ai-${Date.now()}`,
        title: parsed.title,
        text: parsed.text,
        topic: parsed.topic || topic,
        level: parsed.level || level
      };

      setGeneratedText(generated);
      return true;
    } catch (err) {
      setError("Error generating text");
      return false;
    } finally {
      setGenerating(false);
    }
  }

  async function generateGlossary(text: string, level: string, locale: string = "uk"): Promise<boolean> {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/ai/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "reading_glossary_generate",
          userInput: JSON.stringify({ text, level }),
          context: JSON.stringify({ uiLanguage: locale })
        })
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.error || "Failed to generate glossary");
        return false;
      }

      const data = await res.json();
      const parsed = JSON.parse(data.text);
      setGlossary(parsed.glossary || []);
      return true;
    } catch (err) {
      setError("Error generating glossary");
      return false;
    } finally {
      setLoading(false);
    }
  }

  async function explainFragment(
    fullText: string,
    fragment: string,
    level: string,
    locale: string = "uk"
  ): Promise<boolean> {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/ai/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "reading_explain",
          userInput: JSON.stringify({ text: fullText, fragment, level }),
          context: JSON.stringify({ uiLanguage: locale })
        })
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.error || "Failed to explain fragment");
        return false;
      }

      const data = await res.json();
      const parsed = JSON.parse(data.text);
      setExplanation(parsed);
      return true;
    } catch (err) {
      setError("Error explaining fragment");
      return false;
    } finally {
      setLoading(false);
    }
  }

  function clearGenerated() {
    setGeneratedText(null);
    setError(null);
  }

  function clearGlossary() {
    setGlossary([]);
  }

  function clearExplanation() {
    setExplanation(null);
  }

  return {
    generating,
    generatedText,
    glossary,
    explanation,
    error,
    loading,
    generateText,
    generateGlossary,
    explainFragment,
    clearGenerated,
    clearGlossary,
    clearExplanation
  };
}
