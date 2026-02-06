"use client";

import { useLocale } from "@/components/LocaleProvider";
import { useAuthStatus } from "@/components/useAuthStatus";

export default function FooterHotkeys() {
  const { t } = useLocale();
  const { loading, isAuthenticated, isActive } = useAuthStatus();

  if (loading || !isAuthenticated || !isActive) return null;

  return <span className="text-[11px] text-ink/40">{t.common.hotkeys}</span>;
}
