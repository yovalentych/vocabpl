"use client";

import { Word } from "@/lib/types";
import { useLocale } from "@/components/LocaleProvider";
import { getPolishConjugationUrl, getPolishAdjectiveDeclensionUrl } from "@/lib/links";
import { Sparkle } from "@phosphor-icons/react";
import SpeakButton from "@/components/ui/SpeakButton";

interface DictWordCardProps {
  word: Word & { duplicate?: boolean };
  type: string;
  sortField: "pl" | "uk";
  hideTranslations: boolean;
  revealedMap: Record<string, boolean>;
  markedMap: Record<string, boolean>;
  favoriteIds: Set<string>;
  progressMap: Record<string, { seenCount: number; correctCount: number; lastSeen?: string }>;
  editingId: string | null;
  editPl: string;
  editUk: string;
  editStatus: "idle" | "saving" | "error";
  onToggleFavorite: (wordId: string) => void;
  onMarkWord: (wordId: string, correct: boolean) => void;
  onRevealToggle: (wordId: string) => void;
  onStartEdit: (word: Word) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onDeleteWord: (wordId: string) => void;
  setEditPl: (value: string) => void;
  setEditUk: (value: string) => void;
  onOpenAI: (word: Word) => void;
}

function getDecaySteps(lastSeen?: string) {
  if (!lastSeen) return 0;
  const last = new Date(lastSeen).getTime();
  if (Number.isNaN(last)) return 0;
  const days = Math.floor((Date.now() - last) / (1000 * 60 * 60 * 24));
  return days >= 5 ? Math.floor(days / 5) : 0;
}

function getFilledDots(
  wordId: string,
  progressMap: Record<string, { seenCount: number; correctCount: number; lastSeen?: string }>
) {
  const progress = progressMap[wordId];
  if (!progress) return 0;
  const base = Math.min(5, Math.max(progress.correctCount || progress.seenCount || 0, 0));
  const decay = getDecaySteps(progress.lastSeen);
  return Math.max(0, base - decay);
}

