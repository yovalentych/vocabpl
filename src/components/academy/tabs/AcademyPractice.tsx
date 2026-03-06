"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useLocale } from "@/components/LocaleProvider";
import {
  PencilLine,
  Target,
  PuzzlePiece,
  Translate,
  ChatCircle,
  NotePencil,
  Article,
  BookOpen,
  BookBookmark,
  TestTube,
  Trophy,
  ChartLineUp,
  Sparkle,
} from "@phosphor-icons/react";
import type { Route } from "next";

const AI_EXERCISES = [
  { key: "sentences", href: "/class/workbook/sentences", icon: PencilLine, color: "bg-moss/10 text-moss border-moss/20" },
  { key: "cloze",     href: "/class/workbook/cloze",     icon: Target,      color: "bg-gold/10 text-gold border-gold/20" },
  { key: "match",     href: "/class/workbook/match",     icon: PuzzlePiece, color: "bg-terracotta/10 text-terracotta border-terracotta/20" },
  { key: "translate", href: "/class/workbook/translate", icon: Translate,   color: "bg-moss/10 text-moss border-moss/20" },
  { key: "dialogue",  href: "/class/workbook/dialogue",  icon: ChatCircle,  color: "bg-gold/10 text-gold border-gold/20" },
  { key: "paraphrase",href: "/class/workbook/paraphrase",icon: NotePencil,  color: "bg-terracotta/10 text-terracotta border-terracotta/20" },
  { key: "story",     href: "/class/workbook/story",     icon: Article,     color: "bg-moss/10 text-moss border-moss/20" },
  { key: "describe",  href: "/class/workbook/describe",  icon: BookOpen,    color: "bg-gold/10 text-gold border-gold/20" },
];

const OTHER_TOOLS = [
  { key: "dict",      href: "/class/dict",        icon: BookBookmark, color: "bg-terracotta/10 text-terracotta" },
  { key: "tests",     href: "/class/tests",        icon: TestTube,     color: "bg-moss/10 text-moss" },
  { key: "reading",   href: "/class/reading",      icon: BookOpen,     color: "bg-gold/20 text-gold" },
];

export default function AcademyPractice() {
  const { locale } = useLocale();
  const [stats, setStats] = useState<{ totalPoints: number; attemptsCount: number } | null>(null);

  useEffect(() => {
    fetch("/api/user/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.user?.stats) {
          setStats({
            totalPoints: d.user.stats.points || 0,
            attemptsCount: d.user.stats.wordsStudied || 0,
          });
        }
      })
      .catch(() => {});
  }, []);

  const labels: Record<string, { uk: string; pl: string }> = {
    sentences:  { uk: "Речення з AI",   pl: "Zdania z AI" },
    cloze:      { uk: "Пропуски з AI",  pl: "Luki z AI" },
    match:      { uk: "Пари з AI",      pl: "Pary z AI" },
    translate:  { uk: "Переклади з AI", pl: "Tłumaczenia z AI" },
    dialogue:   { uk: "Діалог з AI",    pl: "Dialog z AI" },
    paraphrase: { uk: "Перефраз з AI",  pl: "Parafraza z AI" },
    story:      { uk: "Історія з AI",   pl: "Historia z AI" },
    describe:   { uk: "Опис з AI",      pl: "Opis z AI" },
    dict:       { uk: "Словник",        pl: "Słownik" },
    tests:      { uk: "Тести",          pl: "Testy" },
    reading:    { uk: "Читання",        pl: "Czytanie" },
  };

  function label(key: string) {
    return locale === "pl" ? labels[key]?.pl : labels[key]?.uk;
  }

  return (
    <div className="space-y-8">
      {/* Stats */}
      {stats && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex items-center gap-4 rounded-[20px] border border-moss/20 bg-moss/5 px-6 py-4">
            <Trophy size={28} weight="fill" className="shrink-0 text-moss" />
            <div>
              <div className="text-xs uppercase tracking-wider text-ink/50">
                {locale === "pl" ? "Zdobyte punkty" : "Зароблені бали"}
              </div>
              <div className="text-2xl font-semibold text-moss">{stats.totalPoints}</div>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-[20px] border border-terracotta/20 bg-terracotta/5 px-6 py-4">
            <ChartLineUp size={28} weight="fill" className="shrink-0 text-terracotta" />
            <div>
              <div className="text-xs uppercase tracking-wider text-ink/50">
                {locale === "pl" ? "Ukończone ćwiczenia" : "Завершені вправи"}
              </div>
              <div className="text-2xl font-semibold text-terracotta">{stats.attemptsCount}</div>
            </div>
          </div>
        </div>
      )}

      {/* AI Exercises */}
      <div>
        <div className="mb-4 flex items-center gap-2">
          <Sparkle size={18} weight="fill" className="text-gold" />
          <h2 className="font-semibold">
            {locale === "pl" ? "Ćwiczenia z AI" : "Вправи з AI"}
          </h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {AI_EXERCISES.map((ex) => {
            const Icon = ex.icon;
            return (
              <Link
                key={ex.key}
                href={ex.href as Route}
                className={`group rounded-[20px] border p-5 shadow-soft transition-all hover:shadow-md ${ex.color}`}
              >
                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-[12px] bg-paper/80 transition group-hover:scale-105">
                  <Icon size={20} weight="bold" className={ex.color.split(" ")[1]} />
                </div>
                <div className="font-semibold text-sm">{label(ex.key)}</div>
                <div className="mt-1 flex items-center gap-1 text-xs opacity-60">
                  <span>{locale === "pl" ? "Trenuj" : "Тренуйся"}</span>
                  <span className="transition group-hover:translate-x-0.5">→</span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Other tools */}
      <div>
        <h2 className="mb-4 font-semibold text-ink/70">
          {locale === "pl" ? "Inne narzędzia" : "Інші інструменти"}
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {OTHER_TOOLS.map((tool) => {
            const Icon = tool.icon;
            return (
              <Link
                key={tool.key}
                href={tool.href as Route}
                className="group flex items-center gap-4 rounded-[20px] border border-ink/10 bg-paper px-5 py-4 shadow-soft transition-all hover:shadow-md hover:border-ink/20"
              >
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] ${tool.color}`}>
                  <Icon size={20} weight="bold" />
                </div>
                <span className="font-medium">{label(tool.key)}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
