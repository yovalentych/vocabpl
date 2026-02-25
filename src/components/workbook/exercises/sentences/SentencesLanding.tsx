"use client";

import { useLocale } from "@/components/LocaleProvider";
import { PencilLine, Sparkle, BookOpen, TrendUp } from "@phosphor-icons/react";
import { useState, useEffect } from "react";

interface SentencesLandingProps {
  onSelectMode: (mode: "classic" | "ai") => void;
}

export default function SentencesLanding({ onSelectMode }: SentencesLandingProps) {
  const { t } = useLocale();
  const [stats, setStats] = useState({
    totalAttempts: 0,
    averageScore: 0,
    totalSentences: 0,
    bestStreak: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch("/api/exercises?exercise=sentences");
        if (res.ok) {
          const data = await res.json();
          setStats({
            totalAttempts: data.attempts || 0,
            averageScore: data.avgScore || 0,
            totalSentences: data.totalSentences || 0,
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
      <div className="rounded-3xl border border-moss/20 bg-moss/5 p-8 shadow-soft">
        <div className="flex items-start gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-moss/20">
            <PencilLine size={32} weight="fill" className="text-moss" />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-semibold text-ink">
              {t.workbook.exercises.sentences.title}
            </h1>
            <p className="mt-2 text-sm text-ink/70">
              {t.workbook.exercises.sentences.description}
            </p>
          </div>
        </div>
      </div>

      {/* Skills trained */}
      <div className="rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft">
        <p className="text-xs uppercase tracking-[0.3em] text-ink/40 mb-4">
          {t.workbook.landingSkillsTitle}
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex items-start gap-3 rounded-2xl border border-ink/10 bg-fog p-4">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-moss/10">
              <span className="text-lg">📝</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-ink">{t.workbook.sentencesLandingSkill1}</p>
              <p className="mt-1 text-xs text-ink/60">
                {t.workbook.sentencesLandingSkill1Desc}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-2xl border border-ink/10 bg-fog p-4">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gold/10">
              <span className="text-lg">💬</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-ink">{t.workbook.sentencesLandingSkill2}</p>
              <p className="mt-1 text-xs text-ink/60">
                {t.workbook.sentencesLandingSkill2Desc}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-2xl border border-ink/10 bg-fog p-4">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-terracotta/10">
              <span className="text-lg">🎯</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-ink">{t.workbook.sentencesLandingSkill3}</p>
              <p className="mt-1 text-xs text-ink/60">
                {t.workbook.sentencesLandingSkill3Desc}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-2xl border border-ink/10 bg-fog p-4">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-moss/10">
              <span className="text-lg">✍️</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-ink">{t.workbook.sentencesLandingSkill4}</p>
              <p className="mt-1 text-xs text-ink/60">
                {t.workbook.sentencesLandingSkill4Desc}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* User statistics */}
      {!loading && stats.totalAttempts > 0 && (
        <div className="rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft">
          <p className="text-xs uppercase tracking-[0.3em] text-ink/40 mb-4">
            {t.workbook.landingYourStats}
          </p>
          <div className="grid gap-4 sm:grid-cols-4">
            <div className="rounded-2xl border border-ink/10 bg-fog p-4 text-center">
              <div className="text-2xl font-bold text-moss">{stats.totalAttempts}</div>
              <div className="mt-1 text-xs text-ink/60">{t.workbook.landingAttempts}</div>
            </div>
            <div className="rounded-2xl border border-ink/10 bg-fog p-4 text-center">
              <div className="text-2xl font-bold text-gold">
                {Math.round(stats.averageScore * 100)}%
              </div>
              <div className="mt-1 text-xs text-ink/60">{t.workbook.landingAvgScore}</div>
            </div>
            <div className="rounded-2xl border border-ink/10 bg-fog p-4 text-center">
              <div className="text-2xl font-bold text-terracotta">{stats.totalSentences}</div>
              <div className="mt-1 text-xs text-ink/60">{t.workbook.sentencesLandingStat}</div>
            </div>
            <div className="rounded-2xl border border-ink/10 bg-fog p-4 text-center">
              <div className="text-2xl font-bold text-moss">{stats.bestStreak}</div>
              <div className="mt-1 text-xs text-ink/60">{t.workbook.landingBestStreak}</div>
            </div>
          </div>
        </div>
      )}

      {/* Mode selection */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Classic mode */}
        <button
          onClick={() => onSelectMode("classic")}
          className="group rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft transition hover:border-moss/30 hover:bg-moss/5 text-left"
        >
          <div className="flex items-start justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-moss/10 transition group-hover:scale-110">
              <BookOpen size={24} weight="fill" className="text-moss" />
            </div>
            <div className="rounded-full bg-moss/10 px-3 py-1 text-xs font-semibold text-moss">
              {t.workbook.landingClassicTab}
            </div>
          </div>

          <h3 className="mt-4 text-xl font-semibold text-ink">
            {t.workbook.classicMode}
          </h3>
          <p className="mt-2 text-sm text-ink/60">
            {t.workbook.sentencesLandingClassicDesc}
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full bg-fog px-3 py-1 text-xs text-ink/70">
              {t.workbook.featureLearnedWords}
            </span>
            <span className="rounded-full bg-fog px-3 py-1 text-xs text-ink/70">
              {t.workbook.featureNoAI}
            </span>
            <span className="rounded-full bg-fog px-3 py-1 text-xs text-ink/70">
              {t.workbook.featureFast}
            </span>
          </div>

          <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-moss transition group-hover:gap-3">
            {t.workbook.landingStart}
            <span className="transition">→</span>
          </div>
        </button>

        {/* AI mode */}
        <button
          onClick={() => onSelectMode("ai")}
          className="group rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft transition hover:border-gold/30 hover:bg-gold/5 text-left"
        >
          <div className="flex items-start justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gold/10 transition group-hover:scale-110">
              <Sparkle size={24} weight="fill" className="text-gold" />
            </div>
            <div className="rounded-full bg-gold/10 px-3 py-1 text-xs font-semibold text-gold">
              {t.workbook.aiMode}
            </div>
          </div>

          <h3 className="mt-4 text-xl font-semibold text-ink">
            {t.workbook.landingAIModeFull}
          </h3>
          <p className="mt-2 text-sm text-ink/60">
            {t.workbook.sentencesLandingAIDesc}
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full bg-fog px-3 py-1 text-xs text-ink/70">
              {t.workbook.featureAIGen}
            </span>
            <span className="rounded-full bg-fog px-3 py-1 text-xs text-ink/70">
              {t.workbook.featureDetailCheck}
            </span>
            <span className="rounded-full bg-fog px-3 py-1 text-xs text-ink/70">
              {t.workbook.featureFeedbackTag}
            </span>
          </div>

          <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-gold transition group-hover:gap-3">
            {t.workbook.landingStart}
            <span className="transition">→</span>
          </div>
        </button>
      </div>

      {/* Tips */}
      <div className="rounded-2xl border border-moss/20 bg-moss/5 p-4">
        <div className="flex items-start gap-3">
          <TrendUp size={20} weight="fill" className="text-moss flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-moss mb-1">{t.workbook.landingTip}</p>
            <p className="text-xs text-ink/70">
              {t.workbook.sentencesLandingTip}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
