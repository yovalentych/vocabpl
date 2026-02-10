"use client";

import { CheckCircle } from "@phosphor-icons/react";

type MaterialLite = {
  _id: string;
  title?: string;
  level?: string;
  type?: string;
};

interface MaterialSelectorProps {
  materials: MaterialLite[];
  selectedId: string | null;
  onSelect: (materialId: string) => void;
  completedIds?: string[];
  loading?: boolean;
  emptyMessage?: string;
}

export default function MaterialSelector({
  materials,
  selectedId,
  onSelect,
  completedIds = [],
  loading = false,
  emptyMessage = "No materials available"
}: MaterialSelectorProps) {
  if (loading) {
    return (
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="animate-pulse rounded-2xl border border-ink/10 bg-paper/60 p-4"
          >
            <div className="h-4 w-20 rounded bg-ink/10" />
            <div className="mt-2 h-3 w-full rounded bg-ink/10" />
          </div>
        ))}
      </div>
    );
  }

  if (materials.length === 0) {
    return (
      <div className="rounded-2xl border border-ink/10 bg-paper/60 p-6 text-center">
        <p className="text-sm text-ink/60">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
      {materials.map((material) => {
        const isSelected = material._id === selectedId;
        const isCompleted = completedIds.includes(material._id);

        return (
          <button
            key={material._id}
            onClick={() => onSelect(material._id)}
            className={`group relative rounded-2xl border p-4 text-left transition-all ${
              isSelected
                ? "border-ink bg-ink/5"
                : "border-ink/10 bg-paper/80 hover:border-ink/30 hover:bg-paper"
            }`}
          >
            {/* Level badge */}
            <div className="flex items-center justify-between">
              <span
                className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                  isSelected
                    ? "bg-ink text-paper"
                    : "bg-ink/10 text-ink/60"
                }`}
              >
                {material.level}
              </span>

              {/* Completed indicator */}
              {isCompleted && (
                <div className="flex items-center gap-1 text-moss">
                  <CheckCircle size={14} weight="fill" />
                  <span className="text-[10px] font-semibold uppercase">Done</span>
                </div>
              )}
            </div>

            {/* Title */}
            <h4
              className={`mt-2 text-sm font-semibold ${
                isSelected ? "text-ink" : "text-ink/80"
              }`}
            >
              {material.title || "Untitled"}
            </h4>

            {/* Type or additional info */}
            {material.type && (
              <p className="mt-1 text-xs text-ink/50">{material.type}</p>
            )}

            {/* Selected indicator border */}
            {isSelected && (
              <div className="absolute inset-0 rounded-2xl border-2 border-ink pointer-events-none" />
            )}
          </button>
        );
      })}
    </div>
  );
}
