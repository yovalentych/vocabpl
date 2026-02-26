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
  ArrowRight
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

  const quickActions = [
    {
      id: "browse",
      title: t.dict.browseDictionary,
      description: t.dict.learnFromCards,
      icon: BookOpen,
      color: "moss",
      path: "/class/dict/browse"
    },
    {
      id: "trainer",
      title: t.dict.wordTrainer,
      description: t.dict.interactiveExercises,
      icon: Lightning,
      color: "gold",
      path: "/class/dict/trainer"
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

      {/* Quick Actions */}
      <div>
        <h2 className="mb-4 text-xl font-semibold text-ink">{t.dict.quickActions}</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            const colorClasses = {
              moss: "border-moss/20 bg-moss/5 hover:border-moss/30 hover:bg-moss/10 text-moss",
              gold: "border-gold/20 bg-gold/5 hover:border-gold/30 hover:bg-gold/10 text-gold",
              terracotta:
                "border-terracotta/20 bg-terracotta/5 hover:border-terracotta/30 hover:bg-terracotta/10 text-terracotta"
            }[action.color];

            return (
              <button
                key={action.id}
                onClick={() => navigate(action.path)}
                className={`group rounded-3xl border p-6 text-left shadow-soft transition ${colorClasses}`}
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
