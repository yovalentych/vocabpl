"use client";

import { useLocale } from "@/components/LocaleProvider";
import { useAuthStatus } from "@/components/useAuthStatus";
import { Plus } from "@phosphor-icons/react";

export default function FloatingAddWordButton() {
  const { t } = useLocale();
  const { loading, isAuthenticated, isActive } = useAuthStatus();

  if (loading || !isAuthenticated || !isActive) return null;

  return (
    <button
      onClick={() => window.dispatchEvent(new Event("open-quick-add"))}
      className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-xs font-semibold text-paper shadow-soft transition hover:-translate-y-[1px]"
      aria-label={t.words.quickAdd}
      title={t.words.quickAdd}
    >
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-paper/15">
        <Plus size={14} weight="bold" />
      </span>
      {t.words.quickAdd}
    </button>
  );
}
