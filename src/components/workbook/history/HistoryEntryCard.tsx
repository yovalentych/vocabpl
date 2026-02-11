"use client";

import { useLocale } from "@/components/LocaleProvider";
import { ExerciseType } from "../types";
import {
  Trophy,
  Calendar,
  PencilLine,
  TextAlignLeft,
  Shuffle,
  Translate,
  Chat,
  Article,
  BookOpen
} from "@phosphor-icons/react";

interface HistoryEntryCardProps {
  entry: {
    id: string;
    type: ExerciseType;
    createdAt: string;
    score?: number;
    points?: number;
    details: any;
  };
}

// Icon map for exercise types
const exerciseIcons = {
  sentences: PencilLine,
  cloze: TextAlignLeft,
  match: Shuffle,
  translate: Translate,
  dialogue: Chat,
  paraphrase: Article,
  story: BookOpen,
} as const;

// Color schemes for exercise types
const exerciseColors = {
  sentences: { bg: "bg-moss/5", border: "border-moss/20", icon: "text-moss" },
  cloze: { bg: "bg-gold/5", border: "border-gold/20", icon: "text-gold" },
  match: { bg: "bg-terracotta/5", border: "border-terracotta/20", icon: "text-terracotta" },
  translate: { bg: "bg-ink/5", border: "border-ink/20", icon: "text-ink" },
  dialogue: { bg: "bg-moss/5", border: "border-moss/20", icon: "text-moss" },
  paraphrase: { bg: "bg-gold/5", border: "border-gold/20", icon: "text-gold" },
  story: { bg: "bg-terracotta/5", border: "border-terracotta/20", icon: "text-terracotta" },
} as const;

export default function HistoryEntryCard({ entry }: HistoryEntryCardProps) {
  const { t } = useLocale();

  const exerciseLabel = (t.workbook.exercises as any)[entry.type]?.title || entry.type;
  const date = new Date(entry.createdAt).toLocaleDateString("uk-UA", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });

  const Icon = exerciseIcons[entry.type as keyof typeof exerciseIcons] || PencilLine;
  const colors = exerciseColors[entry.type as keyof typeof exerciseColors] || exerciseColors.sentences;

  // Determine score color (green/yellow/red)
  const scorePercent = entry.score !== undefined ? Math.round(entry.score * 100) : null;
  let scoreColor = "text-ink/60";
  let scoreBg = "bg-ink/5";
  if (scorePercent !== null) {
    if (scorePercent >= 80) {
      scoreColor = "text-moss";
      scoreBg = "bg-moss/10";
    } else if (scorePercent >= 60) {
      scoreColor = "text-gold";
      scoreBg = "bg-gold/10";
    } else {
      scoreColor = "text-terracotta";
      scoreBg = "bg-terracotta/10";
    }
  }

  // Extract details based on exercise type
  let detailsText = "";
  if (entry.type === "sentences" && entry.details?.wordCount) {
    detailsText = `${entry.details.wordCount} ${t.workbook.words || "слів"}`;
  } else if (entry.type === "cloze" && entry.details?.materialTitle) {
    detailsText = entry.details.materialTitle;
  } else if (entry.type === "match" && entry.details?.pairCount) {
    detailsText = `${entry.details.pairCount} пар`;
  } else if (entry.type === "translate" && entry.details?.sentenceCount) {
    detailsText = `${entry.details.sentenceCount} ${t.workbook.sentences || "речень"}`;
  } else if (entry.type === "dialogue" && entry.details?.situation) {
    detailsText = entry.details.situation;
  } else if (entry.type === "paraphrase" && entry.details?.textLength) {
    detailsText = `${entry.details.textLength} символів`;
  } else if (entry.type === "story" && entry.details?.prompt) {
    detailsText = entry.details.prompt.substring(0, 50) + "...";
  }

  return (
    <div className={`group rounded-3xl border ${colors.border} ${colors.bg} p-6 shadow-soft transition-all hover:shadow-md hover:scale-[1.01] cursor-pointer`}>
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl ${colors.bg} ${colors.border} border-2 transition-transform group-hover:scale-110`}>
          <Icon size={24} weight="bold" className={colors.icon} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Type and Date */}
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <h3 className="text-base font-bold text-ink">{exerciseLabel}</h3>
            <div className="flex items-center gap-1.5 text-xs text-ink/50">
              <Calendar size={13} weight="bold" />
              <span>{date}</span>
            </div>
          </div>

          {/* Details */}
          {detailsText && (
            <p className="text-sm text-ink/70 mb-3 line-clamp-1">
              {detailsText}
            </p>
          )}

          {/* Score and Points Row */}
          <div className="flex flex-wrap items-center gap-3">
            {scorePercent !== null && (
              <div className={`inline-flex items-center gap-1.5 rounded-full ${scoreBg} px-3 py-1`}>
                <span className={`text-sm font-bold ${scoreColor}`}>
                  {scorePercent}%
                </span>
              </div>
            )}
            {entry.points !== undefined && entry.points > 0 && (
              <div className="inline-flex items-center gap-1.5 rounded-full bg-gold/10 px-3 py-1">
                <Trophy weight="fill" className="h-4 w-4 text-gold" />
                <span className="text-sm font-bold text-gold">
                  +{entry.points}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
