"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/components/LocaleProvider";

function getCookie(name: string) {
  if (typeof document === "undefined") return "";
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift() || "";
  return "";
}

function setCookie(name: string, value: string, maxAgeSeconds: number) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=${value}; max-age=${maxAgeSeconds}; path=/; samesite=lax`;
}

export default function CookieConsent() {
  const { t } = useLocale();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = getCookie("cookie_consent");
    if (!consent) setVisible(true);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-1/2 z-50 w-[min(92vw,540px)] -translate-x-1/2 rounded-2xl border border-ink/10 bg-paper/95 p-4 text-sm shadow-soft">
      <p className="text-ink/70">
        <strong className="text-ink">{t.cookies.title}</strong> {t.cookies.text}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          onClick={() => {
            setCookie("cookie_consent", "accepted", 60 * 60 * 24 * 180);
            setVisible(false);
          }}
          className="rounded-full bg-ink px-4 py-2 text-xs font-semibold text-paper"
        >
          {t.cookies.accept}
        </button>
        <button
          onClick={() => {
            setCookie("cookie_consent", "declined", 60 * 60 * 24 * 30);
            setVisible(false);
          }}
          className="rounded-full border border-ink/20 px-4 py-2 text-xs font-semibold text-ink"
        >
          {t.cookies.decline}
        </button>
      </div>
    </div>
  );
}
