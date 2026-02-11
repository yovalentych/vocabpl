"use client";

import { useLocale } from "@/components/LocaleProvider";
import { useAuthStatus } from "@/components/useAuthStatus";
import { Plus } from "@phosphor-icons/react";

export default function FloatingAddWordButton() {
  const { t } = useLocale();
  const { loading, isAuthenticated } = useAuthStatus();

  if (loading || !isAuthenticated) return null;

  return (
    <button
      onClick={() => window.dispatchEvent(new Event("open-quick-add"))}
      className="inline-flex h-12 w-full flex-1 items-center justify-center gap-2 rounded-full bg-ink px-4 text-paper shadow-soft transition hover:-translate-y-[1px] sm:h-11 sm:w-11 sm:flex-none sm:px-0"
      aria-label={t.words.quickAdd}
      title={`${t.words.quickAdd} · Ctrl/Cmd + Shift + K`}
    >
      <Plus size={16} weight="bold" />
      <span className="text-xs font-semibold sm:hidden">{t.words.quickAdd}</span>
    </button>
  );
}
