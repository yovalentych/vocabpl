"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { BookOpenText, Sliders } from "@phosphor-icons/react";
import { hasConsent, readPrefs, writePrefs } from "@/lib/prefs";
import type { ReadingText } from "@/lib/reading";

type ViewMode = "pl" | "uk" | "dual";

export default function ReadingClient() {
  const { t } = useLocale();
  const [items, setItems] = useState<ReadingText[]>([]);
  const [locked, setLocked] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("dual");
  const [showGlossary, setShowGlossary] = useState(true);
  const [showQuestions, setShowQuestions] = useState(true);
  const [listOpen, setListOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function load() {
      const res = await fetch("/api/reading");
      if (!mounted) return;
      if (!res.ok) {
        setItems([]);
        return;
      }
      const data = await res.json();
      const list = data.items || [];
      setLocked(Boolean(data.locked));
      setItems(list);
      if (list.length) {
        setSelectedId((prev) => prev || list[0].id);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!hasConsent()) return;
    const prefs = readPrefs();
    if (!prefs) return;
    if (prefs.readingViewMode) setViewMode(prefs.readingViewMode as ViewMode);
    if (typeof prefs.readingShowGlossary === "boolean") setShowGlossary(prefs.readingShowGlossary);
    if (typeof prefs.readingShowQuestions === "boolean") setShowQuestions(prefs.readingShowQuestions);
  }, []);

  useEffect(() => {
    if (!hasConsent()) return;
    const current = readPrefs() || {};
    writePrefs({
      ...current,
      readingViewMode: viewMode,
      readingShowGlossary: showGlossary,
      readingShowQuestions: showQuestions
    });
  }, [viewMode, showGlossary, showQuestions]);

  const active = useMemo(
    () => items.find((item) => item.id === selectedId) || items[0],
    [items, selectedId]
  );

  if (!active) {
    return <p className="text-sm text-ink/60">{t.common.loading}</p>;
  }

  return (
    <div className="space-y-6">
      {locked && (
        <div className="rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft">
          <h2 className="text-2xl font-semibold">{t.paywall.title}</h2>
          <p className="mt-2 text-sm text-ink/60">{t.paywall.reading}</p>
        </div>
      )}

      <div className={`grid gap-6 lg:grid-cols-[0.7fr_0.3fr] ${locked ? "opacity-60 pointer-events-none" : ""}`}>
        <div className="rounded-3xl border border-ink/10 bg-paper/80 p-5 shadow-soft">
          <p className="text-xs uppercase tracking-[0.3em] text-ink/40">{t.reading.list}</p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <select
              value={selectedId}
              onChange={(event) => setSelectedId(event.target.value)}
              className="min-w-[240px] flex-1 rounded-2xl border border-ink/20 bg-paper px-4 py-2 text-sm"
            >
              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title.pl}
                </option>
              ))}
            </select>
            <button
              onClick={() => setListOpen((prev) => !prev)}
              className="rounded-full border border-ink/20 px-4 py-2 text-xs font-semibold text-ink"
            >
              <span className="flex items-center gap-2">
                <BookOpenText size={16} />
                {listOpen ? t.common.hide : t.reading.list}
              </span>
            </button>
          </div>
          {listOpen && (
            <div className="mt-4 max-h-[280px] space-y-3 overflow-y-auto pr-1">
              {items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setSelectedId(item.id);
                    setListOpen(false);
                  }}
                  className={`w-full rounded-2xl border px-4 py-3 text-left text-sm transition ${
                    selectedId === item.id
                      ? "border-ink bg-ink/5"
                      : "border-ink/10 bg-paper/60 hover:border-ink/20"
                  }`}
                >
                  <p className="text-xs uppercase tracking-[0.2em] text-ink/50">{item.topic}</p>
                  <p className="mt-2 font-semibold">{item.title.pl}</p>
                  <p className="text-xs text-ink/60">{item.title.uk}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-ink/10 bg-paper/80 p-5 shadow-soft">
          <p className="text-xs uppercase tracking-[0.3em] text-ink/40 flex items-center gap-2">
            <Sliders size={14} />
            {t.reading.settings}
          </p>
          <div className="mt-4 space-y-4 text-sm text-ink/70">
            <div className="flex flex-wrap gap-2">
              {[
                { id: "pl", label: t.reading.viewModes.pl },
                { id: "uk", label: t.reading.viewModes.uk },
                { id: "dual", label: t.reading.viewModes.dual }
              ].map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => setViewMode(mode.id as ViewMode)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    viewMode === mode.id ? "bg-ink text-paper" : "border border-ink/20 text-ink"
                  }`}
                >
                  {mode.label}
                </button>
              ))}
            </div>
            <label className="flex items-center gap-2 text-xs text-ink/60">
              <input
                type="checkbox"
                checked={showGlossary}
                onChange={(event) => setShowGlossary(event.target.checked)}
                className="accent-ink"
              />
              {t.reading.showGlossary}
            </label>
            <label className="flex items-center gap-2 text-xs text-ink/60">
              <input
                type="checkbox"
                checked={showQuestions}
                onChange={(event) => setShowQuestions(event.target.checked)}
                className="accent-ink"
              />
              {t.reading.showQuestions}
            </label>
          </div>
        </div>
      </div>

      <section className="space-y-6">
        <div className="rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-ink/40">{active.level}</p>
              <h2 className="mt-2 text-2xl font-semibold">{active.title.pl}</h2>
              <p className="text-sm text-ink/60">{active.title.uk}</p>
            </div>
            <span className="rounded-full border border-ink/20 px-3 py-1 text-xs uppercase tracking-[0.2em] text-ink/50">
              {active.topic}
            </span>
          </div>
        </div>

        <div className="rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft">
          {viewMode === "dual" ? (
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <p className="text-xs uppercase tracking-[0.3em] text-ink/40">PL</p>
                {active.text.pl.split("\n\n").map((paragraph, idx) => (
                  <p key={`pl-${idx}`} className="text-sm leading-6 text-ink/80">
                    {paragraph}
                  </p>
                ))}
              </div>
              <div className="space-y-4">
                <p className="text-xs uppercase tracking-[0.3em] text-ink/40">UKR</p>
                {active.text.uk.split("\n\n").map((paragraph, idx) => (
                  <p key={`uk-${idx}`} className="text-sm leading-6 text-ink/80">
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {(viewMode === "pl" ? active.text.pl : active.text.uk)
                .split("\n\n")
                .map((paragraph, idx) => (
                  <p key={`single-${idx}`} className="text-sm leading-6 text-ink/80">
                    {paragraph}
                  </p>
                ))}
            </div>
          )}
        </div>

        {showGlossary && active.glossary?.length > 0 && (
          <div className="rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft">
            <h3 className="text-xl font-semibold">{t.reading.glossary}</h3>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {active.glossary.map((entry, idx) => (
                <div key={`gloss-${idx}`} className="rounded-2xl border border-ink/10 bg-paper/60 px-4 py-3 text-sm text-ink/70">
                  <span className="font-semibold">{entry.pl}</span> — {entry.uk}
                </div>
              ))}
            </div>
          </div>
        )}

        {showQuestions && (
          <div className="rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft">
            <h3 className="text-xl font-semibold">{t.reading.questions}</h3>
            {viewMode === "dual" ? (
              <div className="mt-4 grid gap-4 md:grid-cols-2 text-sm text-ink/70">
                <div className="space-y-2">
                  {active.questions.pl.map((q, idx) => (
                    <p key={`qpl-${idx}`}>{q}</p>
                  ))}
                </div>
                <div className="space-y-2">
                  {active.questions.uk.map((q, idx) => (
                    <p key={`quk-${idx}`}>{q}</p>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mt-4 space-y-2 text-sm text-ink/70">
                {(viewMode === "pl" ? active.questions.pl : active.questions.uk).map((q, idx) => (
                  <p key={`qs-${idx}`}>{q}</p>
                ))}
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
