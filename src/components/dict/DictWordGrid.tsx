"use client";

import { Word } from "@/lib/types";
import DictWordCard from "./DictWordCard";

interface DictWordGridProps {
  type: string;
  groupedItems: [string, Word[]][];
  pairGroups: [string, any[]][];
  activeLetter: string;
  // Pass through props for DictWordCard
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

export default function DictWordGrid({
  type,
  groupedItems,
  pairGroups,
  activeLetter,
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
}: DictWordGridProps) {
  // Handle aspect pairs separately
  if (type === "aspect_pairs") {
    const filteredPairGroups =
      activeLetter === "all"
        ? pairGroups
        : pairGroups.filter(([letter]) => letter === activeLetter);

    return (
      <div className="space-y-8">
        {filteredPairGroups.map(([letter, pairs]) => (
          <div key={`pair-${letter}`} className="space-y-4">
            {/* Letter section header */}
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-moss/10 to-gold/10 text-lg font-bold text-ink shadow-soft">
                {letter}
              </div>
              <span className="text-sm text-ink/50">
                {pairs.length} {pairs.length === 1 ? "para" : "par"}
              </span>
            </div>

            {/* Aspect pair cards grid */}
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {pairs.map((pair) => {
                const imperfectiveWord: Word = {
                  id: pair.imperfective_id || `${pair.id}-imp`,
                  pl: pair.imperfective || "",
                  uk: pair.imperfective_uk || "",
                  pos: "verb",
                  type: "aspect_pairs",
                  source: "aspect_pairs"
                };

                const perfectiveWord: Word = {
                  id: pair.perfective_id || `${pair.id}-perf`,
                  pl: pair.perfective || "",
                  uk: pair.perfective_uk || "",
                  pos: "verb",
                  type: "aspect_pairs",
                  source: "aspect_pairs"
                };

                return (
                  <div
                    key={pair.id}
                    className="space-y-3 rounded-3xl border border-ink/10 bg-paper/95 p-4 shadow-soft transition hover:-translate-y-[2px] hover:border-ink/20 hover:shadow-md"
                  >
                    {/* Imperfective */}
                    <div className="space-y-2">
                      <p className="text-[11px] uppercase tracking-[0.3em] text-moss/80">
                        Niedokonany
                      </p>
                      <div className="flex flex-wrap items-center gap-3">
                        <p className="text-lg font-semibold text-ink">
                          {sortField === "uk"
                            ? imperfectiveWord.uk
                            : imperfectiveWord.pl}
                        </p>
                        <span className="text-xs text-ink/30">·</span>
                        <p className="text-sm text-ink/60">
                          {hideTranslations &&
                          !revealedMap[imperfectiveWord.id]
                            ? "•••••"
                            : sortField === "uk"
                              ? imperfectiveWord.pl
                              : imperfectiveWord.uk}
                        </p>
                      </div>
                    </div>

                    {/* Separator */}
                    <div className="border-t border-ink/10" />

                    {/* Perfective */}
                    <div className="space-y-2">
                      <p className="text-[11px] uppercase tracking-[0.3em] text-terracotta/80">
                        Dokonany
                      </p>
                      <div className="flex flex-wrap items-center gap-3">
                        <p className="text-lg font-semibold text-ink">
                          {sortField === "uk"
                            ? perfectiveWord.uk
                            : perfectiveWord.pl}
                        </p>
                        <span className="text-xs text-ink/30">·</span>
                        <p className="text-sm text-ink/60">
                          {hideTranslations && !revealedMap[perfectiveWord.id]
                            ? "•••••"
                            : sortField === "uk"
                              ? perfectiveWord.pl
                              : perfectiveWord.uk}
                        </p>
                      </div>
                    </div>

                    {/* Favorite button for pair */}
                    <div className="flex justify-end pt-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleFavorite(imperfectiveWord.id);
                        }}
                        className={`rounded-full border px-2 py-1 text-xs transition ${
                          favoriteIds.has(imperfectiveWord.id)
                            ? "border-amber-400 bg-amber-200/60 text-amber-900"
                            : "border-ink/10 text-ink/50 hover:border-ink/20 hover:bg-ink/5"
                        }`}
                        aria-label={
                          favoriteIds.has(imperfectiveWord.id)
                            ? "Remove from favorites"
                            : "Add to favorites"
                        }
                      >
                        {favoriteIds.has(imperfectiveWord.id) ? "★" : "☆"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Regular words
  const filteredGroups =
    activeLetter === "all"
      ? groupedItems
      : groupedItems.filter(([letter]) => letter === activeLetter);

  return (
    <div className="space-y-8">
      {filteredGroups.map(([letter, words]) => (
        <div key={`group-${letter}`} className="space-y-4">
          {/* Letter section header */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-moss/10 to-gold/10 text-lg font-bold text-ink shadow-soft">
              {letter}
            </div>
            <span className="text-sm text-ink/50">
              {words.length} {words.length === 1 ? "słowo" : "słów"}
            </span>
          </div>

          {/* Word cards grid */}
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {words.map((word) => (
              <DictWordCard
                key={word.id}
                word={word}
                type={type}
                sortField={sortField}
                hideTranslations={hideTranslations}
                revealedMap={revealedMap}
                markedMap={markedMap}
                favoriteIds={favoriteIds}
                progressMap={progressMap}
                editingId={editingId}
                editPl={editPl}
                editUk={editUk}
                editStatus={editStatus}
                onToggleFavorite={onToggleFavorite}
                onMarkWord={onMarkWord}
                onRevealToggle={onRevealToggle}
                onStartEdit={onStartEdit}
                onSaveEdit={onSaveEdit}
                onCancelEdit={onCancelEdit}
                onDeleteWord={onDeleteWord}
                setEditPl={setEditPl}
                setEditUk={setEditUk}
                onOpenAI={onOpenAI}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
