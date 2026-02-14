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

type UsageStats = {
  summary: {
    month: string;
    totalRequests: number;
    totalCredits: number;
    totalTokens: number;
    promptTokens: number;
    completionTokens: number;
    avgTokens: number;
    avgCredits: number;
  };
  modes: { key: string; count: number; credits: number; tokens: number }[];
  models: { key: string; count: number; credits: number; tokens: number }[];
  daily: { day: string; count: number; credits: number; tokens: number }[];
};

export default function AdminAiUsagePanel() {
  const { t } = useLocale();
  const [rows, setRows] = useState<UsageRow[]>([]);
  const [month, setMonth] = useState("");
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      const res = await fetch("/api/admin/ai-usage");
      const data = await res.json().catch(() => ({}));
      const statsRes = await fetch("/api/admin/ai-usage/stats");
      const statsData = await statsRes.json().catch(() => ({}));
      if (!mounted) return;
      setRows(Array.isArray(data?.users) ? data.users : []);
      setMonth(String(data?.month || ""));
      setStats(statsData?.summary ? statsData : null);
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
        <div className="mt-4 space-y-6">
          {stats ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-moss/20 bg-moss/5 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-ink/50">{t.admin.aiUsageRequests}</p>
                <p className="mt-1 text-2xl font-semibold text-ink">{stats.summary.totalRequests}</p>
              </div>
              <div className="rounded-2xl border border-gold/20 bg-gold/10 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-ink/50">{t.admin.aiUsageTokens}</p>
                <p className="mt-1 text-2xl font-semibold text-ink">{stats.summary.totalTokens}</p>
                <p className="text-xs text-ink/50">
                  {t.admin.aiUsagePrompt}: {stats.summary.promptTokens} · {t.admin.aiUsageCompletion}: {stats.summary.completionTokens}
                </p>
              </div>
              <div className="rounded-2xl border border-terracotta/20 bg-terracotta/5 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-ink/50">{t.admin.aiUsageCredits}</p>
                <p className="mt-1 text-2xl font-semibold text-ink">{stats.summary.totalCredits}</p>
                <p className="text-xs text-ink/50">{t.admin.aiUsageAvgCredits}: {stats.summary.avgCredits}</p>
              </div>
              <div className="rounded-2xl border border-ink/10 bg-ink/5 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-ink/50">{t.admin.aiUsageAvgTokens}</p>
                <p className="mt-1 text-2xl font-semibold text-ink">{stats.summary.avgTokens}</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-ink/60">{t.admin.aiUsageNoLogs}</p>
          )}

          {stats && (
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-ink/10 bg-paper/70 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-ink/50">{t.admin.aiUsageTopModes}</p>
                <div className="mt-3 space-y-2 text-sm">
                  {stats.modes.slice(0, 6).map((mode) => (
                    <div key={mode.key} className="flex items-center justify-between">
                      <span className="text-ink/70">{mode.key}</span>
                      <span className="text-ink/60">{mode.tokens} tok · {mode.count} req</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border border-ink/10 bg-paper/70 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-ink/50">{t.admin.aiUsageTopModels}</p>
                <div className="mt-3 space-y-2 text-sm">
                  {stats.models.slice(0, 6).map((model) => (
                    <div key={model.key} className="flex items-center justify-between">
                      <span className="text-ink/70">{model.key}</span>
                      <span className="text-ink/60">{model.tokens} tok · {model.count} req</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="overflow-hidden rounded-2xl border border-ink/10">
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
        </div>
      )}
    </div>
  );
}
