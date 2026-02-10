"use client";

import { useState, useEffect } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { Star, Eye, Clock, BookOpen, Download } from "@phosphor-icons/react";

interface VideoPlayerProps {
  videoId: string;
  onBack: () => void;
}

interface VideoData {
  id: string;
  title: string;
  titleUk: string;
  description: string;
  descriptionUk: string;
  videoUrl: string;
  provider: "youtube" | "vimeo" | "custom";
  duration: number;
  level: string;
  tags: string[];
  transcript?: string;
  transcriptUk?: string;
  vocabulary?: Array<{
    word: string;
    translation: string;
    timestamp: number;
  }>;
  isFavorite?: boolean;
  isWatched?: boolean;
}

export default function VideoPlayer({ videoId, onBack }: VideoPlayerProps) {
  const { locale } = useLocale();
  const [video, setVideo] = useState<VideoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTranscript, setShowTranscript] = useState(false);
  const [showVocabulary, setShowVocabulary] = useState(false);

  useEffect(() => {
    async function loadVideo() {
      try {
        const res = await fetch(`/api/video/${videoId}`);
        if (res.ok) {
          const data = await res.json();
          setVideo(data.video);

          // Mark as viewed
          fetch(`/api/video/${videoId}/view`, { method: "POST" }).catch(() => {});
        }
      } catch (error) {
        console.error("Failed to load video:", error);
      } finally {
        setLoading(false);
      }
    }
    loadVideo();
  }, [videoId]);

  const toggleFavorite = async () => {
    if (!video) return;
    try {
      const res = await fetch(`/api/video/${videoId}/favorite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFavorite: !video.isFavorite })
      });
      if (res.ok) {
        setVideo({ ...video, isFavorite: !video.isFavorite });
      }
    } catch (error) {
      console.error("Failed to toggle favorite:", error);
    }
  };

  const getEmbedUrl = (url: string, provider: string) => {
    if (provider === "youtube") {
      // Extract video ID from various YouTube URL formats
      const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
      const match = url.match(youtubeRegex);
      if (match && match[1]) {
        return `https://www.youtube.com/embed/${match[1]}?rel=0&modestbranding=1`;
      }
    } else if (provider === "vimeo") {
      // Extract video ID from Vimeo URL
      const vimeoRegex = /vimeo\.com\/(\d+)/;
      const match = url.match(vimeoRegex);
      if (match && match[1]) {
        return `https://player.vimeo.com/video/${match[1]}`;
      }
    }
    return url;
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-terracotta border-t-transparent" />
          <p className="text-sm text-ink/60">Завантаження відео...</p>
        </div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="rounded-3xl border border-ink/10 bg-paper/80 p-12 text-center shadow-soft">
        <p className="text-sm text-ink/60">Відео не знайдено</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Video Player */}
      <div className="rounded-3xl border border-ink/10 bg-paper/80 overflow-hidden shadow-soft">
        <div className="relative aspect-video bg-ink">
          <iframe
            src={getEmbedUrl(video.videoUrl, video.provider)}
            title={locale === "uk" ? video.titleUk : video.title}
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>

        {/* Video Info */}
        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-2xl font-semibold text-ink">
                {locale === "uk" ? video.titleUk : video.title}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-ink/60">
                <div className="flex items-center gap-1">
                  <Clock size={16} />
                  <span>{Math.floor(video.duration / 60)}хв</span>
                </div>
                <div className="flex items-center gap-1">
                  <Eye size={16} />
                  <span>Переглядів</span>
                </div>
                <div className="rounded-full bg-moss/10 px-3 py-1 text-xs font-semibold text-moss">
                  {video.level}
                </div>
              </div>
            </div>

            {/* Favorite button */}
            <button
              onClick={toggleFavorite}
              className={`flex h-10 w-10 items-center justify-center rounded-full border transition ${
                video.isFavorite
                  ? "border-gold bg-gold/10 text-gold"
                  : "border-ink/20 text-ink/40 hover:border-gold/30 hover:bg-gold/5 hover:text-gold"
              }`}
            >
              <Star size={20} weight={video.isFavorite ? "fill" : "regular"} />
            </button>
          </div>

          {/* Description */}
          <p className="mt-4 text-sm text-ink/70 leading-relaxed">
            {locale === "uk" ? video.descriptionUk : video.description}
          </p>

          {/* Tags */}
          {video.tags && video.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {video.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="rounded-full bg-ink/5 px-3 py-1 text-xs text-ink/70"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Transcript */}
      {video.transcript && (
        <div className="rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft">
          <button
            onClick={() => setShowTranscript(!showTranscript)}
            className="flex w-full items-center justify-between text-left"
          >
            <div className="flex items-center gap-2">
              <BookOpen size={20} weight="bold" className="text-moss" />
              <h3 className="text-lg font-semibold text-ink">Транскрипт</h3>
            </div>
            <span className="text-sm text-ink/60">
              {showTranscript ? "Сховати" : "Показати"}
            </span>
          </button>

          {showTranscript && (
            <div className="mt-4 rounded-2xl border border-ink/10 bg-fog p-4 max-h-96 overflow-y-auto">
              <p className="text-sm text-ink leading-relaxed whitespace-pre-line">
                {locale === "uk" && video.transcriptUk ? video.transcriptUk : video.transcript}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Vocabulary */}
      {video.vocabulary && video.vocabulary.length > 0 && (
        <div className="rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft">
          <button
            onClick={() => setShowVocabulary(!showVocabulary)}
            className="flex w-full items-center justify-between text-left"
          >
            <div className="flex items-center gap-2">
              <Download size={20} weight="bold" className="text-gold" />
              <h3 className="text-lg font-semibold text-ink">
                Корисні слова ({video.vocabulary.length})
              </h3>
            </div>
            <span className="text-sm text-ink/60">
              {showVocabulary ? "Сховати" : "Показати"}
            </span>
          </button>

          {showVocabulary && (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {video.vocabulary.map((item, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-ink/10 bg-fog p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-moss">{item.word}</p>
                      <p className="mt-1 text-sm text-ink/70">{item.translation}</p>
                    </div>
                    <span className="text-xs text-ink/40">
                      {Math.floor(item.timestamp / 60)}:{(item.timestamp % 60).toString().padStart(2, "0")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
