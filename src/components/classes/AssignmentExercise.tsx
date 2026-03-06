"use client";

import { useState, useEffect, useRef } from "react";
import Loader from "@/components/ui/Loader";
import { csrfFetch } from "@/lib/csrf-client";
import SentencesAIPractice from "@/components/workbook/exercises/sentences/SentencesAIPractice";
import ClozeAIPractice from "@/components/workbook/exercises/cloze/ClozeAIPractice";
import MatchAIPractice from "@/components/workbook/exercises/match/MatchAIPractice";
import TranslateAIPractice from "@/components/workbook/exercises/translate/TranslateAIPractice";
import ParaphraseAIPractice from "@/components/workbook/exercises/paraphrase/ParaphraseAIPractice";
import DialogueAIPractice from "@/components/workbook/exercises/dialogue/DialogueAIPractice";
import DescribePractice from "@/components/workbook/exercises/describe/DescribePractice";
import StoryPractice from "@/components/workbook/exercises/story/StoryPractice";

type AssignmentExerciseProps = {
  classId: string;
  assignmentId: string;
};

type Phase = "loading" | "ready" | "practicing" | "submitting" | "done" | "error";

type AssignmentData = {
  title: string;
  exerciseType?: string;
  exerciseConfig?: {
    topic?: string;
    level?: string;
  };
};

const EXERCISE_TYPE_LABELS: Record<string, string> = {
  sentences: "Речення",
  cloze: "Пропуски",
  match: "Співставлення",
  translate: "Переклад",
  paraphrase: "Перефразування",
  dialogue: "Діалог",
  describe: "Опис",
  story: "Історія",
};

