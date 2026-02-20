"use client";

import { useState } from "react";
import { ArrowLeft } from "@phosphor-icons/react";
import Link from "next/link";
import { useLocale } from "@/components/LocaleProvider";
import VideoLanding from "./VideoLanding";
import VideoList from "./VideoList";
import VideoPlayer from "./VideoPlayer";

type Mode = "landing" | "category" | "player";

export default function VideoExercisePage() {
  const { t } = useLocale();
  const [mode, setMode] = useState<Mode>("landing");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);

  const handleSelectCategory = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setMode("category");
  };

  const handleSelectVideo = (videoId: string) => {
    setSelectedVideoId(videoId);
    setMode("player");
  };

  const handleBackToLanding = () => {
    setMode("landing");
    setSelectedCategory(null);
    setSelectedVideoId(null);
  };

  const handleBackToCategory = () => {
    setMode("category");
    setSelectedVideoId(null);
  };

  return (
    <div className="space-y-6">
      {mode !== "landing" && (
        <button
          onClick={mode === "player" ? handleBackToCategory : handleBackToLanding}
          className="inline-flex items-center gap-2 text-sm text-ink/60 transition hover:text-ink"
        >
          <ArrowLeft size={16} weight="bold" />
          <span>{mode === "player" ? t.workbook.backToList : t.workbook.backToCategories}</span>
        </button>
      )}

      {mode === "landing" && (
        <>
          <Link
            href="/class/workbook"
            className="inline-flex items-center gap-2 text-sm text-ink/60 transition hover:text-ink"
          >
            <ArrowLeft size={16} weight="bold" />
            <span>{t.workbook.backToExercises}</span>
          </Link>
          <VideoLanding onSelectCategory={handleSelectCategory} />
        </>
      )}

      {mode === "category" && selectedCategory && (
        <VideoList
          categoryId={selectedCategory}
          onSelectVideo={handleSelectVideo}
        />
      )}

      {mode === "player" && selectedVideoId && (
        <VideoPlayer
          videoId={selectedVideoId}
          onBack={handleBackToCategory}
        />
      )}
    </div>
  );
}
