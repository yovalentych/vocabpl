"use client";

import { useState } from "react";
import AdminUsersPanel from "@/components/AdminUsersPanel";
import AdminImportPanel from "@/components/AdminImportPanel";
import PromoCodesPanel from "@/components/PromoCodesPanel";
import { useLocale } from "@/components/LocaleProvider";

type Summary = {
  verbs: number;
  adverbs: number;
  adjectives: number;
  tests: { id: string; title: string }[];
};

export default function AdminDashboard({ summary }: { summary: Summary }) {
  const { t } = useLocale();
  const [tab, setTab] = useState<"overview" | "users" | "content" | "monetization" | "checklist">("overview");

  return (
    <div className="space-y-8">
      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <aside className="rounded-3xl border border-ink/10 bg-paper/80 p-4 shadow-soft">
          <p className="px-2 pb-3 text-xs uppercase tracking-[0.3em] text-ink/40">{t.admin.title}</p>
          <div className="space-y-2">
            {[
              { id: "overview", label: t.admin.tabs.overview },
              { id: "users", label: t.admin.tabs.users },
              { id: "content", label: t.admin.tabs.content },
              { id: "monetization", label: t.admin.tabs.monetization },
              { id: "checklist", label: t.admin.tabs.checklist }
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setTab(item.id as typeof tab)}
                className={`flex w-full items-center justify-between rounded-2xl px-3 py-2 text-sm font-semibold transition ${
                  tab === item.id
                    ? "bg-ink text-paper"
                    : "border border-ink/10 bg-paper/60 text-ink/70 hover:border-ink/30"
                }`}
              >
                <span>{item.label}</span>
                <span className="text-[10px] uppercase tracking-[0.2em]">→</span>
              </button>
            ))}
          </div>
        </aside>

        <div className="space-y-6">
          {tab === "overview" && (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-4">
                {[
                  { label: t.home.verbs, value: summary.verbs },
                  { label: t.home.adverbs, value: summary.adverbs },
                  { label: t.home.adjectives, value: summary.adjectives },
                  { label: t.home.tests, value: summary.tests.length }
                ].map((stat) => (
                  <div key={stat.label} className="rounded-3xl border border-ink/10 bg-paper/80 p-5 shadow-soft">
                    <p className="text-xs uppercase tracking-[0.3em] text-ink/40">{stat.label}</p>
                    <p className="mt-4 text-3xl font-semibold">{stat.value}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft">
                <h2 className="text-2xl font-semibold">{t.admin.availableTests}</h2>
                <ul className="mt-4 grid gap-3 md:grid-cols-2">
                  {summary.tests.map((test) => (
                    <li key={test.id} className="rounded-2xl border border-ink/10 bg-paper/60 px-4 py-3 text-sm text-ink/70">
                      {test.title}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {tab === "users" && <AdminUsersPanel />}

          {tab === "content" && (
            <div className="grid gap-6 lg:grid-cols-[0.6fr_0.4fr]">
              <AdminImportPanel />
              <div className="rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft">
                <h2 className="text-2xl font-semibold">{t.admin.availableTests}</h2>
                <ul className="mt-4 space-y-3 text-sm text-ink/70">
                  {summary.tests.map((test) => (
                    <li key={test.id} className="rounded-2xl border border-ink/10 bg-paper/60 px-4 py-3">
                      {test.title}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {tab === "monetization" && <PromoCodesPanel />}

          {tab === "checklist" && (
            <div className="rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft">
              <h2 className="text-2xl font-semibold">{t.admin.checklist}</h2>
              <ul className="mt-4 grid gap-3 md:grid-cols-2 text-sm text-ink/70">
                {t.admin.checklistItems.map((item) => (
                  <li key={item} className="rounded-2xl border border-ink/10 bg-paper/60 px-4 py-3">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
