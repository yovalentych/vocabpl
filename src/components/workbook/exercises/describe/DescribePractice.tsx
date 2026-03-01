"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useLocale } from "@/components/LocaleProvider";
import { useDescribe } from "./useDescribe";
import VocabSuggestions from "../../shared/VocabSuggestions";
import Loader from "@/components/ui/Loader";
import { Sparkle, Lightbulb, ArrowsOutSimple } from "@phosphor-icons/react/dist/ssr";
import DescribeResultModal from "./DescribeResultModal";

interface DescribePracticeProps {
  prompt?: string;
  level?: "A1" | "A2" | "B1" | "B2";
  onComplete?: () => void;
}

// Клішовані фрази для різних рівнів
const commonPhrases: Record<string, string[]> = {
  A1: [
    "Na zdjęciu widzę...",
    "To jest...",
    "Jest tu...",
    "Widzę..."
  ],
  A2: [
    "Na zdjęciu widać...",
    "W tle znajduje się...",
    "Po lewej stronie jest...",
    "Po prawej stronie widzę...",
    "Na pierwszym planie..."
  ],
  B1: [
    "Na zdjęciu przedstawiono...",
    "W centrum uwagi znajduje się...",
    "Scena rozgrywa się...",
    "Można zauważyć, że...",
    "Wygląda na to, że..."
  ],
  B2: [
    "Fotografia ukazuje...",
    "Kompozycja zdjęcia skupia się na...",
    "Atmosfera sceny sugeruje...",
    "Warto zwrócić uwagę na...",
    "Charakter ujęcia wskazuje na..."
  ]
};

