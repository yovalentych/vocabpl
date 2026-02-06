"use client";

import { useEffect, useMemo, useState } from "react";
import WordCard from "@/components/WordCard";
import { Word } from "@/lib/types";
import { useAppStore } from "@/store/useAppStore";
import { useLocale } from "@/components/LocaleProvider";

export default function StudyPanel() {
  const { deckType, displayMode } = useAppStore();
  const { t } = useLocale();
  const [queue, setQueue] = useState<Word[]>([]);
  const [index, setIndex] = useState(0);
  const [reveal, setReveal] = useState(false);
  const [loading, setLoading] = useState(true);

  const activeWord = queue[index];

  const queryType = useMemo(() => {
    if (deckType === "verbs") return "verbs";
    if (deckType === "adverbs") return "adverbs";
    if (deckType === "adjectives") return "adjectives";
    return undefined;
  }, [deckType]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      const params = new URLSearchParams();
      if (queryType) params.set("type", queryType);
      params.set("count", "20");
      const res = await fetch(`/api/words/random?${params.toString()}`);
      const data = await res.json();
      if (mounted) {
        setQueue(data.items || []);
        setIndex(0);
        setReveal(false);
        setLoading(false);
      }
    }

    if (deckType !== "test") {
      load();
    } else {
      setQueue([]);
      setLoading(false);
    }

    return () => {
      mounted = false;
    };
  }, [deckType, queryType]);

  function nextWord() {
    const nextIndex = index + 1;
    if (nextIndex >= queue.length) {
      setIndex(0);
    } else {
      setIndex(nextIndex);
    }
    setReveal(false);
  }

  if (loading) {
    return <div className="text-sm text-ink/60">{t.common.loading}</div>;
  }

  if (deckType === "test") {
    return (
      <div className="rounded-3xl border border-ink/10 bg-paper/80 p-8">
        <h3 className="text-2xl">{t.study.testModeTitle}</h3>
        <p className="mt-3 text-sm text-ink/60">{t.study.testModeText}</p>
      </div>
    );
  }

  if (!activeWord) {
    return (
      <div className="rounded-3xl border border-ink/10 bg-paper/80 p-8">
        <p className="text-sm text-ink/60">{t.study.noWords}</p>
      </div>
    );
  }

  const shouldReveal = reveal;
  const word =
    displayMode === "pl-to-uk" ? activeWord : { ...activeWord, pl: activeWord.uk, uk: activeWord.pl };

  return (
    <div className="space-y-6">
      <WordCard word={word} reveal={shouldReveal} placeholder={t.common.reveal} />
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => setReveal((prev) => !prev)}
          className="rounded-full bg-ink px-5 py-2 text-sm font-semibold text-paper"
        >
          {shouldReveal ? t.common.hide : t.common.reveal}
        </button>
        <button
          onClick={nextWord}
          className="rounded-full border border-ink/20 px-5 py-2 text-sm font-semibold text-ink hover:bg-ink/5"
        >
          {t.common.next}
        </button>
        <span className="text-xs uppercase tracking-[0.2em] text-ink/50">
          {index + 1} / {queue.length}
        </span>
      </div>
    </div>
  );
}
