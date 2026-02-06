"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { Word } from "@/lib/types";
import { getPolishAdjectiveDeclensionUrl, getPolishConjugationUrl } from "@/lib/links";

export default function TrainingPanel() {
  const { t } = useLocale();
  const [queue, setQueue] = useState<Word[]>([]);
  const [index, setIndex] = useState(0);
  const [reveal, setReveal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deck, setDeck] = useState<"all" | "verbs" | "adverbs" | "adjectives">("all");
  const [batchSize, setBatchSize] = useState(20);
  const [marked, setMarked] = useState<Record<string, "known" | "again" | undefined>>({});
  const [sessionLogged, setSessionLogged] = useState(false);

  const activeWord = queue[index];

  async function loadSession() {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("count", String(batchSize));
    if (deck !== "all") params.set("type", deck);
    const res = await fetch(`/api/words/random?${params.toString()}`);
    const data = await res.json();
    setQueue(data.items || []);
    setIndex(0);
    setReveal(false);
    setMarked({});
    setSessionLogged(false);
    setLoading(false);
  }

  useEffect(() => {
    loadSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function markWord(result: "known" | "again") {
    if (!activeWord) return;
    setMarked((prev) => ({ ...prev, [activeWord.id]: result }));
    await fetch("/api/user/words/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        wordId: activeWord.id,
        correct: result === "known",
        incrementSession: !sessionLogged
      })
    }).catch(() => null);
    if (!sessionLogged) setSessionLogged(true);
  }

  function nextWord() {
    if (!activeWord) return;
    if (!marked[activeWord.id]) return;
    const nextIndex = index + 1;
    if (nextIndex >= queue.length) {
      setIndex(0);
    } else {
      setIndex(nextIndex);
    }
    setReveal(false);
  }

  const completedCount = useMemo(
    () => Object.values(marked).filter(Boolean).length,
    [marked]
  );

  if (loading) {
    return <div className="text-sm text-ink/60">{t.common.loading}</div>;
  }

  if (!activeWord) {
    return (
      <div className="rounded-3xl border border-ink/10 bg-paper/80 p-8">
        <p className="text-sm text-ink/60">{t.study.noWords}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft">
        <div className="grid gap-4 md:grid-cols-[1fr_1fr_1fr_auto]">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-ink/40">{t.training.deck}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {[
                { id: "all", label: t.training.all },
                { id: "verbs", label: t.training.verbs },
                { id: "adverbs", label: t.training.adverbs },
                { id: "adjectives", label: t.training.adjectives }
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setDeck(item.id as typeof deck)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    deck === item.id ? "bg-ink text-paper" : "border border-ink/20 text-ink"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-ink/40">{t.training.size}</p>
            <div className="mt-2 flex items-center gap-3">
              <input
                type="range"
                min={5}
                max={50}
                step={5}
                value={batchSize}
                onChange={(event) => setBatchSize(Number(event.target.value))}
                className="w-full accent-ink"
              />
              <span className="min-w-[2.5rem] text-sm font-semibold">{batchSize}</span>
            </div>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-ink/40">{t.training.progress}</p>
            <div className="mt-2 text-sm text-ink/70">
              {t.training.marked}: {completedCount} · {t.training.remaining}: {Math.max(queue.length - completedCount, 0)}
            </div>
            <div className="mt-3 h-2 w-full rounded-full bg-ink/10">
              <div
                className="h-2 rounded-full bg-moss"
                style={{ width: `${queue.length ? (completedCount / queue.length) * 100 : 0}%` }}
              />
            </div>
          </div>
          <div className="flex items-end">
            <button
              onClick={loadSession}
              className="rounded-full bg-ink px-5 py-2 text-sm font-semibold text-paper"
            >
              {t.training.start}
            </button>
          </div>
        </div>
      </div>
      <div className="rounded-3xl border border-ink/10 bg-paper/90 p-8 shadow-soft">
        <p className="text-xs uppercase tracking-[0.3em] text-ink/40">{activeWord.type}</p>
        <h3 className="mt-3 text-3xl font-semibold text-ink">{activeWord.pl}</h3>
        <p className="mt-3 text-sm text-ink/60">
          {reveal ? activeWord.uk : t.common.reveal}
        </p>
        {activeWord.type === "verb" && (
          <a
            href={getPolishConjugationUrl(activeWord.pl)}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex items-center justify-center rounded-full border border-ink/20 px-4 py-2 text-xs font-semibold text-ink hover:bg-ink/5"
          >
            {t.common.conjugation}
          </a>
        )}
        {activeWord.type === "adjective" && (
          <a
            href={getPolishAdjectiveDeclensionUrl(activeWord.pl)}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex items-center justify-center rounded-full border border-ink/20 px-4 py-2 text-xs font-semibold text-ink hover:bg-ink/5"
          >
            {t.common.declension}
          </a>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => markWord("known")}
          className={`rounded-full px-5 py-2 text-sm font-semibold ${
            marked[activeWord.id] === "known" ? "bg-moss text-paper" : "border border-ink/20 text-ink"
          }`}
        >
          {t.training.known}
        </button>
        <button
          onClick={() => markWord("again")}
          className={`rounded-full px-5 py-2 text-sm font-semibold ${
            marked[activeWord.id] === "again" ? "bg-terracotta text-paper" : "border border-ink/20 text-ink"
          }`}
        >
          {t.training.again}
        </button>
        <button
          onClick={() => setReveal((prev) => !prev)}
          className="rounded-full bg-ink px-5 py-2 text-sm font-semibold text-paper"
        >
          {reveal ? t.common.hide : t.common.reveal}
        </button>
        <button
          onClick={nextWord}
          className="rounded-full border border-ink/20 px-5 py-2 text-sm font-semibold text-ink hover:bg-ink/5"
        >
          {t.training.next}
        </button>
        {!marked[activeWord.id] && (
          <span className="text-xs text-ink/50">{t.training.hint}</span>
        )}
        <span className="text-xs uppercase tracking-[0.2em] text-ink/50">
          {index + 1} / {queue.length}
        </span>
      </div>
    </div>
  );
}