export default function DescribePractice({ prompt = "", level = "A1", onComplete }: DescribePracticeProps) {
  const { t, locale } = useLocale();
  const {
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
  } = useDescribe();

  const [showHints, setShowHints] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);

  useEffect(() => {
    if (prompt) {
      fetchImage(prompt);
    }
  }, [fetchImage, prompt]);

  const handleCheck = async () => {
    const success = await checkDescription(prompt, level, locale);
    if (success) {
      setShowResultModal(true);
    }
  };

  const handleCloseModal = () => {
    setShowResultModal(false);
    onComplete?.();
    // Reset for next attempt
    setDescription("");
    if (prompt) {
      fetchImage(prompt);
    }
  };

  const handleTryAgain = () => {
    setShowResultModal(false);
    setDescription("");
    if (prompt) {
      fetchImage(prompt);
    }
  };

  const handleNewImage = () => {
    if (prompt) {
      fetchImage(prompt);
    }
  };

  const insertPhrase = (phrase: string) => {
    const textarea = document.querySelector('textarea');
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const currentText = description;
      const before = currentText.substring(0, start);
      const after = currentText.substring(end);
      const newText = before + phrase + " " + after;
      setDescription(newText);

      // Set cursor position after inserted phrase
      setTimeout(() => {
        textarea.focus();
        textarea.selectionStart = textarea.selectionEnd = start + phrase.length + 1;
      }, 0);
    }
  };

  const suggested = (result?.suggestedVocab || []).map((item: any) => ({
    pl: item.lemma,
    uk: item.meaningUk
  }));

  async function addVocabWord({ pl, uk }: { pl: string; uk: string }) {
    await fetch("/api/user/words/custom", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pl, uk })
    });
  }

  async function addAllVocab() {
    for (const item of suggested) {
      await addVocabWord(item);
    }
  }

  const phrases = commonPhrases[level] || commonPhrases.A1;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-3xl border border-ink/10 bg-paper/80 p-4 shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-ink/10 px-3 py-1 text-xs font-semibold">{level}</span>
              <span className="text-sm text-ink/60">{prompt}</span>
            </div>
          </div>
          <button
            onClick={handleNewImage}
            disabled={loading || !prompt.trim()}
            className="rounded-full border border-ink/20 px-4 py-2 text-xs font-semibold text-ink hover:bg-ink/5 disabled:opacity-50"
          >
            {t.workbook.newPhoto}
          </button>
        </div>
      </div>

      {/* Main Content - Vertical Split */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Left: Image */}
        <div className="rounded-3xl border border-ink/10 bg-paper/80 p-4 shadow-soft">
          {loading ? (
            <div className="flex min-h-[400px] items-center justify-center">
              <Loader label={t.common.loading} size="md" />
            </div>
          ) : image ? (
            <div className="space-y-3">
              <div className="relative overflow-hidden rounded-2xl border border-ink/10 bg-paper">
                <div className={`relative ${isFullscreen ? 'aspect-auto h-[600px]' : 'aspect-[4/3]'} w-full`}>
                  <Image
                    src={image.url}
                    alt={image.alt || "Unsplash"}
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-xs text-ink/60">
                  {t.workbook.photoLabel}{" "}
                  {image.authorUrl ? (
                    <a className="underline underline-offset-4" href={image.authorUrl} target="_blank" rel="noreferrer">
                      {image.author || "Unsplash"}
                    </a>
                  ) : (
                    <span>{image.author || "Unsplash"}</span>
                  )}
                </div>
                <button
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="rounded-full border border-ink/10 p-2 hover:bg-ink/5"
                  title={isFullscreen ? t.workbook.collapseImage : t.workbook.collapseImage}
                >
                  <ArrowsOutSimple size={16} />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex min-h-[400px] items-center justify-center">
              <p className="text-sm text-terracotta">{error || t.workbook.noImage}</p>
            </div>
          )}
        </div>

        {/* Right: Description Input */}
        <div className="space-y-4">
          {/* Hints */}
          <div className="rounded-3xl border border-ink/10 bg-paper/80 p-4 shadow-soft">
            <button
              onClick={() => setShowHints(!showHints)}
              className="flex w-full items-center gap-2 text-left"
            >
              <Lightbulb size={20} className="text-amber" />
              <span className="text-sm font-semibold">{t.workbook.hintsLabel}</span>
              <span className="ml-auto text-xs text-ink/40">{showHints ? "−" : "+"}</span>
            </button>

            {showHints && (
              <div className="mt-3 space-y-2 text-xs text-ink/60">
                <p>• {t.workbook.hintDescribe}</p>
                <p>• {t.workbook.hintDetails}</p>
                <p>• {t.workbook.hintColors}</p>
                <p>• {t.workbook.hintAtmosphere}</p>
              </div>
            )}
          </div>

          {/* Quick Phrases */}
          <div className="rounded-3xl border border-ink/10 bg-paper/80 p-4 shadow-soft">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink/60">
              {t.workbook.quickPhrases}
            </p>
            <div className="flex flex-wrap gap-2">
              {phrases.map((phrase, idx) => (
                <button
                  key={idx}
                  onClick={() => insertPhrase(phrase)}
                  className="rounded-full border border-ink/10 bg-paper px-3 py-1.5 text-xs hover:bg-ink/5"
                >
                  {phrase}
                </button>
              ))}
            </div>
          </div>

          {/* Text Input */}
          <div className="rounded-3xl border border-ink/10 bg-paper/80 p-4 shadow-soft">
            <label className="block text-sm text-ink/70">
              {t.workbook.yourDescription}
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                className="mt-2 min-h-[220px] w-full rounded-2xl border border-ink/20 bg-paper px-4 py-3 text-sm resize-none"
                placeholder={t.workbook.descPlaceholder}
              />
            </label>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                onClick={handleCheck}
                disabled={checking || !description.trim() || !image}
                className="flex items-center gap-2 rounded-full bg-ink px-6 py-2 text-sm font-semibold text-paper disabled:opacity-50"
              >
                <Sparkle size={16} weight="fill" />
                {checking ? t.workbook.aiChecking : t.workbook.checkButton}
              </button>
              {points !== null && (
                <span className="text-sm font-semibold text-moss">+{points} {t.workbook.points}</span>
              )}
              {error && <span className="text-sm text-terracotta">{error}</span>}
            </div>
          </div>

        </div>
      </div>

      {/* Vocabulary Suggestions */}
      {suggested.length > 0 && (
        <VocabSuggestions
          suggestions={suggested}
          onAdd={async (pl, uk) => addVocabWord({ pl, uk })}
          onAddAll={addAllVocab}
          title={t.workbook.recommendedWords}
        />
      )}

      {/* Result Modal */}
      <DescribeResultModal
        isOpen={showResultModal}
        result={result}
        points={points || 0}
        onClose={handleCloseModal}
        onTryAgain={handleTryAgain}
      />
    </div>
  );
}