export default function AssignmentExercise({ classId, assignmentId }: AssignmentExerciseProps) {
  const [phase, setPhase] = useState<Phase>("loading");
  const [assignment, setAssignment] = useState<AssignmentData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const startTimeRef = useRef<number>(Date.now());

  // --- Load assignment on mount ---
  useEffect(() => {
    startTimeRef.current = Date.now();

    async function loadAssignment() {
      try {
        const res = await fetch(`/api/classes/${classId}/assignments/${assignmentId}`);
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || `HTTP ${res.status}`);
        }

        const data = await res.json();
        const a = data.assignment;

        if (!a?.exerciseType) {
          setErrorMessage("Цьому завданню не призначено тип вправи.");
          setPhase("error");
          return;
        }

        setAssignment({
          title: a.title,
          exerciseType: a.exerciseType,
          exerciseConfig: a.exerciseConfig,
        });
        setPhase("ready");
      } catch (err) {
        console.error("Failed to load assignment:", err);
        setErrorMessage(err instanceof Error ? err.message : "Не вдалося завантажити завдання.");
        setPhase("error");
      }
    }

    loadAssignment();
  }, [classId, assignmentId]);

  // --- Submit exercise result after practice completes ---
  async function handleComplete() {
    if (!assignment?.exerciseType) return;

    setPhase("submitting");

    const timeSpent = Math.round((Date.now() - startTimeRef.current) / 1000);

    try {
      // Fetch the latest exercise_attempt that was saved by the practice component
      const latestRes = await fetch(
        `/api/exercises/latest?type=${assignment.exerciseType}&since=${startTimeRef.current}`
      );

      if (!latestRes.ok) throw new Error("Failed to fetch latest attempt");

      const latestData = await latestRes.json();
      const attempt = latestData.attempt;

      if (attempt) {
        await csrfFetch(`/api/classes/${classId}/assignments/${assignmentId}/submit`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            score: attempt.score,
            points: attempt.points,
            exerciseData: {
              attempts: 1,
              timeSpent,
            },
          }),
        });
      }
    } catch (err) {
      // The exercise result was already saved by the practice component itself.
      // If submission to the class fails, we still navigate back — the student
      // can see their attempt and the teacher can reconcile later.
      console.error("Failed to submit assignment result:", err);
    }

    window.location.href = `/classes/${classId}/assignments/${assignmentId}`;
  }

  // --- Render the correct practice component ---
  function renderPractice() {
    if (!assignment?.exerciseType) return null;

    const cfg = assignment.exerciseConfig;
    const topic = cfg?.topic || "General Polish";
    const level = (cfg?.level || "A2") as "A1" | "A2" | "B1" | "B2";

    switch (assignment.exerciseType) {
      case "sentences":
        return (
          <SentencesAIPractice
            config={{ topic, level, count: 5 }}
            onComplete={handleComplete}
          />
        );
      case "cloze":
        return (
          <ClozeAIPractice
            config={{ topic, level, sentenceCount: 5 }}
            onComplete={handleComplete}
          />
        );
      case "match":
        return (
          <MatchAIPractice
            config={{ topic, pairType: "translation", level, pairCount: 5 }}
            onComplete={handleComplete}
          />
        );
      case "translate":
        return (
          <TranslateAIPractice
            config={{ topic, direction: "uk_to_pl", level, count: 5 }}
            onComplete={handleComplete}
          />
        );
      case "paraphrase":
        return (
          <ParaphraseAIPractice
            config={{ topic, level, count: 5 }}
            onComplete={handleComplete}
          />
        );
      case "dialogue":
        return (
          <DialogueAIPractice
            config={{ situation: topic, level }}
            onComplete={handleComplete}
          />
        );
      case "describe":
        return (
          <DescribePractice
            prompt={topic}
            level={level}
            onComplete={handleComplete}
          />
        );
      case "story":
        return (
          <StoryPractice
            topic={topic}
            level={level}
            onComplete={handleComplete}
          />
        );
      default:
        return (
          <div className="py-12 text-center text-ink/60">
            Невідомий тип вправи: {assignment.exerciseType}
          </div>
        );
    }
  }

  // =================================================================
  // Render phases
  // =================================================================

  if (phase === "loading") {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader size="lg" label="Завантаження завдання..." />
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div className="mx-auto max-w-lg px-5 py-16 text-center">
        <div className="rounded-2xl border border-ink/10 bg-paper p-8">
          <p className="mb-6 text-ink/70">{errorMessage || "Сталася помилка."}</p>
          <button
            onClick={() => {
              window.location.href = `/classes/${classId}/assignments/${assignmentId}`;
            }}
            className="rounded-full border border-moss/30 bg-moss px-6 py-3 text-sm font-semibold text-white hover:bg-moss/90 transition-colors"
          >
            Назад
          </button>
        </div>
      </div>
    );
  }

  if (phase === "ready" && assignment) {
    const exerciseLabel = assignment.exerciseType
      ? EXERCISE_TYPE_LABELS[assignment.exerciseType] || assignment.exerciseType
      : "";
    const level = assignment.exerciseConfig?.level || "A2";

    return (
      <div className="mx-auto max-w-lg px-5 py-16">
        <div className="rounded-2xl border border-ink/10 bg-paper p-8 text-center">
          <h2 className="mb-4 text-xl font-bold text-ink">{assignment.title}</h2>

          <div className="mb-6 flex items-center justify-center gap-2">
            {exerciseLabel && (
              <span className="inline-flex items-center rounded-full bg-moss/10 px-3 py-1 text-xs font-semibold text-moss">
                {exerciseLabel}
              </span>
            )}
            <span className="inline-flex items-center rounded-full bg-ink/5 px-3 py-1 text-xs font-semibold text-ink/60">
              {level}
            </span>
          </div>

          <button
            onClick={() => setPhase("practicing")}
            className="rounded-full border border-moss/30 bg-moss px-6 py-3 text-sm font-semibold text-white hover:bg-moss/90 transition-colors"
          >
            Почати вправу
          </button>
        </div>
      </div>
    );
  }

  if (phase === "practicing") {
    return <>{renderPractice()}</>;
  }

  if (phase === "submitting") {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader size="lg" label="Збереження результатів..." />
      </div>
    );
  }

  return null;
}
