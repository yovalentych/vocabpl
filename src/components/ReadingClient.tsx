"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { BookOpenText, Sliders, Sparkle, FolderOpen, Book, Question, ClockCounterClockwise } from "@phosphor-icons/react";
import { hasConsent, readPrefs, writePrefs } from "@/lib/prefs";
import type { ReadingText } from "@/lib/reading";
import Loader from "@/components/ui/Loader";
import ReadingAIGenerator from "@/components/reading/ReadingAIGenerator";
import ReadingComprehension from "@/components/reading/ReadingComprehension";
import ReadingAccordion from "@/components/reading/ReadingAccordion";
import ReadingSkeleton from "@/components/reading/ReadingSkeleton";
import ReadingHistory from "@/components/reading/ReadingHistory";
import ReadingGlossary from "@/components/reading/ReadingGlossary";
import ReadingExplainer from "@/components/reading/ReadingExplainer";
import ReadingTextHighlighter from "@/components/reading/ReadingTextHighlighter";
import { useReadingAI } from "@/components/reading/hooks/useReadingAI";

type ViewMode = "pl" | "uk" | "dual";
type TabMode = "static" | "ai" | "saved" | "history";

export default function ReadingClient() {
  const { t, locale } = useLocale();
  const [items, setItems] = useState<ReadingText[]>([]);
  const [locked, setLocked] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("dual");
  const [showGlossary, setShowGlossary] = useState(true);
  const [showQuestions, setShowQuestions] = useState(true);
  const [listOpen, setListOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabMode>("static");

  // AI features state
  const { explanation, loading: aiLoading, error: aiError, explainFragment } = useReadingAI();
  const [showExplainer, setShowExplainer] = useState(false);
  const [selectedFragment, setSelectedFragment] = useState("");

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

  async function handleExplainRequest(fragment: string) {
    if (!active) return;

    setSelectedFragment(fragment);
    setShowExplainer(true);

    await explainFragment(active.text.pl, fragment, active.level, locale);
  }

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (items.length > 0) {
      setLoading(false);
    }
  }, [items]);

  if (loading && items.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap gap-2">
          <div className="h-10 w-40 animate-pulse rounded-full bg-ink/10"></div>
          <div className="h-10 w-32 animate-pulse rounded-full bg-ink/10"></div>
        </div>
        <ReadingSkeleton />
      </div>
    );
  }

  if (!active) {
    return <Loader label={t.common.loading} />;
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {locked && (
        <div className="rounded-3xl border border-ink/10 bg-paper/80 p-4 sm:p-6 shadow-soft">
          <h2 className="text-xl sm:text-2xl font-semibold">{t.paywall.title}</h2>
          <p className="mt-2 text-sm text-ink/60">{t.paywall.reading}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 sm:gap-2">
        <button
          onClick={() => setActiveTab("static")}
          className={`flex items-center gap-1.5 sm:gap-2 rounded-full px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold transition ${
            activeTab === "static"
              ? "bg-ink text-paper"
              : "border border-ink/20 text-ink hover:bg-ink/5"
          }`}
        >
          <BookOpenText size={16} weight={activeTab === "static" ? "fill" : "regular"} className="sm:w-[18px] sm:h-[18px]" />
          <span className="hidden sm:inline">{t.reading.tabs.static}</span>
          <span className="sm:hidden">Тексти</span>
        </button>
        <button
          onClick={() => setActiveTab("ai")}
          className={`flex items-center gap-1.5 sm:gap-2 rounded-full px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold transition ${
            activeTab === "ai"
              ? "bg-ink text-paper"
              : "border border-ink/20 text-ink hover:bg-ink/5"
          }`}
        >
          <Sparkle size={16} weight={activeTab === "ai" ? "fill" : "regular"} className="sm:w-[18px] sm:h-[18px]" />
          <span className="hidden sm:inline">{t.reading.tabs.aiGenerator}</span>
          <span className="sm:hidden">AI</span>
        </button>
        <button
          onClick={() => setActiveTab("saved")}
          className={`flex items-center gap-1.5 sm:gap-2 rounded-full px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold transition ${
            activeTab === "saved"
              ? "bg-ink text-paper"
              : "border border-ink/20 text-ink hover:bg-ink/5"
          }`}
        >
          <ClockCounterClockwise size={16} weight={activeTab === "saved" ? "fill" : "regular"} className="sm:w-[18px] sm:h-[18px]" />
          <span className="hidden sm:inline">Історія результатів</span>
          <span className="sm:hidden">Історія</span>
        </button>
      </div>

      {/* Static Texts Tab */}
      {activeTab === "static" && (
        <>
          <div className={`grid gap-4 sm:gap-6 lg:grid-cols-[0.7fr_0.3fr] ${locked ? "opacity-60 pointer-events-none" : ""}`}>
        <div className="rounded-3xl border border-ink/10 bg-paper/80 p-4 sm:p-5 shadow-soft">
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

      <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Title Card */}
        <div className="rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-moss/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-moss">
                  {active.level}
                </span>
                <span className="rounded-full bg-gold/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-gold">
                  {active.topic}
                </span>
              </div>
              <h2 className="mt-3 text-3xl font-bold text-ink">{active.title.pl}</h2>
              <p className="mt-1 text-base text-ink/60">{active.title.uk}</p>
            </div>
          </div>
        </div>

        {/* Text Content with Highlighter */}
        <div className="rounded-3xl border border-ink/10 bg-paper/80 p-8 shadow-soft">
          {viewMode === "dual" ? (
            <div className="grid gap-8 md:grid-cols-2">
              <div className="space-y-5">
                <div className="flex items-center gap-2">
                  <div className="h-1 w-8 rounded bg-moss"></div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-moss">Polski</p>
                </div>
                <ReadingTextHighlighter
                  text={active.text.pl}
                  level={active.level}
                  locale={locale}
                  onExplainRequest={handleExplainRequest}
                  viewMode="pl"
                />
              </div>
              <div className="space-y-5 border-l border-ink/10 pl-8 md:pl-8">
                <div className="flex items-center gap-2">
                  <div className="h-1 w-8 rounded bg-gold"></div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold">Українська</p>
                </div>
                {active.text.uk.split("\n\n").map((paragraph, idx) => (
                  <p key={`uk-${idx}`} className="text-base leading-7 text-ink/90">
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
          ) : viewMode === "pl" ? (
            <ReadingTextHighlighter
              text={active.text.pl}
              level={active.level}
              locale={locale}
              onExplainRequest={handleExplainRequest}
              viewMode="pl"
            />
          ) : (
            <div className="space-y-5">
              {active.text.uk.split("\n\n").map((paragraph, idx) => (
                <p key={`single-${idx}`} className="text-base leading-7 text-ink/90">
                  {paragraph}
                </p>
              ))}
            </div>
          )}
        </div>

        {showGlossary && active.glossary?.length > 0 && (
          <ReadingAccordion
            title={t.reading.glossary}
            icon={<Book size={24} weight="duotone" className="text-moss" />}
            defaultOpen={false}
          >
            <div className="grid gap-3 md:grid-cols-2">
              {active.glossary.map((entry, idx) => (
                <div key={`gloss-${idx}`} className="rounded-2xl border border-ink/10 bg-paper/60 px-4 py-3 text-sm text-ink/70">
                  <span className="font-semibold">{entry.pl}</span> — {entry.uk}
                </div>
              ))}
            </div>
          </ReadingAccordion>
        )}

        {showQuestions && (
          <ReadingAccordion
            title={t.reading.questions}
            icon={<Question size={24} weight="duotone" className="text-gold" />}
            defaultOpen={false}
          >
            {viewMode === "dual" ? (
              <div className="grid gap-4 md:grid-cols-2 text-sm text-ink/70">
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
              <div className="space-y-2 text-sm text-ink/70">
                {(viewMode === "pl" ? active.questions.pl : active.questions.uk).map((q, idx) => (
                  <p key={`qs-${idx}`}>{q}</p>
                ))}
              </div>
            )}
          </ReadingAccordion>
        )}

        {/* AI Glossary */}
        <ReadingGlossary
          text={active.text.pl}
          level={active.level}
          locale={locale}
        />

        {/* AI Comprehension Check */}
        <ReadingComprehension
          text={active.text.pl}
          textId={active.id}
          level={active.level}
          locale={locale}
          viewMode={viewMode}
          textTitle={active.title}
          textTopic={active.topic}
        />
      </section>
        </>
      )}

      {/* Explainer Modal */}
      <ReadingExplainer
        isOpen={showExplainer}
        fragment={selectedFragment}
        explanation={explanation}
        loading={aiLoading}
        error={aiError}
        onClose={() => setShowExplainer(false)}
        onRetry={() => handleExplainRequest(selectedFragment)}
      />

      {/* AI Generator Tab */}
      {activeTab === "ai" && (
        <ReadingAIGenerator locale={locale} />
      )}

      {/* Saved Sessions Tab */}
      {activeTab === "saved" && <ReadingHistory />}
    </div>
  );
}
