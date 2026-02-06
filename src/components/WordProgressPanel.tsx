"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { Word } from "@/lib/types";

type ProgressEntry = {
  wordId: string;
  seenCount: number;
  correctCount: number;
  lastSeen: string;
};

export default function WordProgressPanel() {
  const { t } = useLocale();
  const [progress, setProgress] = useState<ProgressEntry[]>([]);
  const [words, setWords] = useState<Record<string, Word>>({});

  useEffect(() => {
    let mounted = true;
    async function load() {
      const res = await fetch("/api/user/words/progress");
      if (!res.ok) return;
      const data = await res.json();
      const entries: ProgressEntry[] = data.wordProgress || [];
      if (!mounted) return;
      setProgress(entries);
      if (entries.length) {
        const ids = entries.map((entry) => entry.wordId).join(",");
        const wordRes = await fetch(`/api/words?ids=${ids}`);
        const wordData = await wordRes.json();
        const map: Record<string, Word> = {};
        (wordData.items || []).forEach((word: Word) => {
          map[word.id] = word;
        });
        setWords(map);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const sorted = useMemo(() => {
    return [...progress].sort((a, b) => b.seenCount - a.seenCount).slice(0, 12);
  }, [progress]);

  return (
    <div className="rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft">
      <h2 className="text-2xl font-semibold">{t.cabinet.progressTitle}</h2>
      <p className="mt-2 text-sm text-ink/60">{t.cabinet.progressSubtitle}</p>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {sorted.map((entry) => {
          const word = words[entry.wordId];
          const accuracy = entry.seenCount ? Math.round((entry.correctCount / entry.seenCount) * 100) : 0;
          return (
            <div key={entry.wordId} className="rounded-2xl border border-ink/10 bg-paper/60 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-semibold">{word?.pl || entry.wordId}</p>
                  <p className="text-sm text-ink/60">{word?.uk || ""}</p>
                </div>
                <span className="rounded-full border border-ink/20 px-3 py-1 text-xs uppercase tracking-[0.2em] text-ink/50">
                  {accuracy}%
                </span>
              </div>
              <div className="mt-3 h-2 w-full rounded-full bg-ink/10">
                <div className="h-2 rounded-full bg-moss" style={{ width: `${accuracy}%` }} />
              </div>
              <p className="mt-2 text-xs text-ink/50">
                {entry.correctCount}/{entry.seenCount}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
