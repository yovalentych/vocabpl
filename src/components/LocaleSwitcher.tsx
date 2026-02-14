"use client";

import { useLocale } from "@/components/LocaleProvider";
import { useRouter } from "next/navigation";

export default function LocaleSwitcher() {
  const { locale, setLocale, t } = useLocale();
  const router = useRouter();

  return (
    <div className="flex items-center gap-1 rounded-full border border-ink/15 bg-paper/90 p-1 text-xs shadow-soft">
      <button
        onClick={() => {
          setLocale("pl");
          router.refresh();
        }}
        className={`flex items-center gap-1 rounded-full px-2.5 py-1.5 text-[11px] font-semibold transition ${
          locale === "pl"
            ? "bg-ink text-paper shadow-soft"
            : "text-ink/60 hover:bg-ink/5 hover:text-ink"
        }`}
        aria-label={t.common.polish}
      >
        <span className="inline-flex h-4 w-4 items-center justify-center overflow-hidden rounded-full border border-ink/10 bg-white">
          <img src="/flags/pl.svg" alt="" className="h-full w-full object-cover" />
        </span>
        <span>PL</span>
      </button>
      <button
        onClick={() => {
          setLocale("uk");
          router.refresh();
        }}
        className={`flex items-center gap-1 rounded-full px-2.5 py-1.5 text-[11px] font-semibold transition ${
          locale === "uk"
            ? "bg-ink text-paper shadow-soft"
            : "text-ink/60 hover:bg-ink/5 hover:text-ink"
        }`}
        aria-label={t.common.ukrainian}
      >
        <span className="inline-flex h-4 w-4 items-center justify-center overflow-hidden rounded-full border border-ink/10 bg-white">
          <img src="/flags/uk.svg" alt="" className="h-full w-full object-cover" />
        </span>
        <span>UK</span>
      </button>
    </div>
  );
}
