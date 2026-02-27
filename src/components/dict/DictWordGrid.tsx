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
                  id: pair.id ? `${pair.id}-imp` : `imp-${pair.imp?.pl}`,
                  pl: pair.imp?.pl || "",
                  uk: pair.imp?.uk || "",
                  pos: pair.pos || "verb",
                  type: "aspect_pairs",
                  source: "aspect_pairs"
                };

                const perfectiveWord: Word = {
                  id: pair.id ? `${pair.id}-perf` : `perf-${pair.perf?.pl}`,
                  pl: pair.perf?.pl || "",
                  uk: pair.perf?.uk || "",
                  pos: pair.pos || "verb",
                  type: "aspect_pairs",
                  source: "aspect_pairs"
                };

                return (
                  <div
                    key={pair.id}
                    className="group relative overflow-hidden rounded-[28px] border border-ink/10 bg-gradient-to-br from-paper to-moss/5 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-moss/30 hover:shadow-lg"
                  >
                    {/* Gradient background accent */}
                    <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-moss/10 blur-3xl transition-opacity group-hover:opacity-80" />
                    <div className="absolute -left-12 -bottom-12 h-32 w-32 rounded-full bg-terracotta/10 blur-3xl transition-opacity group-hover:opacity-80" />

                    <div className="relative space-y-4 p-6">
                      {/* Imperfective - Process */}
                      <div className="space-y-2 rounded-2xl border border-moss/20 bg-moss/5 p-4 transition-colors group-hover:border-moss/30 group-hover:bg-moss/10">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-base">🔄</span>
                          <p className="text-[10px] uppercase tracking-[0.3em] text-moss font-bold">
                            Niedokonany
                          </p>
                          <span className="text-[10px] text-moss/60">(процес)</span>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xl font-bold text-ink">
                            {sortField === "uk"
                              ? imperfectiveWord.uk
                              : imperfectiveWord.pl}
                          </p>
                          <p className="text-sm text-ink/70">
                            {hideTranslations &&
                            !revealedMap[imperfectiveWord.id]
                              ? "•••••"
                              : sortField === "uk"
                                ? imperfectiveWord.pl
                                : imperfectiveWord.uk}
                          </p>
                        </div>
                      </div>

                      {/* Visual connector */}
                      <div className="flex items-center justify-center">
                        <div className="h-px w-full bg-gradient-to-r from-moss/30 via-ink/20 to-terracotta/30" />
                        <div className="flex-shrink-0 rounded-full bg-paper px-3 py-1 text-xs font-semibold text-ink/50 border border-ink/10 mx-2">
                          ↓
                        </div>
                        <div className="h-px w-full bg-gradient-to-r from-terracotta/30 via-ink/20 to-moss/30" />
                      </div>

                      {/* Perfective - Result */}
                      <div className="space-y-2 rounded-2xl border border-terracotta/20 bg-terracotta/5 p-4 transition-colors group-hover:border-terracotta/30 group-hover:bg-terracotta/10">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-base">✅</span>
                          <p className="text-[10px] uppercase tracking-[0.3em] text-terracotta font-bold">
                            Dokonany
                          </p>
                          <span className="text-[10px] text-terracotta/60">(результат)</span>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xl font-bold text-ink">
                            {sortField === "uk"
                              ? perfectiveWord.uk
                              : perfectiveWord.pl}
                          </p>
                          <p className="text-sm text-ink/70">
                            {hideTranslations && !revealedMap[perfectiveWord.id]
                              ? "•••••"
                              : sortField === "uk"
                                ? perfectiveWord.pl
                                : perfectiveWord.uk}
                          </p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-between pt-2 border-t border-ink/10">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onRevealToggle(imperfectiveWord.id);
                          }}
                          className="text-xs text-ink/50 hover:text-moss transition-colors"
                        >
                          {hideTranslations && !revealedMap[imperfectiveWord.id] ? "Показати переклад" : "Приховати"}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleFavorite(imperfectiveWord.id);
                          }}
                          className={`rounded-full border px-3 py-1.5 text-sm transition-all ${
                            favoriteIds.has(imperfectiveWord.id)
                              ? "border-amber-400 bg-amber-200/60 text-amber-900 shadow-sm"
                              : "border-ink/10 text-ink/50 hover:border-amber-300 hover:bg-amber-100/30"
                          }`}
                          aria-label={
                            favoriteIds.has(imperfectiveWord.id)
                              ? "Видалити з улюблених"
                              : "Додати до улюблених"
                          }
                        >
                          {favoriteIds.has(imperfectiveWord.id) ? "★" : "☆"}
                        </button>
                      </div>
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
