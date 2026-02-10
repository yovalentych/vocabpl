"use client";

import { useState } from "react";
import { Plus, Check, Sparkle } from "@phosphor-icons/react";

interface VocabItem {
  pl: string;
  uk: string;
}

interface VocabSuggestionsProps {
  suggestions: VocabItem[];
  onAdd?: (pl: string, uk: string) => Promise<void>;
  onAddAll?: () => Promise<void>;
  title?: string;
  emptyMessage?: string;
}

export default function VocabSuggestions({
  suggestions,
  onAdd,
  onAddAll,
  title = "Suggested Vocabulary",
  emptyMessage = "No suggestions"
}: VocabSuggestionsProps) {
  const [addedItems, setAddedItems] = useState<Set<string>>(new Set());
  const [loadingItems, setLoadingItems] = useState<Set<string>>(new Set());
  const [addingAll, setAddingAll] = useState(false);

  if (suggestions.length === 0) {
    return null;
  }

  const handleAdd = async (pl: string, uk: string) => {
    if (!onAdd) return;

    setLoadingItems((prev) => new Set(prev).add(pl));

    try {
      await onAdd(pl, uk);
      setAddedItems((prev) => new Set(prev).add(pl));
    } catch (error) {
      console.error("Failed to add vocab:", error);
    } finally {
      setLoadingItems((prev) => {
        const next = new Set(prev);
        next.delete(pl);
        return next;
      });
    }
  };

  const handleAddAll = async () => {
    if (!onAddAll) return;

    setAddingAll(true);
    try {
      await onAddAll();
      // Mark all as added
      setAddedItems(new Set(suggestions.map((s) => s.pl)));
    } catch (error) {
      console.error("Failed to add all vocab:", error);
    } finally {
      setAddingAll(false);
    }
  };

  return (
    <div className="rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkle size={20} weight="fill" className="text-gold" />
          <h3 className="text-lg font-semibold text-ink">{title}</h3>
        </div>

        {/* Add all button */}
        {onAddAll && suggestions.length > 1 && (
          <button
            onClick={handleAddAll}
            disabled={addingAll || addedItems.size === suggestions.length}
            className="inline-flex items-center gap-2 rounded-full border border-ink/20 px-3 py-1.5 text-xs font-semibold text-ink transition hover:bg-ink/5 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {addingAll ? (
              <>
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-ink/20 border-t-ink" />
                <span>Adding...</span>
              </>
            ) : addedItems.size === suggestions.length ? (
              <>
                <Check size={14} weight="bold" />
                <span>All Added</span>
              </>
            ) : (
              <>
                <Plus size={14} weight="bold" />
                <span>Add All</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Suggestions list */}
      <div className="mt-4 space-y-2">
        {suggestions.map((item, index) => {
          const isAdded = addedItems.has(item.pl);
          const isLoading = loadingItems.has(item.pl);

          return (
            <div
              key={`${item.pl}-${index}`}
              className="flex items-center justify-between rounded-2xl border border-ink/10 bg-paper/60 px-4 py-3"
            >
              {/* Word pair */}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-ink">{item.pl}</span>
                  <span className="text-ink/40">—</span>
                  <span className="text-sm text-ink/60">{item.uk}</span>
                </div>
              </div>

              {/* Add button */}
              {onAdd && (
                <button
                  onClick={() => handleAdd(item.pl, item.uk)}
                  disabled={isAdded || isLoading}
                  className={`inline-flex h-8 w-8 items-center justify-center rounded-full transition ${
                    isAdded
                      ? "bg-moss/20 text-moss"
                      : "border border-ink/20 text-ink hover:bg-ink/5"
                  } disabled:cursor-not-allowed`}
                >
                  {isLoading ? (
                    <span className="h-3 w-3 animate-spin rounded-full border-2 border-ink/20 border-t-ink" />
                  ) : isAdded ? (
                    <Check size={16} weight="bold" />
                  ) : (
                    <Plus size={16} weight="bold" />
                  )}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Empty state */}
      {suggestions.length === 0 && (
        <p className="mt-4 text-center text-sm text-ink/60">{emptyMessage}</p>
      )}
    </div>
  );
}
