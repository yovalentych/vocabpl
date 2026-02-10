"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/components/LocaleProvider";
import Loader from "@/components/ui/Loader";
import { Brain, ChartBar } from "@phosphor-icons/react/dist/ssr";

type UsageRow = {
  id: string;
  username: string;
  email?: string;
  planId: string;
  usedCredits: number;
  limit: number;
};

export default function AdminAiUsagePanel() {
  const { t } = useLocale();
  const [rows, setRows] = useState<UsageRow[]>([]);
  const [month, setMonth] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      const res = await fetch("/api/admin/ai-usage");
      const data = await res.json().catch(() => ({}));
      if (!mounted) return;
      setRows(Array.isArray(data?.users) ? data.users : []);
      setMonth(String(data?.month || ""));
      setLoading(false);
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Brain size={24} weight="bold" className="text-moss" />
          <div>
            <h2 className="text-2xl font-semibold">{t.admin.aiUsageTitle}</h2>
            <p className="mt-1 text-sm text-ink/60">{t.admin.aiUsageSubtitle}</p>
          </div>
        </div>
        {month && (
          <span className="flex items-center gap-2 rounded-full border border-moss/20 bg-moss/5 px-3 py-1 text-xs font-semibold text-moss">
            <ChartBar size={14} weight="fill" />
            {month}
          </span>
        )}
      </div>
      {loading ? (
        <div className="mt-4">
          <Loader label={t.common.loading} />
        </div>
      ) : rows.length === 0 ? (
        <p className="mt-4 text-sm text-ink/60">{t.admin.aiUsageEmpty}</p>
      ) : (
        <div className="mt-4 overflow-hidden rounded-2xl border border-ink/10">
          <div className="grid grid-cols-[1.2fr_1fr_0.6fr_0.6fr] gap-2 bg-paper/70 px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-ink/50">
            <span>{t.admin.aiUsageColumns.user}</span>
            <span>{t.admin.aiUsageColumns.plan}</span>
            <span>{t.admin.aiUsageColumns.used}</span>
            <span>{t.admin.aiUsageColumns.limit}</span>
          </div>
          <div className="divide-y divide-ink/10">
            {rows.map((row) => (
              <div
                key={row.id}
                className="grid grid-cols-[1.2fr_1fr_0.6fr_0.6fr] gap-2 px-4 py-3 text-sm"
              >
                <div>
                  <p className="font-semibold">{row.username}</p>
                  <p className="text-xs text-ink/50">{row.email || "-"}</p>
                </div>
                <span className="text-sm">{t.cabinet.planLabels[row.planId as keyof typeof t.cabinet.planLabels] || row.planId}</span>
                <span className="text-sm">{row.usedCredits}</span>
                <span className="text-sm">{row.limit}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
