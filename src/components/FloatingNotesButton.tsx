"use client";

import { useLocale } from "@/components/LocaleProvider";
import { useAuthStatus } from "@/components/useAuthStatus";
import { NotePencil } from "@phosphor-icons/react";

export default function FloatingNotesButton() {
  const { t } = useLocale();
  const { loading, isAuthenticated } = useAuthStatus();

  if (loading || !isAuthenticated) return null;

  return (
    <button
      onClick={() => window.dispatchEvent(new Event("open-notes-modal"))}
      className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-ink/20 bg-paper text-ink shadow-soft transition hover:-translate-y-[1px]"
      aria-label={t.notes.title}
      title={`${t.notes.title} · Ctrl/Cmd + Shift + M`}
    >
      <NotePencil size={16} weight="bold" />
    </button>
  );
}
