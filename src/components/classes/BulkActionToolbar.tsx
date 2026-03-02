"use client";

import { useState } from "react";
import { Copy, Archive, TrashSimple, Calendar, X } from "@phosphor-icons/react";
import Loader from "../ui/Loader";

type BulkActionToolbarProps = {
  selectedCount: number;
  onCopy: () => Promise<void>;
  onArchive: () => Promise<void>;
  onDelete: () => Promise<void>;
  onUpdateDeadline: () => Promise<void>;
  onCancel: () => void;
  locale: "uk" | "pl";
};

export default function BulkActionToolbar({
  selectedCount,
  onCopy,
  onArchive,
  onDelete,
  onUpdateDeadline,
  onCancel,
  locale
}: BulkActionToolbarProps) {
  const [loading, setLoading] = useState(false);

  const t = locale === "uk" ? {
    selected: "Вибрано",
    copyTo: "Копіювати",
    archive: "Архівувати",
    delete: "Видалити",
    updateDeadline: "Дедлайн",
    cancel: "Скасувати"
  } : {
    selected: "Wybrano",
    copyTo: "Kopiuj",
    archive: "Archiwizuj",
    delete: "Usuń",
    updateDeadline: "Termin",
    cancel: "Anuluj"
  };

  async function handleAction(action: () => Promise<void>) {
    try {
      setLoading(true);
      await action();
    } catch (error) {
      console.error("Bulk action failed:", error);
    } finally {
      setLoading(false);
    }
  }

  if (selectedCount === 0) return null;

  return (
    <div className="sticky top-0 z-10 mb-4 rounded-2xl border-2 border-moss/30 bg-moss/10 p-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-moss">
            {t.selected}: {selectedCount}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {loading ? (
            <Loader size="sm" />
          ) : (
            <>
              <button
                onClick={() => handleAction(onCopy)}
                className="inline-flex items-center gap-2 rounded-full border border-moss/30 bg-paper px-4 py-2 text-sm font-semibold text-moss hover:bg-moss/10 transition-colors"
              >
                <Copy size={16} weight="bold" />
                {t.copyTo}
              </button>

              <button
                onClick={() => handleAction(onUpdateDeadline)}
                className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-paper px-4 py-2 text-sm font-semibold text-gold hover:bg-gold/10 transition-colors"
              >
                <Calendar size={16} weight="bold" />
                {t.updateDeadline}
              </button>

              <button
                onClick={() => handleAction(onArchive)}
                className="inline-flex items-center gap-2 rounded-full border border-ink/20 bg-paper px-4 py-2 text-sm font-semibold text-ink hover:bg-ink/5 transition-colors"
              >
                <Archive size={16} weight="fill" />
                {t.archive}
              </button>

              <button
                onClick={() => handleAction(onDelete)}
                className="inline-flex items-center gap-2 rounded-full border border-terracotta/30 bg-paper px-4 py-2 text-sm font-semibold text-terracotta hover:bg-terracotta/10 transition-colors"
              >
                <TrashSimple size={16} weight="fill" />
                {t.delete}
              </button>

              <div className="h-6 w-px bg-ink/10" />

              <button
                onClick={onCancel}
                className="inline-flex items-center gap-2 rounded-full border border-ink/20 bg-paper px-4 py-2 text-sm font-semibold text-ink/60 hover:text-ink hover:bg-ink/5 transition-colors"
              >
                <X size={16} weight="bold" />
                {t.cancel}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
