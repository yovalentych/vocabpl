"use client";

import {
  Trophy,
  Fire,
  Target,
  ChartLineUp,
  BookOpen,
  Star,
  Clock
} from "@phosphor-icons/react/dist/ssr";
import { useLocale } from "@/components/LocaleProvider";

interface DictStatsProps {
  stats: {
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
  };
}

export default function DictStats({ stats }: DictStatsProps) {
  const { t } = useLocale();

  const getCategoryLabel = (category: string) => {
    const categoryMap: Record<string, string> = {
      verb: t.deck.verbs,
      adverb: t.deck.adverbs,
      adjective: t.deck.adjectives,
      slang: t.deck.slang,
      others: t.deck.others,
      soft_swears: t.deck.softSwears,
      clean_emotions: t.deck.cleanEmotions,
      abbreviations: t.deck.abbreviations,
      aspect_pairs: t.deck.aspectPairs,
      my_words: t.words.myWords
    };
    return categoryMap[category] || category;
  };

  // Calculate percentage
  const learnedPercentage =
    stats.totalWords > 0
      ? Math.round((stats.learnedWords / stats.totalWords) * 100)
      : 0;

  // Get max weekly value for scaling
  const maxWeekly = Math.max(...stats.weeklyProgress, 1);

  return (
    <div className="space-y-6">
      {/* Hero Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Learned Words */}
        <div className="rounded-3xl border border-moss/20 bg-gradient-to-br from-moss/10 to-moss/5 p-6 shadow-soft">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm text-ink/60">Вивчено слів</p>
              <p className="mt-2 text-3xl font-bold text-ink">
                {stats.learnedWords}
              </p>
              <p className="mt-1 text-xs text-ink/50">
                з {stats.totalWords} ({learnedPercentage}%)
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-moss/20">
              <Trophy size={24} weight="fill" className="text-moss" />
            </div>
          </div>
        </div>

        {/* Current Streak */}
        <div className="rounded-3xl border border-gold/20 bg-gradient-to-br from-gold/10 to-gold/5 p-6 shadow-soft">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm text-ink/60">Поточна серія</p>
              <p className="mt-2 text-3xl font-bold text-ink">
                {stats.currentStreak}
              </p>
              <p className="mt-1 text-xs text-ink/50">
                найкраща: {stats.longestStreak}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gold/20">
              <Fire size={24} weight="fill" className="text-gold" />
            </div>
          </div>
        </div>

        {/* Accuracy */}
        <div className="rounded-3xl border border-terracotta/20 bg-gradient-to-br from-terracotta/10 to-terracotta/5 p-6 shadow-soft">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm text-ink/60">Точність</p>
              <p className="mt-2 text-3xl font-bold text-ink">
                {stats.accuracy}%
              </p>
              <p className="mt-1 text-xs text-ink/50">загальна</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-terracotta/20">
              <Target size={24} weight="fill" className="text-terracotta" />
            </div>
          </div>
        </div>

        {/* Favorites */}
        <div className="rounded-3xl border border-amber-400/20 bg-gradient-to-br from-amber-200/20 to-amber-200/5 p-6 shadow-soft">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm text-ink/60">Улюблені</p>
              <p className="mt-2 text-3xl font-bold text-ink">
                {stats.favoriteWords}
              </p>
              <p className="mt-1 text-xs text-ink/50">
                мої: {stats.customWords}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-200/30">
              <Star size={24} weight="fill" className="text-amber-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Weekly Progress & Categories */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Weekly Progress Chart */}
        <div className="rounded-3xl border border-ink/10 bg-paper/95 p-6 shadow-soft">
          <div className="mb-4 flex items-center gap-3">
            <ChartLineUp size={24} weight="bold" className="text-moss" />
            <h3 className="text-lg font-semibold text-ink">
              Тижневий прогрес
            </h3>
          </div>

          <div className="flex items-end justify-between gap-2">
            {stats.weeklyProgress.map((count, index) => {
              const height = maxWeekly > 0 ? (count / maxWeekly) * 100 : 0;
              const days = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Нд"];

              return (
                <div key={index} className="flex flex-1 flex-col items-center">
                  <div className="relative mb-2 w-full">
                    <div
                      className="w-full rounded-t-lg bg-gradient-to-t from-moss to-moss/60 transition-all"
                      style={{
                        height: `${Math.max(height, 4)}px`,
                        minHeight: count > 0 ? "8px" : "4px"
                      }}
                    />
                  </div>
                  <span className="text-xs text-ink/50">{days[index]}</span>
                  <span className="mt-1 text-xs font-semibold text-ink">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="rounded-3xl border border-ink/10 bg-paper/95 p-6 shadow-soft">
          <div className="mb-4 flex items-center gap-3">
            <BookOpen size={24} weight="bold" className="text-terracotta" />
            <h3 className="text-lg font-semibold text-ink">
              Розподіл по категоріях
            </h3>
          </div>

          <div className="space-y-3">
            {Object.entries(stats.categoryBreakdown).map(
              ([category, data]) => {
                const percentage =
                  data.total > 0
                    ? Math.round((data.learned / data.total) * 100)
                    : 0;

                return (
                  <div key={category}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="text-ink/80">{getCategoryLabel(category)}</span>
                      <span className="font-semibold text-ink">
                        {data.learned} / {data.total}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-ink/5">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-moss to-gold transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              }
            )}
          </div>
        </div>
      </div>

      {/* Due for Review Banner */}
      {stats.dueForReview > 0 && (
        <div className="rounded-3xl border border-terracotta/20 bg-gradient-to-br from-terracotta/10 to-terracotta/5 p-6 shadow-soft">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-terracotta/20">
                <Clock size={24} weight="fill" className="text-terracotta" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-ink">
                  Готово до повторення
                </h3>
                <p className="text-sm text-ink/60">
                  {stats.dueForReview} слів потребують повторення
                </p>
              </div>
            </div>
            <button className="rounded-full bg-terracotta px-6 py-3 text-sm font-semibold text-paper transition hover:bg-terracotta/90">
              Почати повторення
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
