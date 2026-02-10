"use client";

import { useLocale } from "@/components/LocaleProvider";
import { PuzzlePiece, Sparkle, BookOpen, TrendUp } from "@phosphor-icons/react";
import { useState, useEffect } from "react";

interface ClozeLandingProps {
  onSelectMode: (mode: "classic" | "ai") => void;
}

export default function ClozeLanding({ onSelectMode }: ClozeLandingProps) {
  const { t } = useLocale();
  const [stats, setStats] = useState({
    totalAttempts: 0,
    averageScore: 0,
    totalGaps: 0,
    bestStreak: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load user stats for this exercise
    async function loadStats() {
      try {
        const res = await fetch("/api/exercises?exercise=cloze");
        if (res.ok) {
          const data = await res.json();
          setStats({
            totalAttempts: data.attempts || 0,
            averageScore: data.avgScore || 0,
            totalGaps: data.totalGaps || 0,
            bestStreak: data.bestStreak || 0
          });
        }
      } catch (error) {
        console.error("Failed to load stats:", error);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="rounded-3xl border border-gold/20 bg-gold/5 p-8 shadow-soft">
        <div className="flex items-start gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gold/20">
            <PuzzlePiece size={32} weight="fill" className="text-gold" />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-semibold text-ink">
              {t.workbook.exercises.cloze.title}
            </h1>
            <p className="mt-2 text-sm text-ink/70">
              {t.workbook.exercises.cloze.description}
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
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gold/10">
              <span className="text-lg">📖</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-ink">Розуміння контексту</p>
              <p className="mt-1 text-xs text-ink/60">
                Вибір правильного слова за змістом речення
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-2xl border border-ink/10 bg-fog p-4">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-moss/10">
              <span className="text-lg">⚙️</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-ink">Граматична точність</p>
              <p className="mt-1 text-xs text-ink/60">
                Правильні форми слів та відмінки
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-2xl border border-ink/10 bg-fog p-4">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-terracotta/10">
              <span className="text-lg">🔤</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-ink">Правопис</p>
              <p className="mt-1 text-xs text-ink/60">
                Точне написання польських слів
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-2xl border border-ink/10 bg-fog p-4">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gold/10">
              <span className="text-lg">💡</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-ink">Логічне мислення</p>
              <p className="mt-1 text-xs text-ink/60">
                Аналіз та вибір оптимального варіанту
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* User statistics */}
      {!loading && stats.totalAttempts > 0 && (
        <div className="rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft">
          <p className="text-xs uppercase tracking-[0.3em] text-ink/40 mb-4">
            Ваша статистика
          </p>
          <div className="grid gap-4 sm:grid-cols-4">
            <div className="rounded-2xl border border-ink/10 bg-fog p-4 text-center">
              <div className="text-2xl font-bold text-gold">{stats.totalAttempts}</div>
              <div className="mt-1 text-xs text-ink/60">Спроб</div>
            </div>
            <div className="rounded-2xl border border-ink/10 bg-fog p-4 text-center">
              <div className="text-2xl font-bold text-moss">
                {Math.round(stats.averageScore * 100)}%
              </div>
              <div className="mt-1 text-xs text-ink/60">Середній бал</div>
            </div>
            <div className="rounded-2xl border border-ink/10 bg-fog p-4 text-center">
              <div className="text-2xl font-bold text-terracotta">{stats.totalGaps}</div>
              <div className="mt-1 text-xs text-ink/60">Пропусків заповнено</div>
            </div>
            <div className="rounded-2xl border border-ink/10 bg-fog p-4 text-center">
              <div className="text-2xl font-bold text-gold">{stats.bestStreak}</div>
              <div className="mt-1 text-xs text-ink/60">Найкраща серія</div>
            </div>
          </div>
        </div>
      )}

      {/* Mode selection */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Classic mode */}
        <button
          onClick={() => onSelectMode("classic")}
          className="group rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft transition hover:border-gold/30 hover:bg-gold/5 text-left"
        >
          <div className="flex items-start justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gold/10 transition group-hover:scale-110">
              <BookOpen size={24} weight="fill" className="text-gold" />
            </div>
            <div className="rounded-full bg-gold/10 px-3 py-1 text-xs font-semibold text-gold">
              Класичний
            </div>
          </div>

          <h3 className="mt-4 text-xl font-semibold text-ink">
            Класичний режим
          </h3>
          <p className="mt-2 text-sm text-ink/60">
            Заповнюйте пропуски в готових реченнях з підказками.
            Ідеально для закріплення граматики та словникового запасу.
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full bg-fog px-3 py-1 text-xs text-ink/70">
              ✓ Готові речення
            </span>
            <span className="rounded-full bg-fog px-3 py-1 text-xs text-ink/70">
              ✓ Підказки
            </span>
            <span className="rounded-full bg-fog px-3 py-1 text-xs text-ink/70">
              ✓ Швидко
            </span>
          </div>

          <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-gold transition group-hover:gap-3">
            Почати
            <span className="transition">→</span>
          </div>
        </button>

        {/* AI mode */}
        <button
          onClick={() => onSelectMode("ai")}
          className="group rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft transition hover:border-moss/30 hover:bg-moss/5 text-left"
        >
          <div className="flex items-start justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-moss/10 transition group-hover:scale-110">
              <Sparkle size={24} weight="fill" className="text-moss" />
            </div>
            <div className="rounded-full bg-moss/10 px-3 py-1 text-xs font-semibold text-moss">
              AI режим
            </div>
          </div>

          <h3 className="mt-4 text-xl font-semibold text-ink">
            Режим з AI
          </h3>
          <p className="mt-2 text-sm text-ink/60">
            AI створить речення з пропусками на вашу тему та рівень,
            а потім перевірить відповіді з детальним аналізом помилок.
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full bg-fog px-3 py-1 text-xs text-ink/70">
              ✓ AI генерація
            </span>
            <span className="rounded-full bg-fog px-3 py-1 text-xs text-ink/70">
              ✓ Детальна перевірка
            </span>
            <span className="rounded-full bg-fog px-3 py-1 text-xs text-ink/70">
              ✓ Аналіз помилок
            </span>
          </div>

          <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-moss transition group-hover:gap-3">
            Почати
            <span className="transition">→</span>
          </div>
        </button>
      </div>

      {/* Tips */}
      <div className="rounded-2xl border border-gold/20 bg-gold/5 p-4">
        <div className="flex items-start gap-3">
          <TrendUp size={20} weight="fill" className="text-gold flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-gold mb-1">Порада</p>
            <p className="text-xs text-ink/70">
              Перед заповненням пропуску прочитайте все речення. Зверніть увагу на контекст,
              граматичні підказки (рід, число, час) та логічний зв&apos;язок між словами.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
