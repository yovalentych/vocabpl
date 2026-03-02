"use client";

import { useState } from "react";
import { X, Check, Calendar } from "@phosphor-icons/react";
import Loader from "../ui/Loader";

type UpdateDeadlineModalProps = {
  selectedCount: number;
  onUpdate: (dueAt: string | null, publishAt: string | null) => Promise<void>;
  onClose: () => void;
  locale: "uk" | "pl";
};

export default function UpdateDeadlineModal({
  selectedCount,
  onUpdate,
  onClose,
  locale
}: UpdateDeadlineModalProps) {
  const [dueAt, setDueAt] = useState("");
  const [publishAt, setPublishAt] = useState("");
  const [saving, setSaving] = useState(false);

  const t = locale === "uk" ? {
    title: "Змінити дедлайн",
    subtitle: `Оновити дати для ${selectedCount} завдань`,
    publishDate: "Дата публікації",
    publishHint: "Залиште порожнім щоб не змінювати",
    dueDate: "Дедлайн",
    dueHint: "Залиште порожнім щоб не змінювати",
    clearPublish: "Видалити дату публікації",
    clearDue: "Видалити дедлайн",
    update: "Оновити",
    cancel: "Скасувати",
    updating: "Оновлення..."
  } : {
    title: "Zmień termin",
    subtitle: `Zaktualizuj daty dla ${selectedCount} zadań`,
    publishDate: "Data publikacji",
    publishHint: "Zostaw puste aby nie zmieniać",
    dueDate: "Termin",
    dueHint: "Zostaw puste aby nie zmieniać",
    clearPublish: "Usuń datę publikacji",
    clearDue: "Usuń termin",
    update: "Zaktualizuj",
    cancel: "Anuluj",
    updating: "Aktualizacja..."
  };

  async function handleUpdate() {
    try {
      setSaving(true);
      await onUpdate(
        dueAt || null,
        publishAt || null
      );
      onClose();
    } catch (error) {
      console.error("Failed to update deadlines:", error);
      alert("Помилка оновлення дат");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50">
      <div className="absolute inset-0" onClick={saving ? undefined : onClose} />

      <div className="relative w-full max-w-lg bg-paper rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-ink/10">
          <div>
            <h2 className="text-xl font-bold text-ink">{t.title}</h2>
            <p className="text-sm text-ink/60 mt-1">{t.subtitle}</p>
          </div>
          <button
            onClick={onClose}
            disabled={saving}
            className="rounded-lg p-2 text-ink/40 hover:bg-ink/5 hover:text-ink transition-colors disabled:opacity-50"
          >
            <X size={24} weight="bold" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-5">
          {/* Publish Date */}
          <div>
            <label className="block text-sm font-semibold text-ink mb-2">
              <div className="flex items-center gap-2">
                <Calendar size={16} />
                {t.publishDate}
              </div>
            </label>
            <input
              type="datetime-local"
              value={publishAt}
              onChange={(e) => setPublishAt(e.target.value)}
              className="w-full rounded-xl border border-ink/20 bg-paper px-4 py-3 text-ink focus:border-moss focus:outline-none focus:ring-2 focus:ring-moss/20"
            />
            <p className="text-xs text-ink/50 mt-1">{t.publishHint}</p>
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-sm font-semibold text-ink mb-2">
              <div className="flex items-center gap-2">
                <Calendar size={16} />
                {t.dueDate}
              </div>
            </label>
            <input
              type="datetime-local"
              value={dueAt}
              onChange={(e) => setDueAt(e.target.value)}
              className="w-full rounded-xl border border-ink/20 bg-paper px-4 py-3 text-ink focus:border-moss focus:outline-none focus:ring-2 focus:ring-moss/20"
            />
            <p className="text-xs text-ink/50 mt-1">{t.dueHint}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-ink/10">
          <button
            onClick={onClose}
            disabled={saving}
            className="rounded-full border border-ink/20 bg-paper px-5 py-2.5 text-sm font-semibold text-ink hover:bg-ink/5 transition-colors disabled:opacity-50"
          >
            {t.cancel}
          </button>
          <button
            onClick={handleUpdate}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-full border border-moss/30 bg-moss px-5 py-2.5 text-sm font-semibold text-white hover:bg-moss/90 transition-colors disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader size="sm" />
                {t.updating}
              </>
            ) : (
              <>
                <Check size={18} weight="bold" />
                {t.update}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
