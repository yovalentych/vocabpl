"use client";

import { useLocale } from "@/components/LocaleProvider";
import { ExerciseType } from "../types";
import { Trophy, Calendar } from "@phosphor-icons/react/dist/ssr";

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

  return (
    <div className="rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft transition hover:border-ink/20">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex-1">
          {/* Type and Date */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-ink/10 bg-paper px-3 py-1 text-xs font-semibold">
              {exerciseLabel}
            </span>
            <div className="flex items-center gap-2 text-xs text-ink/50">
              <Calendar size={14} />
              <span>{date}</span>
            </div>
          </div>

          {/* Details Summary */}
          <div className="mt-3 text-sm text-ink/80">
            {entry.type === "sentences" && entry.details?.wordCount && (
              <p>{entry.details.wordCount} {t.workbook.words || "слів"}</p>
            )}
            {entry.type === "cloze" && entry.details?.materialTitle && (
              <p>{entry.details.materialTitle}</p>
            )}
            {entry.type === "match" && entry.details?.pairCount && (
              <p>{entry.details.pairCount} {t.workbook.matchPairs}</p>
            )}
            {entry.type === "translate" && entry.details?.sentenceCount && (
              <p>{entry.details.sentenceCount} {t.workbook.sentences || "речень"}</p>
            )}
          </div>
        </div>

        {/* Score and Points */}
        <div className="flex flex-col items-end gap-2">
          {entry.score !== undefined && (
            <div className="text-sm text-ink/80">
              {t.workbook.score || "Результат"}: {Math.round(entry.score * 100)}%
            </div>
          )}
          {entry.points !== undefined && entry.points > 0 && (
            <div className="flex items-center gap-2">
              <Trophy weight="fill" className="h-5 w-5 text-gold" />
              <span className="text-sm font-semibold text-moss">
                +{entry.points} {t.workbook.points}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
