"use client";

import { useState } from "react";
import { useLocale } from "@/components/LocaleProvider";
import Loader from "@/components/ui/Loader";
import { Sparkle, Book } from "@phosphor-icons/react/dist/ssr";
import { safeParseAIResponse } from "@/lib/workbook";
import { calculatePoints } from "@/lib/scoring";
import StoryResultModal from "./StoryResultModal";

interface StoryPracticeProps {
  level?: "A1" | "A2" | "B1" | "B2";
  topic?: string;
  onComplete?: () => void;
}

interface StoryFeedback {
  score: number;
  overall: string;
  suggestions: string[];
  vocabulary?: { pl: string; uk: string }[];
}

export default function StoryPractice({ level = "A2", topic, onComplete }: StoryPracticeProps) {
  const { t, locale } = useLocale();

  // Form state
  const [storyTitle, setStoryTitle] = useState("");
  const [storyText, setStoryText] = useState("");

  // Checking state
  const [checking, setChecking] = useState(false);
  const [feedback, setFeedback] = useState<StoryFeedback | null>(null);
  const [points, setPoints] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [showResultModal, setShowResultModal] = useState(false);

  const wordCount = storyText.trim().split(/\s+/).filter(Boolean).length;

  const handleCheck = async () => {
    if (!storyTitle.trim() || !storyText.trim()) return;

    setChecking(true);
    setError(null);

    try {
      const payload = {
        title: storyTitle.trim(),
        text: storyText.trim(),
        level,
        ...(topic ? { topic } : {})
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
        setError(data?.error || t.workbook.errorTitle);
        setChecking(false);
        return;
      }

      const parsed = safeParseAIResponse(data?.text);

      if (parsed?.feedback) {
        setFeedback(parsed.feedback);

        // Calculate points
        const score01 = parsed.feedback.score01 ?? parsed.feedback.score ?? 0;
        const calculatedPoints = calculatePoints({ score01, level, exercise: "story" });
        setPoints(calculatedPoints);

        // Save to history and leaderboard
        await fetch("/api/workbook/story/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: storyTitle,
            text: storyText,
            level,
            score: score01,
            points: calculatedPoints,
            feedback: parsed.feedback.overall
          })
        }).catch(() => null);

        await fetch("/api/exercises/attempt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "story",
            materialId: `story-${Date.now()}`,
            score: score01,
            points: calculatedPoints
          })
        }).catch(() => null);

        setShowResultModal(true);
      }
    } catch (err) {
      setError(t.workbook.errorTitle);
    } finally {
      setChecking(false);
    }
  };

  const handleCloseModal = () => {
    setShowResultModal(false);
    onComplete?.();
    // Reset form
    setStoryTitle("");
    setStoryText("");
    setFeedback(null);
  };

  const handleTryAgain = () => {
    setShowResultModal(false);
    setStoryTitle("");
    setStoryText("");
    setFeedback(null);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-3xl border border-ink/10 bg-paper/80 p-4 shadow-soft">
        <div className="flex items-center gap-3">
          <Book size={24} weight="fill" className="text-ink/40" />
          <div>
            <h2 className="text-xl font-semibold">
              {t.workbook.microStory}
            </h2>
            <p className="text-sm text-ink/60">
              {t.workbook.levelLabel} {level}{topic ? ` · ${topic}` : ` · ${t.workbook.writeShortStory}`}
            </p>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="rounded-3xl border border-gold/20 bg-gold/5 p-4">
        <p className="text-sm text-ink/70">
          💡 <strong>{t.workbook.hintWrite}</strong> {t.workbook.hintWriteStory}
        </p>
      </div>

      {/* Title Input */}
      <div className="rounded-3xl border border-ink/10 bg-paper/80 p-4 shadow-soft">
        <label className="block text-sm text-ink/70">
          <span className="text-xs uppercase tracking-[0.2em] text-ink/40">
            {t.workbook.storyTitleLabel}
          </span>
          <input
            type="text"
            value={storyTitle}
            onChange={(e) => setStoryTitle(e.target.value)}
            placeholder={t.workbook.storyTitlePlaceholder}
            className="mt-2 w-full rounded-2xl border border-ink/20 bg-paper px-4 py-3 text-sm focus:border-moss/40 focus:outline-none"
            disabled={checking}
          />
        </label>
      </div>

      {/* Text Input */}
      <div className="rounded-3xl border border-ink/10 bg-paper/80 p-4 shadow-soft">
        <div className="flex items-center justify-between">
          <label className="text-xs uppercase tracking-[0.2em] text-ink/40">
            {t.workbook.storyTextLabel}
          </label>
          <span className="text-xs text-ink/40">
            {wordCount} {t.workbook.words} {wordCount < 50 && `(${t.workbook.storyMinChars})`}
          </span>
        </div>
        <textarea
          value={storyText}
          onChange={(e) => setStoryText(e.target.value)}
          placeholder={t.workbook.storyTextPlaceholder}
          className="mt-2 min-h-[300px] w-full rounded-2xl border border-ink/20 bg-paper px-4 py-3 text-sm leading-relaxed focus:border-moss/40 focus:outline-none resize-none"
          disabled={checking}
        />
      </div>

      {/* Actions */}
      <div className="rounded-3xl border border-ink/10 bg-paper/80 p-4 shadow-soft">
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleCheck}
            disabled={checking || !storyTitle.trim() || !storyText.trim() || wordCount < 50}
            className="flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-semibold text-paper transition hover:bg-ink/90 disabled:opacity-50"
          >
            {checking ? (
              <>
                <Loader label="" size="sm" />
                {t.workbook.aiCheckingStory}
              </>
            ) : (
              <>
                <Sparkle size={16} weight="fill" />
                {t.workbook.checkButton}
              </>
            )}
          </button>

          {error && <span className="text-sm text-terracotta">{error}</span>}
        </div>
      </div>

      {/* Result Modal */}
      <StoryResultModal
        isOpen={showResultModal}
        feedback={feedback}
        points={points}
        onClose={handleCloseModal}
        onTryAgain={handleTryAgain}
      />
    </div>
  );
}
