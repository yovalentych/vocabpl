"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Cards,
  Plus,
  Trash,
  MagnifyingGlass,
  ArrowLeft,
  ArrowRight,
  Check,
  X,
  Brain,
  BookOpen,
} from "@phosphor-icons/react";
import { csrfFetch } from "@/lib/csrf-client";

interface Card {
  id: string;
  pl: string;
  uk: string;
  createdAt?: string;
}

interface Props {
  locale: "uk" | "pl";
}

type Tab = "list" | "study";

export default function VocabularyPage({ locale }: Props) {
  const [tab, setTab] = useState<Tab>("list");
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [adding, setAdding] = useState(false);
  const [newPl, setNewPl] = useState("");
  const [newUk, setNewUk] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Study mode state
  const [studyCards, setStudyCards] = useState<Card[]>([]);
  const [studyIndex, setStudyIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [studyDone, setStudyDone] = useState(false);
  const [known, setKnown] = useState(0);
  const [unknown, setUnknown] = useState(0);

  const t = {
    title: locale === "uk" ? "Мій словник" : "Mój słownik",
    subtitle: locale === "uk" ? "Особисті флешкартки" : "Osobiste fiszki",
    listTab: locale === "uk" ? "Мої картки" : "Moje karty",
    studyTab: locale === "uk" ? "Повторення" : "Powtarzanie",
    addCard: locale === "uk" ? "Додати картку" : "Dodaj kartę",
    polish: locale === "uk" ? "Польське слово" : "Słowo polskie",
    translation: locale === "uk" ? "Переклад (укр.)" : "Tłumaczenie",
    save: locale === "uk" ? "Зберегти" : "Zapisz",
    cancel: locale === "uk" ? "Скасувати" : "Anuluj",
    search: locale === "uk" ? "Пошук..." : "Szukaj...",
    empty: locale === "uk" ? "Картки відсутні" : "Brak kart",
    emptyHint: locale === "uk"
      ? "Додайте перше слово для вивчення"
      : "Dodaj pierwsze słowo do nauki",
    studyEmpty: locale === "uk" ? "Немає карток для повторення" : "Brak kart do powtarzania",
    studyEmptyHint: locale === "uk"
      ? "Спочатку додайте кілька карток"
      : "Najpierw dodaj kilka kart",
    know: locale === "uk" ? "Знаю" : "Znam",
    dontKnow: locale === "uk" ? "Не знаю" : "Nie znam",
    flip: locale === "uk" ? "Показати переклад" : "Pokaż tłumaczenie",
    done: locale === "uk" ? "Сесію завершено!" : "Sesja zakończona!",
    doneSubtitle: locale === "uk"
      ? "Результати повторення"
      : "Wyniki powtarzania",
    restart: locale === "uk" ? "Повторити ще раз" : "Powtórz jeszcze raz",
    knownLabel: locale === "uk" ? "Знаю" : "Znam",
    unknownLabel: locale === "uk" ? "Не знаю" : "Nie znam",
    subscriptionRequired: locale === "uk"
      ? "Для цієї функції потрібна підписка"
      : "Ta funkcja wymaga subskrypcji",
  };

  const loadCards = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/user/words/custom?limit=200");
      if (res.status === 403) {
        setError(t.subscriptionRequired);
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setCards(data.items || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCards();
  }, [loadCards]);

  async function handleAdd() {
    if (!newPl.trim() || !newUk.trim()) return;
    setSaving(true);
    try {
      const res = await csrfFetch("/api/user/words/custom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pl: newPl.trim(), uk: newUk.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setCards((prev) => [data.item, ...prev]);
        setNewPl("");
        setNewUk("");
        setAdding(false);
      } else if (res.status === 409) {
        // already exists — just close form
        setNewPl("");
        setNewUk("");
        setAdding(false);
        await loadCards();
      } else if (res.status === 403) {
        setError(t.subscriptionRequired);
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await csrfFetch(`/api/user/words/custom?id=${id}`, { method: "DELETE" });
      setCards((prev) => prev.filter((c) => c.id !== id));
    } catch {
      // ignore
    }
  }

  function startStudy() {
    const shuffled = [...cards].sort(() => Math.random() - 0.5);
    setStudyCards(shuffled);
    setStudyIndex(0);
    setFlipped(false);
    setStudyDone(false);
    setKnown(0);
    setUnknown(0);
    setTab("study");
  }

  function handleKnow(isKnown: boolean) {
    // Fire-and-forget progress update
    const card = studyCards[studyIndex];
    if (card) {
      csrfFetch("/api/user/words/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wordId: card.id, correct: isKnown }),
      }).catch(() => {});
    }

    if (isKnown) setKnown((n) => n + 1);
    else setUnknown((n) => n + 1);

    if (studyIndex + 1 >= studyCards.length) {
      setStudyDone(true);
    } else {
      setStudyIndex((i) => i + 1);
      setFlipped(false);
    }
  }

  const filtered = search
    ? cards.filter(
        (c) =>
          c.pl.toLowerCase().includes(search.toLowerCase()) ||
          c.uk.toLowerCase().includes(search.toLowerCase())
      )
    : cards;

  const currentCard = studyCards[studyIndex];
  const progress = studyCards.length > 0 ? ((studyIndex) / studyCards.length) * 100 : 0;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">{t.title}</h1>
          <p className="mt-1 text-sm text-ink/60">{t.subtitle}</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-ink/50">
          <Cards size={18} weight="fill" className="text-moss" />
          <span>{cards.length}</span>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-[16px] border border-terracotta/20 bg-terracotta/10 px-4 py-3 text-sm text-terracotta">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6 flex gap-2">
        <button
          onClick={() => setTab("list")}
          className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-all ${
            tab === "list"
              ? "bg-moss text-paper shadow-soft"
              : "border border-ink/15 text-ink/60 hover:bg-ink/5"
          }`}
        >
          <BookOpen size={16} weight={tab === "list" ? "fill" : "regular"} />
          {t.listTab}
        </button>
        <button
          onClick={startStudy}
          disabled={cards.length === 0}
          className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-all disabled:opacity-40 ${
            tab === "study"
              ? "bg-moss text-paper shadow-soft"
              : "border border-ink/15 text-ink/60 hover:bg-ink/5"
          }`}
        >
          <Brain size={16} weight={tab === "study" ? "fill" : "regular"} />
          {t.studyTab}
        </button>
      </div>

      {/* LIST TAB */}
      {tab === "list" && (
        <div className="space-y-4">
          {/* Toolbar */}
          <div className="flex gap-3">
            <div className="relative flex-1">
              <MagnifyingGlass
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40"
              />
              <input
                type="text"
                placeholder={t.search}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-full border border-ink/15 bg-paper py-2.5 pl-9 pr-4 text-sm outline-none focus:border-moss/50 focus:ring-2 focus:ring-moss/10"
              />
            </div>
            <button
              onClick={() => setAdding(true)}
              className="flex items-center gap-2 rounded-full border border-moss/20 bg-moss px-4 py-2.5 text-sm font-semibold text-paper transition-all hover:bg-moss/90"
            >
              <Plus size={16} weight="bold" />
              <span className="hidden sm:inline">{t.addCard}</span>
            </button>
          </div>

          {/* Add form */}
          {adding && (
            <div className="rounded-[20px] border border-moss/20 bg-moss/5 p-5 shadow-soft">
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  autoFocus
                  type="text"
                  placeholder={t.polish}
                  value={newPl}
                  onChange={(e) => setNewPl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                  className="rounded-[12px] border border-ink/15 bg-paper px-4 py-2.5 text-sm outline-none focus:border-moss/50 focus:ring-2 focus:ring-moss/10"
                />
                <input
                  type="text"
                  placeholder={t.translation}
                  value={newUk}
                  onChange={(e) => setNewUk(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                  className="rounded-[12px] border border-ink/15 bg-paper px-4 py-2.5 text-sm outline-none focus:border-moss/50 focus:ring-2 focus:ring-moss/10"
                />
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={handleAdd}
                  disabled={saving || !newPl.trim() || !newUk.trim()}
                  className="rounded-full bg-moss px-5 py-2 text-sm font-semibold text-paper disabled:opacity-50"
                >
                  {t.save}
                </button>
                <button
                  onClick={() => { setAdding(false); setNewPl(""); setNewUk(""); }}
                  className="rounded-full border border-ink/15 px-5 py-2 text-sm text-ink/60 hover:bg-ink/5"
                >
                  {t.cancel}
                </button>
              </div>
            </div>
          )}

          {/* Cards list */}
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-moss border-t-transparent" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-[24px] border border-ink/10 bg-ink/5 p-12 text-center">
              <Cards size={48} weight="thin" className="mx-auto mb-4 text-ink/40" />
              <p className="font-medium text-ink/60">{t.empty}</p>
              <p className="mt-1 text-sm text-ink/40">{t.emptyHint}</p>
            </div>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {filtered.map((card) => (
                <div
                  key={card.id}
                  className="group flex items-center justify-between gap-3 rounded-[16px] border border-ink/10 bg-paper px-4 py-3.5 shadow-soft"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-ink">{card.pl}</div>
                    <div className="mt-0.5 truncate text-sm text-ink/60">{card.uk}</div>
                  </div>
                  <button
                    onClick={() => handleDelete(card.id)}
                    className="shrink-0 rounded-full p-1.5 text-ink/20 opacity-0 transition-all group-hover:opacity-100 hover:bg-terracotta/10 hover:text-terracotta"
                  >
                    <Trash size={15} weight="bold" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* STUDY TAB */}
      {tab === "study" && (
        <div className="space-y-6">
          {studyCards.length === 0 ? (
            <div className="rounded-[24px] border border-ink/10 bg-ink/5 p-12 text-center">
              <Brain size={48} weight="thin" className="mx-auto mb-4 text-ink/40" />
              <p className="font-medium text-ink/60">{t.studyEmpty}</p>
              <p className="mt-1 text-sm text-ink/40">{t.studyEmptyHint}</p>
            </div>
          ) : studyDone ? (
            /* Results screen */
            <div className="rounded-[32px] border border-ink/10 bg-paper p-10 text-center shadow-soft">
              <div className="mb-6 text-5xl">🎉</div>
              <h2 className="text-2xl font-semibold">{t.done}</h2>
              <p className="mt-1 text-sm text-ink/60">{t.doneSubtitle}</p>
              <div className="mx-auto mt-8 grid max-w-xs grid-cols-2 gap-4">
                <div className="rounded-[20px] border border-moss/20 bg-moss/10 p-4">
                  <div className="text-3xl font-bold text-moss">{known}</div>
                  <div className="mt-1 text-xs text-moss/70">{t.knownLabel}</div>
                </div>
                <div className="rounded-[20px] border border-terracotta/20 bg-terracotta/10 p-4">
                  <div className="text-3xl font-bold text-terracotta">{unknown}</div>
                  <div className="mt-1 text-xs text-terracotta/70">{t.unknownLabel}</div>
                </div>
              </div>
              <button
                onClick={startStudy}
                className="mt-8 rounded-full border border-moss/20 bg-moss px-8 py-3 font-semibold text-paper transition-all hover:bg-moss/90"
              >
                {t.restart}
              </button>
            </div>
          ) : (
            <>
              {/* Progress bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-ink/50">
                  <span>{studyIndex + 1} / {studyCards.length}</span>
                  <span className="flex gap-3">
                    <span className="text-moss">{known} ✓</span>
                    <span className="text-terracotta">{unknown} ✗</span>
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink/10">
                  <div
                    className="h-full rounded-full bg-moss transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* Flip card */}
              <div
                className="cursor-pointer select-none"
                onClick={() => setFlipped((f) => !f)}
                style={{ perspective: "1000px" }}
              >
                <div
                  className="relative h-64 sm:h-72 w-full transition-transform duration-500"
                  style={{
                    transformStyle: "preserve-3d",
                    transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
                  }}
                >
                  {/* Front */}
                  <div
                    className="absolute inset-0 flex flex-col items-center justify-center rounded-[32px] border border-ink/10 bg-gradient-to-br from-moss/10 to-paper p-8 shadow-soft"
                    style={{ backfaceVisibility: "hidden" }}
                  >
                    <div className="mb-3 text-xs uppercase tracking-[0.25em] text-ink/40">
                      {locale === "uk" ? "Польська" : "Polski"}
                    </div>
                    <div className="text-center text-3xl font-semibold text-ink">
                      {currentCard?.pl}
                    </div>
                    <div className="mt-6 text-xs text-ink/30">{t.flip}</div>
                  </div>
                  {/* Back */}
                  <div
                    className="absolute inset-0 flex flex-col items-center justify-center rounded-[32px] border border-moss/20 bg-gradient-to-br from-moss/15 to-paper p-8 shadow-soft"
                    style={{
                      backfaceVisibility: "hidden",
                      transform: "rotateY(180deg)",
                    }}
                  >
                    <div className="mb-3 text-xs uppercase tracking-[0.25em] text-ink/40">
                      {locale === "uk" ? "Переклад" : "Tłumaczenie"}
                    </div>
                    <div className="text-center text-3xl font-semibold text-moss">
                      {currentCard?.uk}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              {flipped ? (
                <div className="flex gap-4">
                  <button
                    onClick={() => handleKnow(false)}
                    className="flex flex-1 items-center justify-center gap-2 rounded-full border border-terracotta/20 bg-terracotta/10 py-4 font-semibold text-terracotta transition-all hover:bg-terracotta/20 active:scale-95"
                  >
                    <X size={20} weight="bold" />
                    {t.dontKnow}
                  </button>
                  <button
                    onClick={() => handleKnow(true)}
                    className="flex flex-1 items-center justify-center gap-2 rounded-full border border-moss/20 bg-moss py-4 font-semibold text-paper transition-all hover:bg-moss/90 active:scale-95"
                  >
                    <Check size={20} weight="bold" />
                    {t.know}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setFlipped(true)}
                  className="w-full rounded-full border border-ink/15 bg-paper py-4 font-semibold text-ink/70 transition-all hover:bg-ink/5 active:scale-95"
                >
                  {t.flip}
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
