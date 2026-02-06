"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { Word } from "@/lib/types";
import { getPolishAdjectiveDeclensionUrl, getPolishConjugationUrl } from "@/lib/links";
import { hasConsent, readPrefs, writePrefs } from "@/lib/prefs";

export default function WordsList() {
  const { t } = useLocale();
  const [type, setType] = useState<
    | "all"
    | "verbs"
    | "adverbs"
    | "adjectives"
    | "slang"
    | "others"
    | "soft_swears"
    | "clean_emotions"
    | "abbreviations"
    | "aspect_pairs"
    | "favorites"
    | "my_words"
  >("all");
  const [sort, setSort] = useState<"plAsc" | "plDesc" | "ukAsc" | "ukDesc">("plAsc");
  const [search, setSearch] = useState("");
  const [items, setItems] = useState<(Word & { duplicate?: boolean })[]>([]);
  const [pairItems, setPairItems] = useState<
    { id: string; imp: { pl: string; uk: string }; perf: { pl: string; uk: string }; pos: string }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [locked, setLocked] = useState(false);
  const [progressMap, setProgressMap] = useState<
    Record<string, { seenCount: number; correctCount: number; lastSeen?: string }>
  >({});
  const [hideTranslations, setHideTranslations] = useState(false);
  const [revealedMap, setRevealedMap] = useState<Record<string, boolean>>({});
  const [markedMap, setMarkedMap] = useState<Record<string, boolean>>({});
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [favoriteWords, setFavoriteWords] = useState<Word[]>([]);
  const [myWordsTick, setMyWordsTick] = useState(0);
  const [trainerOpen, setTrainerOpen] = useState(false);
  const [trainerStep, setTrainerStep] = useState<"setup" | "train" | "done">("setup");
  const [trainerMode, setTrainerMode] = useState<"mcq" | "typing" | "flash">("mcq");
  const [trainerDirection, setTrainerDirection] = useState<"pluk" | "ukpl" | "mixed">("pluk");
  const [trainerCount, setTrainerCount] = useState<10 | 20 | 30 | 50>(20);
  const [trainerParts, setTrainerParts] = useState<
    | "all"
    | "verbs"
    | "adverbs"
    | "adjectives"
    | "slang"
    | "others"
    | "soft_swears"
    | "clean_emotions"
    | "abbreviations"
    | "my_words"
  >("all");
  const [trainerQueue, setTrainerQueue] = useState<Word[]>([]);
  const [trainerIndex, setTrainerIndex] = useState(0);
  const [trainerAnswer, setTrainerAnswer] = useState("");
  const [trainerReveal, setTrainerReveal] = useState(false);
  const [trainerCorrect, setTrainerCorrect] = useState<Record<string, boolean>>({});
  const [trainerOptions, setTrainerOptions] = useState<Record<string, string[]>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPl, setEditPl] = useState("");
  const [editUk, setEditUk] = useState("");
  const [editStatus, setEditStatus] = useState<"idle" | "saving" | "error">("idle");
  const [activeLetter, setActiveLetter] = useState<string>("all");

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      if (type === "favorites") {
        setItems(favoriteWords);
        setPairItems([]);
        setLocked(false);
        setLoading(false);
        return;
      }
      if (type === "my_words") {
        const res = await fetch(`/api/user/words/custom?search=${encodeURIComponent(search || "")}`);
        const data = await res.json();
        if (mounted) {
          setItems(data.items || []);
          setPairItems([]);
          setLocked(false);
          setLoading(false);
        }
        return;
      }
      if (type === "aspect_pairs") {
        const res = await fetch("/api/verb-pairs");
        const data = await res.json();
        if (mounted) {
          setLocked(Boolean(data.locked));
          const list = (data.items || []).filter((item: any) => {
            if (!search.trim()) return true;
            const needle = search.trim().toLowerCase();
            return (
              item.imp?.pl?.toLowerCase().includes(needle) ||
              item.imp?.uk?.toLowerCase().includes(needle) ||
              item.perf?.pl?.toLowerCase().includes(needle) ||
              item.perf?.uk?.toLowerCase().includes(needle)
            );
          });
          setPairItems(list);
          setItems([]);
          setLoading(false);
        }
        return;
      }
      const params = new URLSearchParams();
      if (type !== "all") params.set("type", type);
      params.set("limit", "2000");
      if (search.trim()) params.set("search", search.trim());
      const res = await fetch(`/api/words?${params.toString()}`);
      const data = await res.json();
      if (mounted) {
        setLocked(Boolean(data.locked));
        setItems(data.items || []);
        setPairItems([]);
        setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [type, search, favoriteWords, myWordsTick]);

  useEffect(() => {
    setActiveLetter("all");
  }, [type, search]);

  useEffect(() => {
    let mounted = true;
    async function loadProgress() {
      const res = await fetch("/api/user/words/progress");
      if (!res.ok) return;
      const data = await res.json();
      if (!mounted) return;
      const map: Record<string, { seenCount: number; correctCount: number; lastSeen?: string }> = {};
      for (const entry of data.wordProgress || []) {
        if (!entry?.wordId) continue;
        map[entry.wordId] = {
          seenCount: Number(entry.seenCount || 0),
          correctCount: Number(entry.correctCount || 0),
          lastSeen: entry.lastSeen
        };
      }
      setProgressMap(map);
    }
    loadProgress();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!hasConsent()) return;
    const prefs = readPrefs();
    if (!prefs) return;
    if (prefs.wordsSort) setSort(prefs.wordsSort as typeof sort);
    if (typeof prefs.hideTranslations === "boolean") setHideTranslations(prefs.hideTranslations);
    if (prefs.trainerMode) setTrainerMode(prefs.trainerMode as typeof trainerMode);
    if (prefs.trainerDirection) setTrainerDirection(prefs.trainerDirection as typeof trainerDirection);
    if (prefs.trainerCount) setTrainerCount(prefs.trainerCount as typeof trainerCount);
    if (prefs.trainerParts) setTrainerParts(prefs.trainerParts as typeof trainerParts);
  }, []);

  useEffect(() => {
    if (!hasConsent()) return;
    const current = readPrefs() || {};
    writePrefs({
      ...current,
      wordsSort: sort,
      hideTranslations,
      trainerMode,
      trainerDirection,
      trainerCount,
      trainerParts
    });
  }, [sort, hideTranslations, trainerMode, trainerDirection, trainerCount, trainerParts]);

  useEffect(() => {
    let mounted = true;
    async function loadFavorites() {
      const res = await fetch("/api/user/favorites");
      if (!res.ok) return;
      const data = await res.json();
      if (!mounted) return;
      const ids = Array.isArray(data.favorites) ? data.favorites : [];
      setFavoriteIds(new Set(ids));
    }
    loadFavorites();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    async function loadFavoriteWords(ids: string[]) {
      if (!ids.length) {
        setFavoriteWords([]);
        return;
      }
      const res = await fetch(`/api/words?ids=${ids.join(",")}`);
      const data = await res.json();
      if (!mounted) return;
      setFavoriteWords(data.items || []);
    }
    loadFavoriteWords(Array.from(favoriteIds));
    return () => {
      mounted = false;
    };
  }, [favoriteIds]);

  useEffect(() => {
    function handleMyWordsUpdated() {
      setMyWordsTick((prev) => prev + 1);
    }
    window.addEventListener("my-words-updated", handleMyWordsUpdated);
    return () => window.removeEventListener("my-words-updated", handleMyWordsUpdated);
  }, []);


  const sortField = useMemo(() => (sort.startsWith("uk") ? "uk" : "pl"), [sort]);

  const sortedItems = useMemo(() => {
    const list = items.slice();
    const compare = (a: Word, b: Word, field: "pl" | "uk", dir: "asc" | "desc") => {
      const locale = field === "uk" ? "uk" : "pl";
      const result = a[field].localeCompare(b[field], locale);
      return dir === "asc" ? result : -result;
    };
    switch (sort) {
      case "plDesc":
        list.sort((a, b) => compare(a, b, "pl", "desc"));
        break;
      case "ukAsc":
        list.sort((a, b) => compare(a, b, "uk", "asc"));
        break;
      case "ukDesc":
        list.sort((a, b) => compare(a, b, "uk", "desc"));
        break;
      default:
        list.sort((a, b) => compare(a, b, "pl", "asc"));
        break;
    }
    return list;
  }, [items, sort]);

  const groupedItems = useMemo(() => {
    const groups = new Map<string, Word[]>();
    for (const word of sortedItems) {
      const value = sortField === "uk" ? word.uk : word.pl;
      const letter = value?.trim().charAt(0).toUpperCase() || "#";
      if (!groups.has(letter)) groups.set(letter, []);
      groups.get(letter)?.push(word);
    }
    return Array.from(groups.entries());
  }, [sortedItems, sortField]);

  const pairGroups = useMemo(() => {
    const list = pairItems.slice();
    list.sort((a, b) => a.imp.pl.localeCompare(b.imp.pl, "pl"));
    const groups = new Map<string, typeof pairItems>();
    for (const item of list) {
      const letter = item.imp.pl?.trim().charAt(0).toUpperCase() || "#";
      if (!groups.has(letter)) groups.set(letter, []);
      groups.get(letter)?.push(item);
    }
    return Array.from(groups.entries());
  }, [pairItems]);

  function getDecaySteps(lastSeen?: string) {
    if (!lastSeen) return 0;
    const last = new Date(lastSeen).getTime();
    if (Number.isNaN(last)) return 0;
    const days = Math.floor((Date.now() - last) / (1000 * 60 * 60 * 24));
    return days >= 5 ? Math.floor(days / 5) : 0;
  }

  function getFilledDots(wordId: string) {
    const progress = progressMap[wordId];
    if (!progress) return 0;
    const base = Math.min(5, Math.max(progress.correctCount || progress.seenCount || 0, 0));
    const decay = getDecaySteps(progress.lastSeen);
    return Math.max(0, base - decay);
  }

  async function markWord(wordId: string, correct: boolean) {
    if (markedMap[wordId]) return;
    setMarkedMap((prev) => ({ ...prev, [wordId]: true }));
    const res = await fetch("/api/user/words/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wordId, correct, incrementSession: false })
    }).catch(() => null);
    if (!res) return;
    const data = await res.json().catch(() => ({}));
    if (data?.throttled) return;
    setProgressMap((prev) => {
      const current = prev[wordId] || { seenCount: 0, correctCount: 0 };
      return {
        ...prev,
        [wordId]: {
          seenCount: current.seenCount + 1,
          correctCount: current.correctCount + (correct ? 1 : 0),
          lastSeen: new Date().toISOString()
        }
      };
    });
  }

  function shuffle<T>(list: T[]) {
    const copy = list.slice();
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function getDirectionForIndex(index: number) {
    if (trainerDirection === "mixed") {
      return index % 2 === 0 ? "pluk" : "ukpl";
    }
    return trainerDirection;
  }

  function getFront(word: Word, direction: "pluk" | "ukpl") {
    return direction === "pluk" ? word.pl : word.uk;
  }

  function getBack(word: Word, direction: "pluk" | "ukpl") {
    return direction === "pluk" ? word.uk : word.pl;
  }

  async function startTrainer() {
    let list: Word[] = [];
    let pool: Word[] = [];
    if (trainerParts === "my_words") {
      const res = await fetch(`/api/user/words/custom?limit=${trainerCount}`);
      const data = await res.json();
      const items: Word[] = Array.isArray(data.items) ? (data.items as Word[]) : [];
      list = shuffle(items).slice(0, trainerCount);
      pool = list;
    } else {
      const params = new URLSearchParams();
      params.set("count", String(trainerCount));
      if (trainerParts !== "all") params.set("type", trainerParts);
      const res = await fetch(`/api/words/random?${params.toString()}`);
      const data = await res.json();
      const items: Word[] = Array.isArray(data.items) ? (data.items as Word[]) : [];
      list = shuffle(items);

      const poolRes = await fetch("/api/words?limit=200");
      const poolData = await poolRes.json();
      pool = Array.isArray(poolData.items) ? (poolData.items as Word[]) : [];
    }

    const optionsMap: Record<string, string[]> = {};
    if (trainerMode === "mcq") {
      for (let idx = 0; idx < list.length; idx += 1) {
        const item = list[idx];
        const direction = getDirectionForIndex(idx);
        const correct = getBack(item, direction as "pluk" | "ukpl");
        const distractors = shuffle(
          pool
            .filter((candidate: Word) => candidate.id !== item.id)
            .map((candidate: Word) => getBack(candidate, direction as "pluk" | "ukpl"))
        ).slice(0, 3);
        optionsMap[item.id] = shuffle([correct, ...distractors]);
      }
    }
    setTrainerOptions(optionsMap);
    setTrainerQueue(list);
    setTrainerIndex(0);
    setTrainerAnswer("");
    setTrainerReveal(false);
    setTrainerCorrect({});
    setTrainerStep("train");
  }

  function checkAnswer(word: Word, value: string) {
    const direction = getDirectionForIndex(trainerIndex);
    const expected = getBack(word, direction).trim().toLowerCase();
    const actual = value.trim().toLowerCase();
    return expected === actual;
  }

  function markTrainerResult(word: Word, correct: boolean) {
    setTrainerCorrect((prev) => ({ ...prev, [word.id]: correct }));
    markWord(word.id, correct);
  }

  function nextTrainer() {
    if (trainerIndex >= trainerQueue.length - 1) {
      setTrainerStep("done");
      return;
    }
    setTrainerIndex((prev) => prev + 1);
    setTrainerAnswer("");
    setTrainerReveal(false);
  }

  async function toggleFavorite(wordId: string) {
    const isFavorite = favoriteIds.has(wordId);
    await fetch("/api/user/favorites", {
      method: isFavorite ? "DELETE" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wordId })
    }).catch(() => null);
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      if (isFavorite) {
        next.delete(wordId);
      } else {
        next.add(wordId);
      }
      return next;
    });
  }

  async function deleteMyWord(wordId: string) {
    await fetch(`/api/user/words/custom?id=${encodeURIComponent(wordId)}`, {
      method: "DELETE"
    }).catch(() => null);
    setMyWordsTick((prev) => prev + 1);
  }

  function startEdit(word: Word & { duplicate?: boolean }) {
    setEditingId(word.id);
    setEditPl(word.pl);
    setEditUk(word.uk);
    setEditStatus("idle");
  }

  async function saveEdit() {
    if (!editingId) return;
    setEditStatus("saving");
    const res = await fetch("/api/user/words/custom", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: editingId, pl: editPl, uk: editUk })
    }).catch(() => null);
    if (!res || !res.ok) {
      setEditStatus("error");
      return;
    }
    setEditStatus("idle");
    setEditingId(null);
    setEditPl("");
    setEditUk("");
    setMyWordsTick((prev) => prev + 1);
  }

  function getTypeLabel(type: Word["type"]) {
    const map: Record<Word["type"], string> = {
      verb: t.deck.verbs,
      adverb: t.deck.adverbs,
      adjective: t.deck.adjectives,
      slang: t.deck.slang,
      others: t.deck.others,
      soft_swears: t.deck.softSwears,
      clean_emotions: t.deck.cleanEmotions,
      abbreviations: t.deck.abbreviations,
      aspect_pairs: t.deck.aspectPairs,
      my_words: t.words.myWords
    };
    return map[type] || type;
  }

  function renderWordCard(word: Word & { duplicate?: boolean }) {
    return (
      <div
        key={word.id}
        className="rounded-2xl border border-ink/10 bg-paper/95 p-4 shadow-soft transition hover:-translate-y-[1px] hover:border-ink/20"
        onClick={() => {
          if (!hideTranslations) return;
          setRevealedMap((prev) => ({ ...prev, [word.id]: !prev[word.id] }));
          setMarkedMap((prev) => ({ ...prev, [word.id]: false }));
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <p className="text-[11px] uppercase tracking-[0.3em] text-ink/40">{getTypeLabel(word.type)}</p>
            {type === "my_words" && editingId === word.id ? (
              <div className="mt-3 grid gap-2">
                <input
                  value={editPl}
                  onChange={(event) => setEditPl(event.target.value)}
                  className="w-full rounded-xl border border-ink/20 bg-paper px-3 py-2 text-sm"
                />
                <input
                  value={editUk}
                  onChange={(event) => setEditUk(event.target.value)}
                  className="w-full rounded-xl border border-ink/20 bg-paper px-3 py-2 text-sm"
                />
              </div>
            ) : (
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <p className="text-lg font-semibold text-ink">
                  {sortField === "uk" ? word.uk : word.pl}
                </p>
                <span className="text-xs text-ink/30">·</span>
                <p className="text-sm text-ink/60">
                  {hideTranslations && !revealedMap[word.id]
                    ? "•••••"
                    : sortField === "uk"
                      ? word.pl
                      : word.uk}
                </p>
              </div>
            )}
            {hideTranslations && revealedMap[word.id] && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    markWord(word.id, true);
                  }}
                  className="rounded-full bg-moss px-3 py-1 text-[11px] font-semibold text-paper disabled:opacity-60"
                  disabled={markedMap[word.id]}
                >
                  {t.common.know}
                </button>
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    markWord(word.id, false);
                  }}
                  className="rounded-full border border-ink/20 px-3 py-1 text-[11px] font-semibold text-ink disabled:opacity-60"
                  disabled={markedMap[word.id]}
                >
                  {t.common.dontKnow}
                </button>
              </div>
            )}
          </div>
          {type !== "my_words" && (
            <button
              onClick={(event) => {
                event.stopPropagation();
                toggleFavorite(word.id);
              }}
              className={`rounded-full border px-2 py-1 text-xs ${
                favoriteIds.has(word.id)
                  ? "border-amber-400 bg-amber-200/60 text-amber-900"
                  : "border-ink/10 text-ink/50 hover:border-ink/20"
              }`}
              aria-label="favorite"
            >
              {favoriteIds.has(word.id) ? "★" : "☆"}
            </button>
          )}
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, idx) => {
              const filled = getFilledDots(word.id);
              const active = idx < filled;
              return (
                <span
                  key={`${word.id}-dot-${idx}`}
                  className={`h-2 w-2 rounded-full border ${
                    active ? "border-moss bg-moss" : "border-ink/20 bg-paper"
                  }`}
                />
              );
            })}
          </div>
          {word.type === "verb" && (
            <a
              href={getPolishConjugationUrl(word.pl)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-full border border-ink/20 px-3 py-1 text-[11px] font-semibold text-ink hover:bg-ink/5"
            >
              {t.common.conjugation}
            </a>
          )}
          {word.type === "adjective" && (
            <a
              href={getPolishAdjectiveDeclensionUrl(word.pl)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-full border border-ink/20 px-3 py-1 text-[11px] font-semibold text-ink hover:bg-ink/5"
            >
              {t.common.declension}
            </a>
          )}
        </div>
        {type === "my_words" && (
          <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-ink/50">
            {editingId === word.id ? (
              <>
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    saveEdit();
                  }}
                  className="rounded-full border border-ink/20 px-3 py-1 font-semibold text-ink hover:bg-ink/5 disabled:opacity-60"
                  disabled={!editPl.trim() || !editUk.trim() || editStatus === "saving"}
                >
                  {editStatus === "saving" ? t.common.loading : t.common.save}
                </button>
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    setEditingId(null);
                    setEditStatus("idle");
                  }}
                  className="rounded-full border border-ink/10 px-3 py-1"
                >
                  {t.common.cancel}
                </button>
                {editStatus === "error" && <span className="text-terracotta">{t.words.addError}</span>}
              </>
            ) : (
              <>
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    startEdit(word);
                  }}
                  className="rounded-full border border-ink/10 px-3 py-1 hover:border-ink/20"
                >
                  {t.common.edit}
                </button>
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    deleteMyWord(word.id);
                  }}
                  className="rounded-full border border-ink/10 px-3 py-1 hover:border-ink/20"
                >
                  {t.common.delete}
                </button>
              </>
            )}
          </div>
        )}
        {type === "my_words" && word.duplicate && (
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-ink/60">
            <span>{t.words.duplicateHint}</span>
            <button
              onClick={(event) => {
                event.stopPropagation();
                deleteMyWord(word.id);
              }}
              className="rounded-full border border-ink/20 px-3 py-1 text-[11px] font-semibold text-ink hover:bg-ink/5"
            >
              {t.words.removeDuplicate}
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className={`space-y-4 ${locked ? "opacity-60" : ""}`}>
        <div className="flex flex-wrap gap-2">
          {[
            { id: "all", label: t.deck.all },
            { id: "verbs", label: t.deck.verbs },
            { id: "adverbs", label: t.deck.adverbs },
            { id: "adjectives", label: t.deck.adjectives },
            { id: "slang", label: t.deck.slang },
            { id: "others", label: t.deck.others },
            { id: "soft_swears", label: t.deck.softSwears },
            { id: "clean_emotions", label: t.deck.cleanEmotions },
            { id: "abbreviations", label: t.deck.abbreviations },
            { id: "aspect_pairs", label: t.deck.aspectPairs },
            { id: "favorites", label: t.cabinet.tabs.favorites },
            { id: "my_words", label: t.words.myWords }
          ].map((option) => (
            <button
              key={option.id}
              onClick={() => setType(option.id as typeof type)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                type === option.id
                  ? "bg-ink text-paper"
                  : "border border-ink/20 text-ink hover:bg-ink/5"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t.common.search}
            className="w-full rounded-full border border-ink/20 bg-paper px-4 py-2 text-sm"
          />
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-[0.2em] text-ink/40">{t.deck.sortLabel}</span>
              <select
                value={sort}
                onChange={(event) => setSort(event.target.value as typeof sort)}
                className="rounded-full border border-ink/20 bg-paper px-3 py-2 text-xs"
              >
                <option value="plAsc">{t.deck.sortOptions.plAsc}</option>
                <option value="plDesc">{t.deck.sortOptions.plDesc}</option>
                <option value="ukAsc">{t.deck.sortOptions.ukAsc}</option>
                <option value="ukDesc">{t.deck.sortOptions.ukDesc}</option>
              </select>
            </div>
            <label className="flex items-center gap-2 text-xs text-ink/60">
              <input
                type="checkbox"
                checked={hideTranslations}
                onChange={(event) => {
                  setHideTranslations(event.target.checked);
                  setRevealedMap({});
                  setMarkedMap({});
                }}
                className="accent-ink"
              />
              {t.common.hideTranslation}
            </label>
            <button
              onClick={() => setTrainerOpen(true)}
              className="rounded-full border border-ink/20 px-4 py-2 text-xs font-semibold text-ink hover:bg-ink/5 disabled:opacity-60"
              disabled={locked}
            >
              {t.deck.trainerOpen}
            </button>
          </div>
        </div>
      </div>

      {type === "all" && groupedItems.length > 1 && (
        <div className="rounded-3xl border border-ink/10 bg-paper/80 p-5 shadow-soft">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-ink/40">{t.deck.indexTitle}</p>
              <p className="text-sm text-ink/60">{t.deck.indexHint}</p>
            </div>
            <div className="flex flex-wrap items-center gap-1">
              <button
                onClick={() => setActiveLetter("all")}
                className={`h-9 rounded-full border px-3 text-[11px] font-semibold ${
                  activeLetter === "all"
                    ? "border-ink bg-ink text-paper"
                    : "border-ink/10 bg-paper text-ink/70 hover:border-ink/30 hover:bg-ink/5"
                }`}
              >
                {t.deck.indexAll}
              </button>
              {groupedItems.map(([letter]) => (
                <button
                  key={`jump-${letter}`}
                  onClick={() => setActiveLetter(letter)}
                  className={`h-9 w-9 rounded-full border text-xs font-semibold ${
                    activeLetter === letter
                      ? "border-ink bg-ink text-paper"
                      : "border-ink/10 bg-paper text-ink/70 hover:border-ink/30 hover:bg-ink/5"
                  }`}
                >
                  {letter}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {locked && (
        <div className="rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft">
          <h2 className="text-2xl font-semibold">{t.paywall.title}</h2>
          <p className="mt-2 text-sm text-ink/60">{t.paywall.dictionary}</p>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-ink/60">{t.common.loading}</p>
      ) : (
        <div className="space-y-8">
          {type === "aspect_pairs"
            ? pairGroups.map(([letter, group]) => (
                <div key={`pairs-${letter}`} id={`pairs-${letter}`}>
                  <div className="mb-4 flex items-center gap-3">
                    <div className="rounded-2xl border border-ink/10 bg-paper/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-ink/60">
                      {letter}
                    </div>
                    <div className="h-px flex-1 bg-ink/10" />
                    <span className="text-xs text-ink/40">{group.length}</span>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {group.map((pair) => (
                      <div
                        key={pair.id}
                        className="rounded-2xl border border-ink/10 bg-paper/95 p-4 shadow-soft"
                      >
                        <p className="text-[11px] uppercase tracking-[0.3em] text-ink/40">
                          {t.deck.aspectPairs}
                        </p>
                        <div className="mt-2 space-y-2">
                          <div>
                            <p className="text-xs uppercase tracking-[0.2em] text-ink/40">
                              {t.deck.aspectImperfective}
                            </p>
                            <p className="text-lg font-semibold text-ink">
                              {pair.imp.pl} · {pair.imp.uk}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-[0.2em] text-ink/40">
                              {t.deck.aspectPerfective}
                            </p>
                            <p className="text-lg font-semibold text-ink">
                              {pair.perf.pl} · {pair.perf.uk}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            : groupedItems
                .filter(([letter]) => activeLetter === "all" || letter === activeLetter)
                .map(([letter, group]) => (
            <div key={letter} id={`letter-${letter}`}>
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-2xl border border-ink/10 bg-paper/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-ink/60">
                  {letter}
                </div>
                <div className="h-px flex-1 bg-ink/10" />
                <span className="text-xs text-ink/40">{group.length}</span>
              </div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {group.map((word) => renderWordCard(word))}
              </div>
            </div>
          ))}
        </div>
      )}

      {trainerOpen && !locked && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 px-4">
          <div className="w-full max-w-4xl rounded-3xl border border-ink/10 bg-paper p-6 shadow-soft">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">{t.deck.trainerTitle}</h2>
              <button
                onClick={() => {
                  setTrainerOpen(false);
                  setTrainerStep("setup");
                }}
                className="rounded-full border border-ink/20 px-3 py-1 text-xs font-semibold"
              >
                {t.deck.trainerClose}
              </button>
            </div>

            {trainerStep === "setup" && (
              <div className="mt-6 grid gap-6 md:grid-cols-2">
                <div className="rounded-2xl border border-ink/10 bg-paper/80 p-5">
                  <p className="text-xs uppercase tracking-[0.3em] text-ink/40">{t.deck.trainerParts}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                      {[
                        { id: "all", label: t.deck.trainerAll },
                        { id: "verbs", label: t.deck.verbs },
                        { id: "adverbs", label: t.deck.adverbs },
                        { id: "adjectives", label: t.deck.adjectives },
                        { id: "slang", label: t.deck.slang },
                        { id: "others", label: t.deck.others },
                        { id: "soft_swears", label: t.deck.softSwears },
                        { id: "clean_emotions", label: t.deck.cleanEmotions },
                        { id: "abbreviations", label: t.deck.abbreviations },
                        { id: "my_words", label: t.words.myWords }
                      ].map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setTrainerParts(item.id as typeof trainerParts)}
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          trainerParts === item.id ? "bg-ink text-paper" : "border border-ink/20 text-ink"
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="rounded-2xl border border-ink/10 bg-paper/80 p-5">
                  <p className="text-xs uppercase tracking-[0.3em] text-ink/40">{t.deck.trainerCount}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {[10, 20, 30, 50].map((count) => (
                      <button
                        key={count}
                        onClick={() => setTrainerCount(count as typeof trainerCount)}
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          trainerCount === count ? "bg-ink text-paper" : "border border-ink/20 text-ink"
                        }`}
                      >
                        {count}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="rounded-2xl border border-ink/10 bg-paper/80 p-5">
                  <p className="text-xs uppercase tracking-[0.3em] text-ink/40">{t.deck.trainerDirection}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {[
                      { id: "pluk", label: t.deck.trainerDirections.pluk },
                      { id: "ukpl", label: t.deck.trainerDirections.ukpl },
                      { id: "mixed", label: t.deck.trainerDirections.mixed }
                    ].map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setTrainerDirection(item.id as typeof trainerDirection)}
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          trainerDirection === item.id ? "bg-ink text-paper" : "border border-ink/20 text-ink"
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="rounded-2xl border border-ink/10 bg-paper/80 p-5">
                  <p className="text-xs uppercase tracking-[0.3em] text-ink/40">{t.deck.trainerMode}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {[
                      { id: "mcq", label: t.deck.trainerModes.mcq },
                      { id: "typing", label: t.deck.trainerModes.typing },
                      { id: "flash", label: t.deck.trainerModes.flash }
                    ].map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setTrainerMode(item.id as typeof trainerMode)}
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          trainerMode === item.id ? "bg-ink text-paper" : "border border-ink/20 text-ink"
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="md:col-span-2 flex justify-end">
                  <button
                    onClick={startTrainer}
                    className="rounded-full bg-ink px-5 py-2 text-xs font-semibold text-paper"
                  >
                    {t.deck.trainerStart}
                  </button>
                </div>
              </div>
            )}

            {trainerStep === "train" && trainerQueue[trainerIndex] && (
              <div className="mt-6 grid gap-6 md:grid-cols-[1.2fr_0.8fr]">
                <div className="rounded-2xl border border-ink/10 bg-paper/80 p-6">
                  <p className="text-xs uppercase tracking-[0.3em] text-ink/40">
                    {t.deck.trainerStep} {trainerIndex + 1} / {trainerQueue.length}
                  </p>
                  <h3 className="mt-3 text-3xl font-semibold">
                    {getFront(trainerQueue[trainerIndex], getDirectionForIndex(trainerIndex))}
                  </h3>
                  {trainerMode === "typing" && (
                    <div className="mt-6 space-y-4">
                      <label className="block text-sm text-ink/70">
                        {t.deck.trainerYourAnswer}
                        <input
                          value={trainerAnswer}
                          onChange={(event) => setTrainerAnswer(event.target.value)}
                          className="mt-2 w-full rounded-2xl border border-ink/20 bg-paper px-4 py-3"
                        />
                      </label>
                      <button
                        onClick={() => {
                          const current = trainerQueue[trainerIndex];
                          const ok = checkAnswer(current, trainerAnswer);
                          markTrainerResult(current, ok);
                          nextTrainer();
                        }}
                        className="rounded-full bg-ink px-5 py-2 text-xs font-semibold text-paper"
                      >
                        {trainerIndex < trainerQueue.length - 1 ? t.deck.trainerNext : t.deck.trainerFinish}
                      </button>
                    </div>
                  )}
                  {trainerMode === "mcq" && (
                    <div className="mt-6 space-y-3">
                      {(trainerOptions[trainerQueue[trainerIndex].id] || []).map((option) => (
                        <button
                          key={option}
                          onClick={() => {
                            const current = trainerQueue[trainerIndex];
                            const direction = getDirectionForIndex(trainerIndex);
                            const correctAnswer = getBack(current, direction);
                            const ok = option === correctAnswer;
                            markTrainerResult(current, ok);
                            nextTrainer();
                          }}
                          className="w-full rounded-2xl border border-ink/10 bg-paper/70 px-4 py-3 text-left text-sm text-ink/70 hover:border-ink/30"
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  )}
                  {trainerMode === "flash" && (
                    <div className="mt-6 space-y-4">
                      <button
                        onClick={() => setTrainerReveal((prev) => !prev)}
                        className="rounded-full border border-ink/20 px-4 py-2 text-xs font-semibold text-ink"
                      >
                        {t.deck.trainerReveal}
                      </button>
                      {trainerReveal && (
                        <p className="text-lg text-ink/70">
                          {getBack(trainerQueue[trainerIndex], getDirectionForIndex(trainerIndex))}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => {
                            markTrainerResult(trainerQueue[trainerIndex], true);
                            nextTrainer();
                          }}
                          className="rounded-full bg-moss px-4 py-2 text-xs font-semibold text-paper"
                        >
                          {t.deck.trainerKnow}
                        </button>
                        <button
                          onClick={() => {
                            markTrainerResult(trainerQueue[trainerIndex], false);
                            nextTrainer();
                          }}
                          className="rounded-full border border-ink/20 px-4 py-2 text-xs font-semibold text-ink"
                        >
                          {t.deck.trainerDontKnow}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                <div className="rounded-2xl border border-ink/10 bg-paper/80 p-6">
                  <p className="text-xs uppercase tracking-[0.3em] text-ink/40">{t.deck.trainerProgress}</p>
                  <div className="mt-4 grid grid-cols-5 gap-2">
                    {trainerQueue.map((word, idx) => {
                      const status = trainerCorrect[word.id];
                      const active = idx === trainerIndex;
                      return (
                        <div
                          key={word.id}
                          className={`h-2 rounded-full ${
                            status === true
                              ? "bg-moss"
                              : status === false
                                ? "bg-terracotta"
                                : active
                                  ? "bg-ink/40"
                                  : "bg-ink/10"
                          }`}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {trainerStep === "done" && (
              <div className="mt-6 rounded-2xl border border-ink/10 bg-paper/80 p-6">
                <h3 className="text-2xl font-semibold">{t.deck.trainerScore}</h3>
                <p className="mt-3 text-sm text-ink/70">
                  {Object.values(trainerCorrect).filter(Boolean).length} / {trainerQueue.length}
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    onClick={() => setTrainerStep("setup")}
                    className="rounded-full border border-ink/20 px-4 py-2 text-xs font-semibold"
                  >
                    {t.deck.trainerSetup}
                  </button>
                  <button
                    onClick={() => setTrainerOpen(false)}
                    className="rounded-full bg-ink px-5 py-2 text-xs font-semibold text-paper"
                  >
                    {t.deck.trainerClose}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
