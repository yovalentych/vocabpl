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
      className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-ink text-paper shadow-soft transition hover:-translate-y-[1px]"
      aria-label={t.words.quickAdd}
      title={`${t.words.quickAdd} · Ctrl/Cmd + Shift + K`}
    >
      <Plus size={16} weight="bold" />
    </button>
  );
}