function getTypeLabel(type: Word["type"], t: any) {
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

export default function DictWordCard({
  word,
  type,
  sortField,
  hideTranslations,
  revealedMap,
  markedMap,
  favoriteIds,
  progressMap,
  editingId,
  editPl,
  editUk,
  editStatus,
  onToggleFavorite,
  onMarkWord,
  onRevealToggle,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onDeleteWord,
  setEditPl,
  setEditUk,
  onOpenAI
}: DictWordCardProps) {
  const { t } = useLocale();

  return (
    <div
      key={word.id}
      className="rounded-3xl border border-ink/10 bg-paper/95 p-4 shadow-soft transition hover:-translate-y-[2px] hover:border-ink/20 hover:shadow-md"
      onClick={() => {
        if (!hideTranslations) return;
        onRevealToggle(word.id);
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <p className="text-[11px] uppercase tracking-[0.3em] text-ink/40">
            {getTypeLabel(word.type, t)}
          </p>
          {type === "my_words" && editingId === word.id ? (
            <div className="mt-3 grid gap-2">
              <input
                value={editPl}
                onChange={(event) => setEditPl(event.target.value)}
                className="w-full rounded-xl border border-ink/20 bg-paper px-3 py-2 text-sm"
                aria-label="Polish word"
              />
              <input
                value={editUk}
                onChange={(event) => setEditUk(event.target.value)}
                className="w-full rounded-xl border border-ink/20 bg-paper px-3 py-2 text-sm"
                aria-label="Ukrainian word"
              />
            </div>
          ) : (
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <p className="text-lg font-semibold text-ink">
                {sortField === "uk" ? word.uk : word.pl}
              </p>
              <SpeakButton text={word.pl} />
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
                  onMarkWord(word.id, true);
                }}
                className="rounded-full bg-moss px-3 py-1 text-[11px] font-semibold text-paper transition hover:bg-moss/90 disabled:opacity-60"
                disabled={markedMap[word.id]}
                aria-label="Mark as known"
              >
                {t.common.know}
              </button>
              <button
                onClick={(event) => {
                  event.stopPropagation();
                  onMarkWord(word.id, false);
                }}
                className="rounded-full border border-ink/20 px-3 py-1 text-[11px] font-semibold text-ink transition hover:bg-ink/5 disabled:opacity-60"
                disabled={markedMap[word.id]}
                aria-label="Mark as unknown"
              >
                {t.common.dontKnow}
              </button>
            </div>
          )}
        </div>
        {type !== "my_words" && (
          <div className="flex items-center gap-2">
            {/* AI Button with sparkle animation */}
            <button
              onClick={(event) => {
                event.stopPropagation();
                onOpenAI(word);
              }}
              className="group rounded-full border border-moss/20 bg-moss/5 p-2 text-moss transition hover:border-moss/30 hover:bg-moss/10"
              aria-label="AI приклади та граматика"
            >
              <Sparkle
                size={16}
                weight="fill"
                className="animate-pulse transition group-hover:scale-110"
              />
            </button>
            {/* Favorite Button */}
            <button
              onClick={(event) => {
                event.stopPropagation();
                onToggleFavorite(word.id);
              }}
              className={`rounded-full border px-2 py-1 text-xs transition ${
                favoriteIds.has(word.id)
                  ? "border-amber-400 bg-amber-200/60 text-amber-900"
                  : "border-ink/10 text-ink/50 hover:border-ink/20 hover:bg-ink/5"
              }`}
              aria-label={favoriteIds.has(word.id) ? "Remove from favorites" : "Add to favorites"}
            >
              {favoriteIds.has(word.id) ? "★" : "☆"}
            </button>
          </div>
        )}
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1" aria-label="Progress">
          {Array.from({ length: 5 }).map((_, idx) => {
            const filled = getFilledDots(word.id, progressMap);
            const active = idx < filled;
            return (
              <span
                key={`${word.id}-dot-${idx}`}
                className={`h-2 w-2 rounded-full border transition ${
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
            className="inline-flex items-center justify-center rounded-full border border-ink/20 px-3 py-1 text-[11px] font-semibold text-ink transition hover:bg-ink/5"
            onClick={(event) => event.stopPropagation()}
          >
            {t.common.conjugation}
          </a>
        )}
        {word.type === "adjective" && (
          <a
            href={getPolishAdjectiveDeclensionUrl(word.pl)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center rounded-full border border-ink/20 px-3 py-1 text-[11px] font-semibold text-ink transition hover:bg-ink/5"
            onClick={(event) => event.stopPropagation()}
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
                  onSaveEdit();
                }}
                className="rounded-full border border-ink/20 px-3 py-1 font-semibold text-ink transition hover:bg-ink/5 disabled:opacity-60"
                disabled={!editPl.trim() || !editUk.trim() || editStatus === "saving"}
              >
                {editStatus === "saving" ? t.common.loading : t.common.save}
              </button>
              <button
                onClick={(event) => {
                  event.stopPropagation();
                  onCancelEdit();
                }}
                className="rounded-full border border-ink/10 px-3 py-1 transition hover:border-ink/20"
              >
                {t.common.cancel}
              </button>
              {editStatus === "error" && (
                <span className="text-terracotta">{t.words.addError}</span>
              )}
            </>
          ) : (
            <>
              <button
                onClick={(event) => {
                  event.stopPropagation();
                  onStartEdit(word);
                }}
                className="rounded-full border border-ink/10 px-3 py-1 transition hover:border-ink/20"
              >
                {t.common.edit}
              </button>
              <button
                onClick={(event) => {
                  event.stopPropagation();
                  onDeleteWord(word.id);
                }}
                className="rounded-full border border-ink/10 px-3 py-1 transition hover:border-ink/20"
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
              onDeleteWord(word.id);
            }}
            className="rounded-full border border-ink/20 px-3 py-1 text-[11px] font-semibold text-ink transition hover:bg-ink/5"
          >
            {t.words.removeDuplicate}
          </button>
        </div>
      )}
    </div>
  );
}
