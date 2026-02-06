"use client";

import { createContext, useContext, useMemo, useState } from "react";
import type { Dictionary, Locale } from "@/lib/i18n";
import { dictionary, resolveLocale } from "@/lib/i18n";

type LocaleContextValue = {
  locale: Locale;
  t: Dictionary;
  setLocale: (locale: Locale) => void;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({
  initialLocale,
  children
}: {
  initialLocale: Locale;
  children: React.ReactNode;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  const t = useMemo(() => dictionary[locale], [locale]);

  function setLocale(next: Locale) {
    const resolved = resolveLocale(next);
    document.cookie = `locale=${resolved}; path=/; max-age=31536000`;
    setLocaleState(resolved);
  }

  return (
    <LocaleContext.Provider value={{ locale, t, setLocale }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error("useLocale must be used within LocaleProvider");
  }
  return context;
}
