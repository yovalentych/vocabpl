"use client";

import { useState, useEffect } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { Video, Clock, Star, Eye } from "@phosphor-icons/react";
import Image from "next/image";

interface VideoListProps {
  categoryId: string;
  onSelectVideo: (videoId: string) => void;
}

interface VideoItem {
  id: string;
  title: string;
  titleUk: string;
  description: string;
  descriptionUk: string;
  thumbnail: string;
  duration: number;
  level: string;
  views: number;
  isFavorite?: boolean;
  isWatched?: boolean;
}

export default function VideoList({ categoryId, onSelectVideo }: VideoListProps) {
  const { locale } = useLocale();
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryName, setCategoryName] = useState("");

  useEffect(() => {
    async function loadVideos() {
      try {
        const res = await fetch(`/api/video/category/${categoryId}`);
        if (res.ok) {
          const data = await res.json();
          setVideos(data.videos || []);
          setCategoryName(locale === "uk" ? data.category?.nameUk : data.category?.name);
        }
      } catch (error) {
        console.error("Failed to load videos:", error);
      } finally {
        setLoading(false);
      }
    }
    loadVideos();
  }, [categoryId, locale]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
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

  return (
    <div className="space-y-6 sm:space-y-6 pb-8">
      {/* Header */}
      <div className="rounded-3xl border border-ink/10 bg-paper/80 p-6 sm:p-6 shadow-soft">
        <h2 className="text-2xl sm:text-2xl font-bold sm:font-semibold text-ink">{categoryName}</h2>
        <p className="mt-2 text-base sm:text-sm text-ink/60 font-medium sm:font-normal">{videos.length} відео доступно</p>
      </div>

      {/* Videos Grid */}
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {videos.map((video) => (
          <button
            key={video.id}
            onClick={() => onSelectVideo(video.id)}
            className="group rounded-3xl border-2 border-ink/10 bg-paper/80 overflow-hidden shadow-soft transition-all active:scale-[0.98] hover:border-terracotta/30 hover:shadow-md text-left"
          >
            {/* Thumbnail */}
            <div className="relative aspect-video overflow-hidden bg-ink/5">
              {video.thumbnail ? (
                <Image
                  src={video.thumbnail}
                  alt={locale === "uk" ? video.titleUk : video.title}
                  fill
                  className="object-cover transition group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <Video size={56} weight="fill" className="text-ink/20 sm:w-12 sm:h-12" />
                </div>
              )}

              {/* Duration badge */}
              <div className="absolute bottom-3 right-3 sm:bottom-2 sm:right-2 rounded-xl sm:rounded-lg bg-ink/85 px-3 py-1.5 sm:px-2 sm:py-1 text-sm sm:text-xs font-bold sm:font-semibold text-paper backdrop-blur">
                {formatDuration(video.duration)}
              </div>

              {/* Watched badge */}
              {video.isWatched && (
                <div className="absolute top-3 left-3 sm:top-2 sm:left-2 rounded-full bg-moss/95 px-3 py-1.5 sm:px-2 sm:py-1 text-sm sm:text-xs font-bold sm:font-semibold text-paper backdrop-blur shadow-md">
                  ✓ Переглянуто
                </div>
              )}

              {/* Favorite star */}
              {video.isFavorite && (
                <div className="absolute top-3 right-3 sm:top-2 sm:right-2">
                  <Star size={24} weight="fill" className="text-gold drop-shadow-lg sm:w-5 sm:h-5" />
                </div>
              )}
            </div>

            {/* Content */}
            <div className="p-5 sm:p-4">
              <h3 className="text-lg sm:text-base font-bold sm:font-semibold text-ink line-clamp-2 leading-snug">
                {locale === "uk" ? video.titleUk : video.title}
              </h3>
              <p className="mt-3 sm:mt-2 text-sm sm:text-xs text-ink/60 line-clamp-2 leading-relaxed">
                {locale === "uk" ? video.descriptionUk : video.description}
              </p>

              {/* Meta */}
              <div className="mt-4 sm:mt-3 flex items-center gap-4 sm:gap-3 text-sm sm:text-xs text-ink/60">
                <div className="flex items-center gap-1.5 sm:gap-1">
                  <Clock size={16} className="sm:w-[14px] sm:h-[14px]" />
                  <span className="font-medium sm:font-normal">{formatDuration(video.duration)}</span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-1">
                  <Eye size={16} className="sm:w-[14px] sm:h-[14px]" />
                  <span className="font-medium sm:font-normal">{video.views}</span>
                </div>
                <div className="rounded-full bg-moss/10 px-3 py-1 sm:px-2 sm:py-0.5 text-sm sm:text-xs font-bold sm:font-semibold text-moss">
                  {video.level}
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>

      {videos.length === 0 && (
        <div className="rounded-3xl border border-ink/10 bg-paper/80 p-8 sm:p-12 text-center shadow-soft">
          <Video size={40} weight="fill" className="mx-auto text-ink/20 sm:w-12 sm:h-12" />
          <p className="mt-4 text-sm text-ink/60">
            Поки що немає відео в цій категорії
          </p>
        </div>
      )}
    </div>
  );
}
