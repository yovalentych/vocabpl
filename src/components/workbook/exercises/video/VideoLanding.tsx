"use client";

import { useLocale } from "@/components/LocaleProvider";
import { Video, Fire, TrendUp, Users, BookOpen } from "@phosphor-icons/react";
import { useState, useEffect } from "react";
import Image from "next/image";

interface VideoLandingProps {
  onSelectCategory?: (categoryId: string) => void;
}

interface VideoCategory {
  id: string;
  name: string;
  nameUk: string;
  description: string;
  descriptionUk: string;
  icon: string;
  videoCount: number;
}

export default function VideoLanding({ onSelectCategory }: VideoLandingProps) {
  const { t, locale } = useLocale();
  const [categories, setCategories] = useState<VideoCategory[]>([]);
  const [stats, setStats] = useState({
    totalVideos: 0,
    watchedVideos: 0,
    favoriteVideos: 0,
    totalWatchTime: 0
  });
  const [loading, setLoading] = useState(true);
  const [recommendedChannels, setRecommendedChannels] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        // Load categories
        const categoriesRes = await fetch("/api/video/categories");
        if (categoriesRes.ok) {
          const categoriesData = await categoriesRes.json();
          setCategories(categoriesData.categories || []);
        }

        // Load stats
        const statsRes = await fetch("/api/video/stats");
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData);
        }

        // Load recommended channels
        const channelsRes = await fetch("/api/video/channels/recommended");
        if (channelsRes.ok) {
          const channelsData = await channelsRes.json();
          setRecommendedChannels(channelsData.channels || []);
        }
      } catch (error) {
        console.error("Failed to load video data:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}г ${mins}хв`;
    }
    return `${mins}хв`;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="rounded-3xl border border-terracotta/20 bg-gradient-to-br from-terracotta/10 to-gold/10 p-8 shadow-soft">
        <div className="flex items-start gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-terracotta/20">
            <Video size={32} weight="fill" className="text-terracotta" />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-semibold text-ink">
              Відео матеріали
            </h1>
            <p className="mt-2 text-sm text-ink/70">
              Дивись відео польською, покращуй розуміння мови на слух
            </p>
          </div>
        </div>
      </div>

      {/* Skills trained */}
      <div className="rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft">
        <p className="text-xs uppercase tracking-[0.3em] text-ink/40 mb-4">
          Навички що тренуються
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex items-start gap-3 rounded-2xl border border-ink/10 bg-fog p-4">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-terracotta/10">
              <span className="text-lg">👂</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-ink">Розуміння на слух</p>
              <p className="mt-1 text-xs text-ink/60">
                Тренування сприйняття живої польської мови
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-2xl border border-ink/10 bg-fog p-4">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-moss/10">
              <span className="text-lg">🗣️</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-ink">Вимова та інтонація</p>
              <p className="mt-1 text-xs text-ink/60">
                Вчись правильній вимові у носіїв мови
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-2xl border border-ink/10 bg-fog p-4">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gold/10">
              <span className="text-lg">🌍</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-ink">Культурний контекст</p>
              <p className="mt-1 text-xs text-ink/60">
                Дізнавайся про Польщу, культуру та традиції
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-2xl border border-ink/10 bg-fog p-4">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-terracotta/10">
              <span className="text-lg">📚</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-ink">Реальна лексика</p>
              <p className="mt-1 text-xs text-ink/60">
                Вивчай слова та вирази з реальних ситуацій
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* User statistics */}
      {!loading && stats.totalVideos > 0 && (
        <div className="rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft">
          <p className="text-xs uppercase tracking-[0.3em] text-ink/40 mb-4">
            Ваша статистика
          </p>
          <div className="grid gap-4 sm:grid-cols-4">
            <div className="rounded-2xl border border-ink/10 bg-fog p-4 text-center">
              <div className="text-2xl font-bold text-terracotta">{stats.watchedVideos}</div>
              <div className="mt-1 text-xs text-ink/60">Переглянуто</div>
            </div>
            <div className="rounded-2xl border border-ink/10 bg-fog p-4 text-center">
              <div className="text-2xl font-bold text-moss">
                {formatTime(stats.totalWatchTime)}
              </div>
              <div className="mt-1 text-xs text-ink/60">Час перегляду</div>
            </div>
            <div className="rounded-2xl border border-ink/10 bg-fog p-4 text-center">
              <div className="text-2xl font-bold text-gold">{stats.favoriteVideos}</div>
              <div className="mt-1 text-xs text-ink/60">В обраному</div>
            </div>
            <div className="rounded-2xl border border-ink/10 bg-fog p-4 text-center">
              <div className="text-2xl font-bold text-terracotta">{stats.totalVideos}</div>
              <div className="mt-1 text-xs text-ink/60">Доступно</div>
            </div>
          </div>
        </div>
      )}

      {/* Categories */}
      {categories.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-ink mb-4">Категорії</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => onSelectCategory?.(category.id)}
                className="group rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft transition hover:border-terracotta/30 hover:bg-terracotta/5 text-left"
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-terracotta/10 text-2xl transition group-hover:scale-110">
                    {category.icon}
                  </div>
                  <div className="rounded-full bg-terracotta/10 px-3 py-1 text-xs font-semibold text-terracotta">
                    {category.videoCount} відео
                  </div>
                </div>

                <h3 className="mt-4 text-lg font-semibold text-ink">
                  {locale === "uk" ? category.nameUk : category.name}
                </h3>
                <p className="mt-2 text-sm text-ink/60">
                  {locale === "uk" ? category.descriptionUk : category.description}
                </p>

                <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-terracotta transition group-hover:gap-3">
                  Дивитись
                  <span className="transition">→</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Recommended Channels */}
      {recommendedChannels.length > 0 && (
        <div className="rounded-3xl border border-moss/20 bg-moss/5 p-6 shadow-soft">
          <div className="flex items-center gap-2 mb-4">
            <Users size={20} weight="fill" className="text-moss" />
            <h3 className="text-lg font-semibold text-ink">Рекомендовані канали</h3>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {recommendedChannels.map((channel, idx) => (
              <a
                key={idx}
                href={channel.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-2xl border border-ink/10 bg-paper p-3 transition hover:border-moss/30 hover:bg-moss/5"
              >
                {channel.thumbnail && (
                  <Image
                    src={channel.thumbnail}
                    alt={channel.name}
                    width={40}
                    height={40}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-ink truncate">{channel.name}</p>
                  <p className="text-xs text-ink/60 truncate">{channel.description}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="rounded-2xl border border-terracotta/20 bg-terracotta/5 p-4">
        <div className="flex items-start gap-3">
          <TrendUp size={20} weight="fill" className="text-terracotta flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-terracotta mb-1">Порада</p>
            <p className="text-xs text-ink/70">
              Спочатку подивись відео без субтитрів, потім з польськими, а потім ще раз без.
              Це допоможе краще зрозуміти та запам&apos;ятати нову лексику!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
