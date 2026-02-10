"use client";

import Link from "next/link";
import type { Route } from "next";
import { useLocale } from "@/components/LocaleProvider";
import {
  PencilLine,
  ChatCircleText,
  ArrowsLeftRight,
  BookOpen,
  PuzzlePiece,
  ShuffleSimple,
  Translate,
  Image,
  ClockClockwise,
  Video
} from "@phosphor-icons/react";
import { useState } from "react";
import WorkbookHistory from "./history/WorkbookHistory";

interface ExerciseCard {
  id: string;
  href: Route;
  title: string;
  description: string;
  icon: typeof PencilLine;
  color: string;
  timeEstimate: string;
}

export default function WorkbookDashboard() {
  const { t } = useLocale();
  const [showHistory, setShowHistory] = useState(false);

  const exercises: ExerciseCard[] = [
    {
      id: "sentences",
      href: "/class/workbook/sentences",
      title: t.workbook.exercises.sentences.title,
      description: t.workbook.exercises.sentences.description,
      icon: PencilLine,
      color: "moss",
      timeEstimate: "10-15 хв"
    },
    {
      id: "cloze",
      href: "/class/workbook/cloze",
      title: t.workbook.exercises.cloze.title,
      description: t.workbook.exercises.cloze.description,
      icon: PuzzlePiece,
      color: "gold",
      timeEstimate: "5-10 хв"
    },
    {
      id: "match",
      href: "/class/workbook/match",
      title: t.workbook.exercises.match.title,
      description: t.workbook.exercises.match.description,
      icon: ShuffleSimple,
      color: "terracotta",
      timeEstimate: "3-5 хв"
    },
    {
      id: "translate",
      href: "/class/workbook/translate",
      title: t.workbook.exercises.translate.title,
      description: t.workbook.exercises.translate.description,
      icon: Translate,
      color: "moss",
      timeEstimate: "10-15 хв"
    },
    {
      id: "dialogue",
      href: "/class/workbook/dialogue",
      title: t.workbook.exercises.dialogue.title,
      description: t.workbook.exercises.dialogue.description,
      icon: ChatCircleText,
      color: "gold",
      timeEstimate: "15-20 хв"
    },
    {
      id: "paraphrase",
      href: "/class/workbook/paraphrase",
      title: t.workbook.exercises.rewrite.title,
      description: t.workbook.exercises.rewrite.description,
      icon: ArrowsLeftRight,
      color: "terracotta",
      timeEstimate: "10-15 хв"
    },
    {
      id: "story",
      href: "/class/workbook/story",
      title: t.workbook.exercises.story.title,
      description: t.workbook.exercises.story.description,
      icon: BookOpen,
      color: "moss",
      timeEstimate: "15-20 хв"
    },
    {
      id: "describe",
      href: "/class/workbook/describe",
      title: t.workbook.exercises.describe.title,
      description: t.workbook.exercises.describe.description,
      icon: Image,
      color: "gold",
      timeEstimate: "10-15 хв"
    },
    {
      id: "video",
      href: "/class/workbook/video",
      title: "Відео",
      description: "Вивчайте польську через відео матеріали.",
      icon: Video,
      color: "terracotta",
      timeEstimate: "15-30 хв"
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-ink">
            {t.workbook.title}
          </h1>
          <p className="mt-1 text-sm text-ink/60">
            {t.workbook.subtitle}
          </p>
        </div>

        {/* History button */}
        <button
          onClick={() => setShowHistory(true)}
          className="inline-flex items-center gap-2 rounded-full border border-ink/20 px-4 py-2 text-xs font-semibold text-ink transition hover:bg-ink/5"
        >
          <ClockClockwise size={16} weight="bold" />
          <span>{t.workbook.tabs?.history || "Історія"}</span>
        </button>
      </div>

      {/* Exercise Cards Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {exercises.map((exercise) => {
          const Icon = exercise.icon;
          const colorClasses = {
            moss: "border-moss/20 bg-moss/5 hover:border-moss/30 hover:bg-moss/10 text-moss",
            gold: "border-gold/20 bg-gold/5 hover:border-gold/30 hover:bg-gold/10 text-gold",
            terracotta: "border-terracotta/20 bg-terracotta/5 hover:border-terracotta/30 hover:bg-terracotta/10 text-terracotta"
          }[exercise.color];

          return (
            <Link
              key={exercise.id}
              href={exercise.href}
              className={`group rounded-3xl border p-6 shadow-soft transition ${colorClasses}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-paper/80 transition group-hover:scale-110">
                  <Icon size={24} weight="fill" />
                </div>
                <span className="rounded-full bg-paper/60 px-3 py-1 text-xs font-medium text-ink/60">
                  {exercise.timeEstimate}
                </span>
              </div>

              <h3 className="mt-4 text-lg font-semibold text-ink">
                {exercise.title}
              </h3>
              <p className="mt-2 text-sm text-ink/60 line-clamp-2">
                {exercise.description}
              </p>

              <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold transition group-hover:gap-3">
                Почати
                <span className="transition">→</span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* History Modal */}
      {showHistory && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/60 px-4 py-8">
          <div className="w-full max-w-4xl">
            <div className="sticky top-0 z-10 mb-6 flex justify-end">
              <button
                onClick={() => setShowHistory(false)}
                className="rounded-full bg-paper p-3 shadow-lg transition hover:bg-ink/5"
              >
                <ClockClockwise size={20} weight="bold" className="text-ink" />
              </button>
            </div>

            <div className="pb-8">
              <WorkbookHistory />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
