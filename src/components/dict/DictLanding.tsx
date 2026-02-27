"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { useLocale } from "@/components/LocaleProvider";
import {
  Sparkle,
  BookOpen,
  BookBookmark,
  Lightning,
  ArrowRight,
  Lightning as VerbIcon,
  PaintBrush as AdjectiveIcon,
  Chats as SlangIcon,
  ArrowsClockwise as AspectIcon,
  Heart as FavoritesIcon,
  Smiley as EmotionIcon
} from "@phosphor-icons/react/dist/ssr";
import DictStats from "./DictStats";
import DictAIRecommendations from "./DictAIRecommendations";

interface DictLandingProps {
  onNavigate?: (path: string) => void;
}

interface VocabularyStats {
  totalWords: number;
  learnedWords: number;
  favoriteWords: number;
  customWords: number;
  currentStreak: number;
  longestStreak: number;
  accuracy: number;
  weeklyProgress: number[];
  categoryBreakdown: Record<string, { total: number; learned: number }>;
  dueForReview: number;
}

export default function DictLanding({ onNavigate }: DictLandingProps) {
  const router = useRouter();
  const { t } = useLocale();
  const [stats, setStats] = useState<VocabularyStats | null>(null);
  const [loading, setLoading] = useState(true);

  const navigate = (path: string) => {
    if (onNavigate) {
      onNavigate(path);
    } else {
      router.push(path as Route);
    }
  };

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch("/api/user/vocabulary/stats");
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        } else {
          // Use placeholder data if API doesn't exist yet
          setStats({
            totalWords: 1250,
            learnedWords: 345,
            favoriteWords: 87,
            customWords: 23,
            currentStreak: 7,
            longestStreak: 14,
            accuracy: 78,
            weeklyProgress: [12, 8, 15, 10, 20, 5, 18],
            categoryBreakdown: {
              "Czasowniki": { total: 450, learned: 120 },
              "Przymiotniki": { total: 300, learned: 95 },
              "Rzeczowniki": { total: 400, learned: 110 },
              "Inne": { total: 100, learned: 20 }
            },
            dueForReview: 15
          });
        }
      } catch (error) {
        console.error("Failed to fetch vocabulary stats:", error);
        // Use placeholder data on error
        setStats({
          totalWords: 1250,
          learnedWords: 345,
          favoriteWords: 87,
          customWords: 23,
          currentStreak: 7,
          longestStreak: 14,
          accuracy: 78,
          weeklyProgress: [12, 8, 15, 10, 20, 5, 18],
          categoryBreakdown: {
            "Czasowniki": { total: 450, learned: 120 },
            "Przymiotniki": { total: 300, learned: 95 },
            "Rzeczowniki": { total: 400, learned: 110 },
            "Inne": { total: 100, learned: 20 }
          },
          dueForReview: 15
        });
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  const mainActions = [
    {
      id: "browse",
      title: t.dict.browseDictionary,
      description: t.dict.learnFromCards,
      icon: BookOpen,
      color: "moss",
      path: "/class/dict/browse"
    },
    {
      id: "my-words",
      title: t.dict.myWords,
      description: t.dict.personalDictionary,
      icon: BookBookmark,
      color: "terracotta",
      path: "/class/dict/my-words"
    }
  ];

  const categoryActions = [
    {
      id: "verbs",
      title: t.deck.verbs,
      icon: VerbIcon,
      count: stats?.categoryBreakdown?.["Czasowniki"]?.total || 0,
      path: "/class/dict/browse?type=verbs"
    },
    {
      id: "adjectives",
      title: t.deck.adjectives,
      icon: AdjectiveIcon,
      count: stats?.categoryBreakdown?.["Przymiotniki"]?.total || 0,
      path: "/class/dict/browse?type=adjectives"
    },
    {
      id: "aspect-pairs",
      title: t.deck.aspectPairs,
      icon: AspectIcon,
      count: 0,
      path: "/class/dict/browse?type=aspect_pairs"
    },
    {
      id: "slang",
      title: t.deck.slang,
      icon: SlangIcon,
      count: 0,
      path: "/class/dict/browse?type=slang"
    },
    {
      id: "emotions",
      title: t.deck.cleanEmotions,
      icon: EmotionIcon,
      count: 0,
      path: "/class/dict/browse?type=clean_emotions"
    },
    {
      id: "favorites",
      title: t.deck.favorites,
      icon: FavoritesIcon,
      count: stats?.favoriteWords || 0,
      path: "/class/dict/browse?type=favorites"
    }
  ];

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-moss border-t-transparent" />
          <p className="text-sm text-ink/60">{t.common.loading}</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <p className="text-ink/60">{t.dict.loadStatsFailed}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 rounded-full border border-ink/20 px-4 py-2 text-sm font-semibold text-ink transition hover:bg-ink/5"
          >
            {t.common.retry}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero Banner */}
      <div className="rounded-3xl border border-ink/10 bg-gradient-to-br from-moss/10 to-gold/10 p-8 shadow-soft">
        <div className="space-y-4">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-moss/20 bg-paper/80 px-4 py-2">
            <Sparkle size={16} weight="fill" className="text-gold" />
            <span className="text-xs font-semibold text-ink">
              AI-Enhanced Dictionary
            </span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl font-bold text-ink">{t.dict.yourPersonalDictionary}</h1>

          {/* Quick Stats */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-ink/70">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-ink">{stats.totalWords}</span>
              <span>{t.dict.wordsAvailable}</span>
            </div>
            <span className="text-ink/30">•</span>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-moss">{stats.learnedWords}</span>
              <span>{t.dict.learned}</span>
            </div>
            <span className="text-ink/30">•</span>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gold">{stats.favoriteWords}</span>
              <span>{t.dict.inFavorites}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Dashboard */}
      <div>
        <h2 className="mb-4 text-xl font-semibold text-ink">{t.dict.yourStats}</h2>
        <DictStats stats={stats} />
      </div>

      {/* Featured: Word Trainer */}
      <div>
        <h2 className="mb-4 text-xl font-semibold text-ink">{t.dict.wordTrainer}</h2>
        <button
          onClick={() => navigate("/class/dict/trainer")}
          className="group relative w-full overflow-hidden rounded-3xl border border-gold/30 bg-gradient-to-br from-gold/20 via-gold/10 to-gold/5 p-8 text-left shadow-lg transition hover:shadow-xl hover:scale-[1.02]"
        >
          {/* Background decoration */}
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gold/20 blur-3xl" />
          <div className="absolute -left-8 -bottom-8 h-32 w-32 rounded-full bg-lightning/10 blur-3xl" />

          <div className="relative flex items-center justify-between">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-paper/80 px-4 py-2 mb-4">
                <Lightning size={16} weight="fill" className="text-gold" />
                <span className="text-xs font-semibold text-gold">
                  Інтерактивний тренажер
                </span>
              </div>

              <h3 className="text-2xl font-bold text-ink mb-2">
                {t.dict.interactiveExercises}
              </h3>
              <p className="text-ink/70 max-w-xl">
                Вивчайте слова через різні типи вправ: вибір варіантів, введення тексту або флешкартки.
                Персоналізовані тренування для швидшого запам&apos;ятовування.
              </p>

              <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-gold transition group-hover:gap-3">
                Почати тренування
                <ArrowRight size={16} weight="bold" />
              </div>
            </div>

            <div className="hidden lg:flex h-24 w-24 items-center justify-center rounded-3xl bg-gold/20 transition group-hover:scale-110 group-hover:rotate-6">
              <Lightning size={48} weight="fill" className="text-gold" />
            </div>
          </div>
        </button>
      </div>

      {/* Main Actions */}
      <div>
        <h2 className="mb-4 text-xl font-semibold text-ink">{t.dict.quickActions}</h2>
        <div className="grid gap-6 sm:grid-cols-2">
          {mainActions.map((action) => {
            const Icon = action.icon;
            const colorClasses = {
              moss: "border-moss/20 bg-moss/5 hover:border-moss/30 hover:bg-moss/10 text-moss",
              terracotta:
                "border-terracotta/20 bg-terracotta/5 hover:border-terracotta/30 hover:bg-terracotta/10 text-terracotta"
            }[action.color];

            return (
              <button
                key={action.id}
                onClick={() => navigate(action.path)}
                className={`group rounded-3xl border p-6 text-left shadow-soft transition hover:-translate-y-1 ${colorClasses}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-paper/80 transition group-hover:scale-110">
                    <Icon size={24} weight="fill" />
                  </div>
                </div>

                <h3 className="mt-4 text-lg font-semibold text-ink">
                  {action.title}
                </h3>
                <p className="mt-2 text-sm text-ink/60">{action.description}</p>

                <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold transition group-hover:gap-3">
                  {t.dict.openAction}
                  <ArrowRight size={16} weight="bold" className="transition" />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Browse by Category */}
      <div>
        <h2 className="mb-4 text-xl font-semibold text-ink">Категорії словника</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categoryActions.map((category) => {
            const Icon = category.icon;

            return (
              <button
                key={category.id}
                onClick={() => navigate(category.path)}
                className="group flex items-center gap-4 rounded-2xl border border-ink/10 bg-paper/95 p-4 text-left shadow-soft transition hover:border-moss/30 hover:bg-moss/5 hover:-translate-y-0.5"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-moss/10 text-moss transition group-hover:scale-110">
                  <Icon size={20} weight="fill" />
                </div>

                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-ink">
                    {category.title}
                  </h3>
                  {category.count > 0 && (
                    <p className="text-xs text-ink/50">
                      {category.count} слів
                    </p>
                  )}
                </div>

                <ArrowRight size={16} weight="bold" className="text-ink/30 transition group-hover:text-moss group-hover:translate-x-1" />
              </button>
            );
          })}
        </div>
      </div>

      {/* AI Recommendations */}
      {stats && stats.learnedWords > 5 && (
        <DictAIRecommendations
          learnedWords={[]}
          level={(stats.learnedWords < 50 ? "A1" : stats.learnedWords < 150 ? "A2" : stats.learnedWords < 300 ? "B1" : "B2") as "A1" | "A2" | "B1" | "B2"}
        />
      )}

      {/* Recent Words Section */}
      <div>
        <h2 className="mb-4 text-xl font-semibold text-ink">
          {t.dict.recentlyStudied}
        </h2>
        <div className="rounded-3xl border border-ink/10 bg-paper/95 p-6 shadow-soft">
          <p className="text-center text-sm text-ink/60">
            {t.dict.recentlyStudiedEmpty}
          </p>
        </div>
      </div>

      {/* Due for Review */}
      {stats.dueForReview > 0 && (
        <div>
          <h2 className="mb-4 text-xl font-semibold text-ink">
            {t.dict.readyToRepeat}
          </h2>
          <div className="rounded-3xl border border-terracotta/20 bg-gradient-to-br from-terracotta/10 to-terracotta/5 p-6 shadow-soft">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-ink">
                  {stats.dueForReview} {t.dict.wordsWaitingForYou}
                </h3>
                <p className="mt-1 text-sm text-ink/60">
                  {t.dict.repeatNow}
                </p>
              </div>
              <button
                onClick={() => navigate("/class/dict/trainer")}
                className="rounded-full bg-terracotta px-6 py-3 text-sm font-semibold text-paper transition hover:bg-terracotta/90"
              >
                {t.dict.startRepetition}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
