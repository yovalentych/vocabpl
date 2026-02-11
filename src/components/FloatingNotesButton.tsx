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
      className="inline-flex h-12 w-full flex-1 items-center justify-center gap-2 rounded-full border border-ink/20 bg-paper px-4 text-ink shadow-soft transition hover:-translate-y-[1px] sm:h-11 sm:w-11 sm:flex-none sm:px-0"
      aria-label={t.notes.title}
      title={`${t.notes.title} · Ctrl/Cmd + Shift + M`}
    >
      <NotePencil size={16} weight="bold" />
      <span className="text-xs font-semibold sm:hidden">{t.notes.title}</span>
    </button>
  );
}
