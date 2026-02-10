import { useState } from "react";
import { safeJSONParse } from "@/lib/json-utils";

export interface ComprehensionQuestion {
  type: "open" | "truefalse" | "multiple" | "short";
  question: { pl: string; uk: string };
  // For true/false
  correctAnswer?: boolean;
  // For multiple choice
  options?: { pl: string; uk: string }[];
  correctOptionIndex?: number;
  // For open-ended/short (for reference, but AI will check)
  hint?: { pl: string; uk: string };
}

export interface ComprehensionQuestions {
  questions: ComprehensionQuestion[];
}

export interface UserAnswer {
  type: "open" | "truefalse" | "multiple" | "short";
  // For open/short - text value
  textValue?: string;
  // For true/false - boolean value
  boolValue?: boolean;
  // For multiple - selected option index
  optionIndex?: number;
}

export interface ComprehensionResult {
  overall: {
    score01: number;
    pointsForRating: number;
    feedback: string;
  };
  items: {
    questionIndex: number;
    correct: boolean;
    userAnswer: string;
    expectedAnswer: string;
    feedback: string;
  }[];
  suggestedVocab?: {
    lemma: string;
    meaning: string;
    reason: string;
  }[];
}

export function useReadingComprehension() {
  const [questions, setQuestions] = useState<ComprehensionQuestions | null>(null);
  const [answers, setAnswers] = useState<UserAnswer[]>([]);
  const [result, setResult] = useState<ComprehensionResult | null>(null);
  const [generating, setGenerating] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [points, setPoints] = useState<number | null>(null);
  const [awarded, setAwarded] = useState(false);

  async function generateQuestions(
    text: string,
    level: string,
    questionCount: number = 5,
    locale: string = "uk"
  ): Promise<boolean> {
    setGenerating(true);
    setError(null);

    try {
      const res = await fetch("/api/ai/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "reading_questions_generate",
          userInput: JSON.stringify({ text, level, questionCount }),
          context: JSON.stringify({ uiLanguage: locale })
        })
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.error || "Failed to generate questions");
        return false;
      }

      const data = await res.json();
      console.log("Raw response:", data);

      const parseResult = safeJSONParse(data.text);

      if (!parseResult.success) {
        console.error("JSON parse error:", parseResult.error);
        console.error("data.text:", data.text);
        setError(`Помилка парсингу відповіді AI: ${parseResult.error}`);
        return false;
      }

      const parsed = parseResult.data;
      console.log("Parsed questions:", parsed);

      if (!parsed || !parsed.questions || !Array.isArray(parsed.questions)) {
        console.error("Invalid structure:", parsed);
        setError("Неправильна структура відповіді AI");
        return false;
      }

      setQuestions(parsed);
      // Initialize answers array based on question types
      const initialAnswers = parsed.questions.map((q: ComprehensionQuestion) => ({
        type: q.type,
        textValue: "",
        boolValue: undefined,
        optionIndex: undefined
      }));
      setAnswers(initialAnswers);
      setResult(null);
      setAwarded(false);
      return true;
    } catch (err) {
      console.error("Generate questions error:", err);
      setError(err instanceof Error ? err.message : "Error generating questions");
      return false;
    } finally {
      setGenerating(false);
    }
  }

  async function checkAnswers(
    text: string,
    textId: string,
    locale: string = "uk"
  ): Promise<boolean> {
    if (!questions) return false;

    setChecking(true);
    setError(null);

    try {
      const res = await fetch("/api/ai/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "reading_comprehension_check",
          userInput: JSON.stringify({
            text,
            questions: questions.questions,
            answers
          }),
          context: JSON.stringify({ uiLanguage: locale })
        })
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.error || "Failed to check answers");
        return false;
      }

      const data = await res.json();

      const parseResult = safeJSONParse(data.text);
      if (!parseResult.success) {
        setError(`Помилка парсингу відповіді AI: ${parseResult.error}`);
        return false;
      }

      const parsed = parseResult.data;
      setResult(parsed);

      // Award points
      if (!awarded) {
        const pointsEarned = Math.round(parsed.overall.pointsForRating);
        await awardPoints(textId, parsed.overall.score01, pointsEarned);
        setPoints(pointsEarned);
        setAwarded(true);
      }

      return true;
    } catch (err) {
      setError("Error checking answers");
      return false;
    } finally {
      setChecking(false);
    }
  }

  async function awardPoints(materialId: string, score: number, pointsEarned: number): Promise<void> {
    try {
      await fetch("/api/exercises/attempt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "reading_comprehension",
          materialId,
          score
        })
      });
    } catch (err) {
      console.error("Failed to award points:", err);
    }
  }

  function updateAnswer(index: number, value: Partial<UserAnswer>) {
    const newAnswers = [...answers];
    newAnswers[index] = { ...newAnswers[index], ...value };
    setAnswers(newAnswers);
  }

  function reset() {
    setQuestions(null);
    setAnswers([]);
    setResult(null);
    setError(null);
    setPoints(null);
    setAwarded(false);
  }

  return {
    questions,
    answers,
    result,
    generating,
    checking,
    error,
    points,
    awarded,
    generateQuestions,
    checkAnswers,
    updateAnswer,
    reset
  };
}
