"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale } from "@/components/LocaleProvider";
import { legalContent } from "@/lib/legal-content";

export const dynamic = 'force-dynamic';

const sections: string[] = ["terms", "privacy", "subscription", "cookies"];

export default function LegalCenterPage() {
  const params = useSearchParams();
  const { locale } = useLocale();
  const initialTab = params.get("tab");
  const [active, setActive] = useState<string>(
    initialTab && sections.includes(initialTab) ? initialTab : "terms"
  );

  const content = useMemo(() => {
    const pack = locale === "uk" ? legalContent.uk : legalContent.pl;
    return pack[active];
  }, [active, locale]);

  const labels = locale === "uk"
    ? {
        terms: "Умови",
        privacy: "Політика",
        subscription: "Оплата",
        cookies: "Cookies"
      }
    : {
        terms: "Regulamin",
        privacy: "Polityka",
        subscription: "Płatności",
        cookies: "Cookies"
      };

  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-12">
      <div className="rounded-3xl border border-ink/10 bg-paper/90 p-6 shadow-soft">
        <div className="flex flex-wrap gap-2">
          {sections.map((section) => (
            <button
              key={section}
              onClick={() => setActive(section)}
              className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                active === section ? "bg-ink text-paper" : "border border-ink/20 text-ink hover:bg-ink/5"
              }`}
            >
              {labels[section]}
            </button>
          ))}
        </div>

        <div className="mt-6">
          <h1 className="text-3xl font-semibold">{content.title}</h1>
          <p className="mt-2 text-sm text-ink/60">{content.updated}</p>
          <div className="mt-6 space-y-4 text-sm text-ink/80">
            {content.body.map((item, index) => (
              <p key={index}>{item}</p>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
