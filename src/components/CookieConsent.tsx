"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/components/LocaleProvider";
import Link from "next/link";
import { getCookie, hasConsent, readPrefs, setCookie, writePrefs } from "@/lib/prefs";

export default function CookieConsent() {
  const { t } = useLocale();
  const [visible, setVisible] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    const consent = getCookie("cookie_consent");
    if (!consent) {
      setVisible(true);
      return;
    }
    if (hasConsent()) {
      const prefs = readPrefs() || {};
      setAnalytics(Boolean((prefs as any).analyticsConsent));
      setMarketing(Boolean((prefs as any).marketingConsent));
    }
  }, []);

  if (!visible) return null;

  const persist = (consentValue: "accepted" | "custom" | "declined", prefs?: { analytics: boolean; marketing: boolean }) => {
    setCookie("cookie_consent", consentValue, 60 * 60 * 24 * 180);
    if (prefs) {
      writePrefs({ ...readPrefs(), analyticsConsent: prefs.analytics, marketingConsent: prefs.marketing });
    }
    setVisible(false);
    setShowSettings(false);
  };

  return (
    <div className="fixed bottom-4 left-1/2 z-50 w-[min(92vw,560px)] -translate-x-1/2 rounded-2xl border border-ink/10 bg-paper/95 p-5 text-sm shadow-soft">
      <p className="text-ink/70">
        <strong className="text-ink">{t.cookies.title}</strong> {t.cookies.text}{" "}
        <Link href="/cookies" className="underline underline-offset-4">
          Cookies
        </Link>
        .
      </p>

      {!showSettings ? (
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => persist("accepted", { analytics: true, marketing: true })}
            className="rounded-full bg-ink px-4 py-2 text-xs font-semibold text-paper"
          >
            {t.cookies.acceptAll}
          </button>
          <button
            onClick={() => persist("accepted", { analytics: false, marketing: false })}
            className="rounded-full border border-ink/20 px-4 py-2 text-xs font-semibold text-ink"
          >
            {t.cookies.acceptNecessary}
          </button>
          <button
            onClick={() => setShowSettings(true)}
            className="rounded-full border border-ink/20 px-4 py-2 text-xs font-semibold text-ink"
          >
            {t.cookies.settings}
          </button>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          <div className="flex items-start gap-3">
            <input type="checkbox" checked readOnly className="mt-0.5 h-4 w-4 rounded border-ink/30 accent-ink" />
            <div>
              <p className="text-sm font-semibold">{t.cookies.categoryNecessary}</p>
              <p className="text-xs text-ink/60">{t.cookies.categoryNecessaryDesc}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={analytics}
              onChange={(event) => setAnalytics(event.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-ink/30 accent-ink"
            />
            <div>
              <p className="text-sm font-semibold">{t.cookies.categoryAnalytics}</p>
              <p className="text-xs text-ink/60">{t.cookies.categoryAnalyticsDesc}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={marketing}
              onChange={(event) => setMarketing(event.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-ink/30 accent-ink"
            />
            <div>
              <p className="text-sm font-semibold">{t.cookies.categoryMarketing}</p>
              <p className="text-xs text-ink/60">{t.cookies.categoryMarketingDesc}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            <button
              onClick={() => persist("custom", { analytics, marketing })}
              className="rounded-full bg-ink px-4 py-2 text-xs font-semibold text-paper"
            >
              {t.common.save}
            </button>
            <button
              onClick={() => setShowSettings(false)}
              className="rounded-full border border-ink/20 px-4 py-2 text-xs font-semibold text-ink"
            >
              {t.common.close}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
