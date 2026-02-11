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
      <div className="rounded-3xl border border-ink/10 bg-paper p-6 shadow-lg">
        <h2 className="text-2xl font-semibold">{t.workbook.historyTitle}</h2>
        <p className="mt-2 text-sm text-ink/60">
          {t.workbook.historySubtitle}
        </p>
      </div>

      {/* Filters */}
      <div className="rounded-3xl border border-ink/10 bg-paper p-4 md:p-6 shadow-lg">
        <p className="text-xs uppercase tracking-[0.3em] text-ink/40 mb-3">
          Фільтр за типом
        </p>
        <div className="flex flex-wrap gap-2">
          {exerciseTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => setFilter(type.id)}
              className={`rounded-full border px-4 py-2.5 md:py-2 text-xs font-semibold transition-all active:scale-95 ${
                filter === type.id
                  ? "border-ink bg-ink text-paper shadow-md"
                  : "border-ink/20 bg-paper text-ink/70 hover:border-ink/40 hover:bg-ink/5"
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
        {filteredEntries.length > 0 && (
          <p className="mt-4 text-xs text-ink/50">
            Знайдено записів: <span className="font-semibold text-ink/70">{filteredEntries.length}</span>
          </p>
        )}
      </div>

      {/* Entries List */}
      <div className="space-y-4">
        {loading ? (
          <div className="rounded-3xl border border-ink/10 bg-paper p-8 text-center shadow-lg">
            <Loader label={t.common.loading} className="justify-center" />
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="rounded-3xl border border-ink/10 bg-paper p-8 text-center shadow-lg">
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
