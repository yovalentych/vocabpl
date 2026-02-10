"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { Image as ImageIcon, CaretDown, CaretUp } from "@phosphor-icons/react/dist/ssr";
import Loader from "@/components/ui/Loader";
import NextImage from "next/image";

interface DescribeAttempt {
  _id: string;
  prompt: string;
  level: string;
  imageUrl: string;
  imageAlt?: string;
  description: string;
  score: number;
  points: number;
  feedback?: string;
  improvedPl?: string;
  translationUk?: string;
  createdAt: string;
}

interface Stats {
  totalAttempts: number;
  averageScore: number;
  bestScore: number;
  accuracy: number;
}

export default function DescribeHistory() {
  const { t } = useLocale();
  const [attempts, setAttempts] = useState<DescribeAttempt[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  async function fetchHistory() {
    setLoading(true);
    try {
      const res = await fetch("/api/workbook/describe/attempts");
      if (res.ok) {
        const data = await res.json();
        setAttempts(data.attempts || []);
        setStats(data.stats || null);
      }
    } catch (err) {
      console.error("Failed to load history:", err);
    } finally {
      setLoading(false);
    }
  }

  const toggleExpanded = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader label={t.common.loading} size="md" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      {stats && stats.totalAttempts > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft">
            <div className="flex items-center gap-2">
              <ImageIcon size={20} className="text-ink/40" />
              <span className="text-xs uppercase tracking-wider text-ink/60">
                {t.workbook.describeHistoryAttempts || "Спроб"}
              </span>
            </div>
            <p className="mt-2 text-3xl font-bold">{stats.totalAttempts}</p>
          </div>

          <div className="rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider text-ink/60">
                {t.workbook.describeHistoryAverage || "Середній бал"}
              </span>
            </div>
            <p className="mt-2 text-3xl font-bold text-amber">{stats.averageScore.toFixed(1)}/10</p>
          </div>

          <div className="rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider text-ink/60">
                {t.workbook.describeHistoryBest || "Найкращий"}
              </span>
            </div>
            <p className="mt-2 text-3xl font-bold text-moss">{stats.bestScore}/10</p>
          </div>

          <div className="rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider text-ink/60">
                {t.workbook.describeHistoryAccuracy || "Точність"}
              </span>
            </div>
            <p className="mt-2 text-3xl font-bold">{stats.accuracy}%</p>
          </div>
        </div>
      )}

      {/* History List */}
      <div className="rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft">
        <h3 className="mb-4 flex items-center gap-2 text-xl font-semibold">
          <ImageIcon size={24} />
          {t.workbook.describeHistoryTitle || "Історія перевірок"}
        </h3>

        {attempts.length === 0 ? (
          <div className="py-12 text-center">
            <ImageIcon size={48} className="mx-auto text-ink/20" />
            <p className="mt-4 text-sm text-ink/60">
              {t.workbook.describeHistoryEmpty || "Поки що немає завершених спроб"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {attempts.map((attempt) => {
              const isExpanded = expandedId === attempt._id;
              const date = new Date(attempt.createdAt).toLocaleDateString("uk-UA", {
                day: "numeric",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit"
              });

              return (
                <div
                  key={attempt._id}
                  className="overflow-hidden rounded-2xl border border-ink/10 bg-paper transition-all"
                >
                  {/* Header */}
                  <button
                    onClick={() => toggleExpanded(attempt._id)}
                    className="flex w-full items-center gap-4 p-4 text-left hover:bg-ink/5"
                  >
                    {/* Image Thumbnail */}
                    <div className="relative h-16 w-24 flex-shrink-0 overflow-hidden rounded-lg border border-ink/10">
                      <NextImage
                        src={attempt.imageUrl}
                        alt={attempt.imageAlt || "Image"}
                        fill
                        sizes="96px"
                        className="object-cover"
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-ink/10 px-2 py-0.5 text-xs font-semibold">
                          {attempt.level}
                        </span>
                        <span className="text-sm text-ink/60">{attempt.prompt}</span>
                      </div>
                      <p className="mt-1 text-xs text-ink/40">{date}</p>
                    </div>

                    {/* Score */}
                    <div className="flex-shrink-0 text-right">
                      <p className="text-2xl font-bold text-moss">{attempt.points}/10</p>
                      <p className="text-xs text-ink/40">
                        {t.workbook.describeHistoryScore || "бали"}
                      </p>
                    </div>

                    {/* Expand Icon */}
                    <div className="flex-shrink-0">
                      {isExpanded ? (
                        <CaretUp size={20} className="text-ink/40" />
                      ) : (
                        <CaretDown size={20} className="text-ink/40" />
                      )}
                    </div>
                  </button>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="border-t border-ink/10 bg-paper/50 p-4">
                      <div className="space-y-4">
                        {/* User Description */}
                        <div>
                          <p className="text-xs uppercase tracking-wider text-ink/40">
                            {t.workbook.describeHistoryYourDescription || "Твій опис"}
                          </p>
                          <p className="mt-2 text-sm text-ink/80">{attempt.description}</p>
                        </div>

                        {/* Feedback */}
                        {attempt.feedback && (
                          <div className="rounded-xl border border-ink/10 bg-paper/80 p-3">
                            <p className="text-xs uppercase tracking-wider text-ink/40">
                              {t.workbook.describeHistoryFeedback || "Зворотній зв'язок"}
                            </p>
                            <p className="mt-2 text-sm text-ink/70">{attempt.feedback}</p>
                          </div>
                        )}

                        {/* Improved Version */}
                        {attempt.improvedPl && (
                          <div className="rounded-xl border border-ink/10 bg-paper/80 p-3">
                            <p className="text-xs uppercase tracking-wider text-ink/40">
                              {t.workbook.describeImproved || "Покращена версія"}
                            </p>
                            <p className="mt-2 text-sm text-ink/80">{attempt.improvedPl}</p>
                          </div>
                        )}

                        {/* Translation */}
                        {attempt.translationUk && (
                          <div className="rounded-xl border border-ink/10 bg-paper/80 p-3">
                            <p className="text-xs uppercase tracking-wider text-ink/40">
                              {t.workbook.describeTranslation || "Переклад"}
                            </p>
                            <p className="mt-2 text-sm text-ink/80">{attempt.translationUk}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
