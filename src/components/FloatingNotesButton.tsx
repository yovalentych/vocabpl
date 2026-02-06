"use client";

import { useLocale } from "@/components/LocaleProvider";
import { useAuthStatus } from "@/components/useAuthStatus";
import { NotePencil } from "@phosphor-icons/react";

export default function FloatingNotesButton() {
  const { t } = useLocale();
  const { loading, isAuthenticated, isActive } = useAuthStatus();

  if (loading || !isAuthenticated || !isActive) return null;

  return (
    <button
      onClick={() => window.dispatchEvent(new Event("open-notes-modal"))}
      className="inline-flex items-center gap-2 rounded-full border border-ink/20 bg-paper px-4 py-2 text-xs font-semibold text-ink shadow-soft transition hover:-translate-y-[1px]"
      aria-label={t.notes.title}
      title={t.notes.title}
    >
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-ink/5 text-ink">
        <NotePencil size={14} weight="bold" />
      </span>
      {t.notes.title}
    </button>
  );
}
