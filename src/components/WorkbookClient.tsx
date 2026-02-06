"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { ArrowRight, PaperPlaneRight, Sparkle } from "@phosphor-icons/react";
import type { Word } from "@/lib/types";

type WorkbookWord = Word & { sentences: string[] };

type Entry = {
  id: string;
  number: number;
  createdAt: string;
  items: { pl: string; uk: string; text: string; sentenceCount: number; points: number }[];
  totalPoints: number;
  formattedText: string;
};
type Submission = {
  id: string;
  entryId: string;
  status: "pending" | "reviewed";
  comment?: string;
};

function countSentences(sentences: string[]) {
  return sentences.map((item) => item.trim()).filter(Boolean).length;
}

function scoreForCount(count: number) {
  if (count >= 3) return 1;
  if (count === 2) return 0.75;
  if (count === 1) return 0.5;
  return 0;
}

export default function WorkbookClient() {
  const { t } = useLocale();
  const [selectedTypes, setSelectedTypes] = useState<string[]>([
    "verbs",
    "adverbs",
    "adjectives",
    "slang",
    "others",
    "soft_swears",
    "clean_emotions",
    "abbreviations"
  ]);
  const [includeFavorites, setIncludeFavorites] = useState(true);
  const [includeMyWords, setIncludeMyWords] = useState(true);
  const [count, setCount] = useState(5);
  const [items, setItems] = useState<WorkbookWord[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [locked, setLocked] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "done" | "error">("idle");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [submitStatus, setSubmitStatus] = useState<Record<string, "idle" | "saving" | "done" | "error">>({});

  const typeOptions = useMemo(
    () => [
      { id: "verbs", label: t.deck.verbs },
      { id: "adverbs", label: t.deck.adverbs },
      { id: "adjectives", label: t.deck.adjectives },
      { id: "slang", label: t.deck.slang },
      { id: "others", label: t.deck.others },
      { id: "soft_swears", label: t.deck.softSwears },
      { id: "clean_emotions", label: t.deck.cleanEmotions },
      { id: "abbreviations", label: t.deck.abbreviations }
    ],
    [t]
  );

  useEffect(() => {
    let mounted = true;
    async function loadEntries() {
      const res = await fetch("/api/workbook/entries");
      if (!res.ok) return;
      const data = await res.json();
      if (!mounted) return;
      setEntries(data.entries || []);
    }
    async function loadSubmissions() {
      const res = await fetch("/api/workbook/submissions");
      if (!res.ok) return;
      const data = await res.json();
      if (!mounted) return;
      setSubmissions(data.submissions || []);
    }
    loadEntries();
    loadSubmissions();
    return () => {
      mounted = false;
    };
  }, []);

  async function generateWords() {
    setLoading(true);
    setSaveStatus("idle");
    const selected = [...selectedTypes];
    if (includeFavorites) selected.push("favorites");
    if (includeMyWords) selected.push("my_words");
    const params = new URLSearchParams();
    params.set("types", selected.join(","));
    params.set("count", String(count));
    const res = await fetch(`/api/workbook/words?${params.toString()}`);
    const data = await res.json();
    setLocked(Boolean(data.locked));
    const nextItems = (data.items || []).map((word: Word) => ({ ...word, sentences: ["", "", ""] }));
    setItems(nextItems);
    setActiveId(nextItems[0]?.id || null);
    setLoading(false);
  }

  function updateSentence(id: string, index: number, value: string) {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              sentences: item.sentences.map((sentence, idx) => (idx === index ? value : sentence))
            }
          : item
      )
    );
  }

  async function saveEntry() {
    const payload = items.map((item) => ({
      wordId: item.id,
      pl: item.pl,
      uk: item.uk,
      type: item.type,
      text: item.sentences.map((sentence) => sentence.trim()).filter(Boolean).join("\n")
    }));
    if (!payload.some((item) => item.text.trim())) {
      setSaveStatus("error");
      return;
    }
    setSaveStatus("saving");
    const res = await fetch("/api/workbook/entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: payload })
    });
    if (!res.ok) {
      setSaveStatus("error");
      return;
    }
    const data = await res.json();
    setSaveStatus("done");
    setEntries((prev) => [data.entry, ...prev]);
  }

  async function submitForReview(entry: Entry) {
    setSubmitStatus((prev) => ({ ...prev, [entry.id]: "saving" }));
    const res = await fetch("/api/workbook/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entryId: entry.id })
    });
    if (!res.ok) {
      setSubmitStatus((prev) => ({ ...prev, [entry.id]: "error" }));
      return;
    }
    const data = await res.json();
    setSubmissions((prev) => [data.submission, ...prev]);
    setSubmitStatus((prev) => ({ ...prev, [entry.id]: "done" }));
  }

  const totalPoints = items.reduce((sum, item) => sum + scoreForCount(countSentences(item.sentences)), 0);
  const activeWord = items.find((item) => item.id === activeId) || items[0];
  const activeIndex = items.findIndex((item) => item.id === activeWord?.id);

  return (
    <div className="space-y-8">
      <div className="rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold">{t.workbook.title}</h2>
            <p className="mt-2 text-sm text-ink/60">{t.workbook.subtitle}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-ink/20 px-3 py-1 text-xs uppercase tracking-[0.2em] text-ink/50">
              {t.workbook.pointsLabel}: {totalPoints.toFixed(2)}
            </span>
            <button
              onClick={saveEntry}
              className="rounded-full bg-moss px-4 py-2 text-xs font-semibold text-paper"
              disabled={loading || items.length === 0}
            >
              <span className="flex items-center gap-2">
                <PaperPlaneRight size={16} weight="bold" />
                {saveStatus === "saving" ? t.common.loading : t.workbook.save}
              </span>
            </button>
            <button
              onClick={generateWords}
              className="rounded-full border border-ink/20 px-4 py-2 text-xs font-semibold text-ink"
              disabled={loading}
            >
              <span className="flex items-center gap-2">
                <ArrowRight size={16} />
                {t.workbook.nextSet}
              </span>
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            <p className="text-xs uppercase tracking-[0.3em] text-ink/40">{t.workbook.chooseGroups}</p>
            <div className="flex flex-wrap gap-2">
              {typeOptions.map((option) => {
                const active = selectedTypes.includes(option.id);
                return (
                  <button
                    key={option.id}
                    onClick={() =>
                      setSelectedTypes((prev) =>
                        prev.includes(option.id)
                          ? prev.filter((item) => item !== option.id)
                          : [...prev, option.id]
                      )
                    }
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      active ? "bg-ink text-paper" : "border border-ink/20 text-ink"
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
              <button
                onClick={() => setIncludeFavorites((prev) => !prev)}
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  includeFavorites ? "bg-ink text-paper" : "border border-ink/20 text-ink"
                }`}
              >
                {t.cabinet.tabs.favorites}
              </button>
              <button
                onClick={() => setIncludeMyWords((prev) => !prev)}
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  includeMyWords ? "bg-ink text-paper" : "border border-ink/20 text-ink"
                }`}
              >
                {t.words.myWords}
              </button>
            </div>
            <p className="text-xs text-ink/50">{t.workbook.recommendation}</p>
          </div>

          <div className="grid gap-3 md:grid-cols-[1fr_auto]">
            <label className="text-sm text-ink/70">
              {t.workbook.wordCount}
              <input
                type="number"
                value={count}
                onChange={(event) => setCount(Math.min(50, Math.max(1, Number(event.target.value) || 1)))}
                className="mt-2 w-full rounded-2xl border border-ink/20 bg-paper px-4 py-2 text-sm"
                min={1}
                max={50}
              />
            </label>
            <div className="flex items-end gap-2">
              <button
                onClick={generateWords}
                className="rounded-full bg-ink px-5 py-2 text-xs font-semibold text-paper"
              >
                <span className="flex items-center gap-2">
                  <Sparkle size={16} weight="bold" />
                  {t.workbook.generate}
                </span>
              </button>
            </div>
            {locked && <p className="text-xs text-terracotta">{t.workbook.locked}</p>}
            {saveStatus === "done" && <p className="text-xs text-moss">{t.workbook.saved}</p>}
            {saveStatus === "error" && <p className="text-xs text-terracotta">{t.workbook.saveError}</p>}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.35fr_0.65fr]">
        <div className="rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft">
          <p className="text-xs uppercase tracking-[0.3em] text-ink/40">{t.workbook.words}</p>
          {loading ? (
            <p className="mt-4 text-sm text-ink/60">{t.common.loading}</p>
          ) : items.length === 0 ? (
            <p className="mt-4 text-sm text-ink/60">{t.workbook.empty}</p>
          ) : (
            <div className="mt-4 space-y-2">
              {items.map((word) => (
                <button
                  key={word.id}
                  onClick={() => setActiveId(word.id)}
                  className={`w-full rounded-2xl border px-4 py-3 text-left ${
                    activeWord?.id === word.id
                      ? "border-ink bg-ink/5"
                      : "border-ink/10 bg-paper/70 hover:border-ink/30"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-ink">{word.pl}</p>
                      <p className="text-xs text-ink/50">{word.uk}</p>
                    </div>
                    <span className="text-xs text-ink/50">
                      {countSentences(word.sentences)} / 3
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft">
          <p className="text-xs uppercase tracking-[0.3em] text-ink/40">{t.workbook.write}</p>
          {activeWord ? (
            <div className="mt-4 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold text-ink">{activeWord.pl}</p>
                  <p className="text-sm text-ink/60">{activeWord.uk}</p>
                </div>
                <div className="flex items-center gap-2 text-xs text-ink/50">
                  <span>
                    {t.workbook.sentences}: {countSentences(activeWord.sentences)} / 3
                  </span>
                  <span>
                    {t.workbook.points}: {scoreForCount(countSentences(activeWord.sentences))}
                  </span>
                </div>
              </div>
              <div className="grid gap-2">
                {activeWord.sentences.map((sentence, idx) => (
                  <div key={`${activeWord.id}-s-${idx}`} className="flex items-start gap-2">
                    <span className="mt-2 text-xs text-ink/40">{idx + 1}.</span>
                    <textarea
                      value={sentence}
                      onChange={(event) => updateSentence(activeWord.id, idx, event.target.value)}
                      rows={2}
                      className="w-full rounded-2xl border border-ink/20 bg-paper px-4 py-2 text-sm"
                      placeholder={t.workbook.placeholder}
                    />
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between text-xs text-ink/50">
                <button
                  onClick={() => setActiveId(items[Math.max(activeIndex - 1, 0)]?.id || activeWord.id)}
                  className="rounded-full border border-ink/10 px-3 py-1"
                  disabled={activeIndex <= 0}
                >
                  {t.workbook.prev}
                </button>
                <span>
                  {activeIndex + 1} / {items.length}
                </span>
                <button
                  onClick={() =>
                    setActiveId(items[Math.min(activeIndex + 1, items.length - 1)]?.id || activeWord.id)
                  }
                  className="rounded-full border border-ink/10 px-3 py-1"
                  disabled={activeIndex >= items.length - 1}
                >
                  {t.workbook.next}
                </button>
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm text-ink/60">{t.workbook.empty}</p>
          )}
        </div>
      </div>

      <div className="rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold">{t.workbook.historyTitle}</h3>
          <span className="text-xs uppercase tracking-[0.3em] text-ink/40">{entries.length}</span>
        </div>
        <div className="mt-4 space-y-3">
          {entries.length === 0 ? (
            <p className="text-sm text-ink/60">{t.workbook.historyEmpty}</p>
          ) : (
            entries.map((entry) => {
              const submission = submissions.find((item) => item.entryId === entry.id);
              return (
              <div key={entry.id} className="rounded-2xl border border-ink/10 bg-paper/70 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">
                      {t.workbook.entry} #{entry.number}
                    </p>
                    <p className="text-xs text-ink/50">{new Date(entry.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full border border-ink/10 bg-paper px-3 py-1 text-xs">
                      {t.workbook.pointsLabel}: {entry.totalPoints.toFixed(2)}
                    </span>
                    {submission ? (
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          submission.status === "reviewed"
                            ? "bg-moss/20 text-moss"
                            : "bg-ink/10 text-ink/70"
                        }`}
                      >
                        {submission.status === "reviewed" ? t.messages.reviewed : t.messages.pending}
                      </span>
                    ) : (
                      <button
                        onClick={() => submitForReview(entry)}
                        className="rounded-full border border-ink/20 px-3 py-1 text-xs font-semibold"
                      >
                        {submitStatus[entry.id] === "saving" ? t.common.loading : t.messages.sendReview}
                      </button>
                    )}
                    <a
                      href={`data:text/plain;charset=utf-8,${encodeURIComponent(entry.formattedText)}`}
                      download={`workbook_${entry.number}.txt`}
                      className="rounded-full border border-ink/20 px-3 py-1 text-xs font-semibold"
                    >
                      {t.workbook.download}
                    </a>
                    <button
                      onClick={() => setExpandedEntry((prev) => (prev === entry.id ? null : entry.id))}
                      className="rounded-full border border-ink/20 px-3 py-1 text-xs font-semibold"
                    >
                      {expandedEntry === entry.id ? t.common.hide : t.workbook.show}
                    </button>
                  </div>
                </div>
                {expandedEntry === entry.id && (
                  <pre className="mt-4 whitespace-pre-wrap rounded-2xl border border-ink/10 bg-paper px-4 py-3 text-xs text-ink/70">
                    {entry.formattedText}
                  </pre>
                )}
              </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
