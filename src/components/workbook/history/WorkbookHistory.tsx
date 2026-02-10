"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { ExerciseType } from "../types";
import HistoryEntryCard from "./HistoryEntryCard";
import Loader from "@/components/ui/Loader";

interface HistoryEntry {
  id: string;
  type: ExerciseType;
  createdAt: string;
  score?: number;
  points?: number;
  details: any;
}

export default function WorkbookHistory() {
  const { t } = useLocale();
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [filter, setFilter] = useState<ExerciseType | "all">("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEntries();
  }, []);

  async function loadEntries() {
    setLoading(true);
    try {
      const res = await fetch("/api/workbook/entries");
      if (!res.ok) return;
      const data = await res.json().catch(() => ({}));
      setEntries(Array.isArray(data.entries) ? data.entries : []);
    } finally {
      setLoading(false);
    }
  }

  const filteredEntries = filter === "all"
    ? entries
    : entries.filter((e) => e.type === filter);

  const exerciseTypes: Array<{ id: ExerciseType | "all"; label: string }> = [
    { id: "all", label: t.workbook.historyAll },
    { id: "sentences", label: t.workbook.exercises.sentences.title },
    { id: "cloze", label: t.workbook.exercises.cloze.title },
    { id: "match", label: t.workbook.exercises.match.title },
    { id: "translate", label: t.workbook.exercises.translate.title },
    { id: "dialogue", label: t.workbook.exercises.dialogue.title },
    { id: "paraphrase", label: t.workbook.exercises.paraphrase.title },
    { id: "story", label: t.workbook.exercises.story.title }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft">
        <h2 className="text-2xl font-semibold">{t.workbook.historyTitle}</h2>
        <p className="mt-2 text-sm text-ink/60">
          {t.workbook.historySubtitle}
        </p>
      </div>

      {/* Filters */}
      <div className="rounded-3xl border border-ink/10 bg-paper/80 p-4 shadow-soft">
        <div className="flex flex-wrap gap-2">
          {exerciseTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => setFilter(type.id)}
              className={`rounded-full border px-4 py-2 text-xs font-semibold transition ${
                filter === type.id
                  ? "border-ink bg-ink/5 text-ink"
                  : "border-ink/10 bg-paper text-ink/60 hover:border-ink/30"
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Entries List */}
      <div className="space-y-4">
        {loading ? (
          <div className="rounded-3xl border border-ink/10 bg-paper/80 p-8 text-center shadow-soft">
            <Loader label={t.common.loading} className="justify-center" />
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="rounded-3xl border border-ink/10 bg-paper/80 p-8 text-center shadow-soft">
            <p className="text-sm text-ink/60">
              {t.workbook.historyEmpty || "Ще немає записів"}
            </p>
          </div>
        ) : (
          filteredEntries.map((entry) => (
            <HistoryEntryCard key={entry.id} entry={entry} />
          ))
        )}
      </div>
    </div>
  );
}
