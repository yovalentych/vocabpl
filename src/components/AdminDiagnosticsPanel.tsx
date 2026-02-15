"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/components/LocaleProvider";
import Loader from "@/components/ui/Loader";
import { ShieldCheck, Database, Brain, Lightning, CheckCircle, XCircle, Bug } from "@phosphor-icons/react/dist/ssr";
import { csrfFetch } from "@/lib/csrf-client";

type Diagnostics = {
  time: string;
  env: { mongo: boolean; pvsKey: boolean; mono?: boolean; monoPubkey?: boolean; smtp?: boolean; sentry?: boolean };
  db: { ok: boolean };
  ai: { model: string; maxTokens: number };
  plans: { id: string; priceUah: number; credits: number }[];
};

export default function AdminDiagnosticsPanel() {
  const { t } = useLocale();
  const [data, setData] = useState<Diagnostics | null>(null);
  const [loading, setLoading] = useState(true);
  const [aiTest, setAiTest] = useState<{ status: "idle" | "loading" | "ok" | "error"; message?: string }>({
    status: "idle"
  });
  const [sentryTest, setSentryTest] = useState<{ status: "idle" | "loading" | "ok" | "error"; message?: string }>({
    status: "idle"
  });

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      const res = await fetch("/api/admin/diagnostics");
      const json = await res.json().catch(() => ({}));
      if (!mounted) return;
      setData(json);
      setLoading(false);
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  async function runAiTest() {
    setAiTest({ status: "loading" });
    const res = await fetch("/api/ai/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: "workbook_sentence_prompt",
        userInput: "test",
        context: ""
      })
    });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
      setAiTest({ status: "error", message: payload?.error || "AI error" });
      return;
    }
    setAiTest({ status: "ok", message: t.admin.aiTestOk });
  }

  async function runSentryTest() {
    setSentryTest({ status: "loading" });
    const res = await csrfFetch("/api/admin/sentry-test", { method: "POST" });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
      setSentryTest({ status: "error", message: payload?.error || "Sentry error" });
      return;
    }
    setSentryTest({ status: "ok", message: t.admin.sentryTestOk });
  }

  return (
    <div className="rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ShieldCheck size={24} weight="bold" className="text-moss" />
          <div>
            <h2 className="text-2xl font-semibold">{t.admin.diagnosticsTitle}</h2>
            <p className="mt-1 text-sm text-ink/60">{t.admin.diagnosticsSubtitle}</p>
          </div>
        </div>
        {data?.time && (
          <span className="rounded-full border border-moss/20 bg-moss/5 px-3 py-1 text-xs font-semibold text-moss">
            {new Date(data.time).toLocaleString()}
          </span>
        )}
      </div>
      {loading ? (
        <div className="mt-4">
          <Loader label={t.common.loading} />
        </div>
      ) : data ? (
        <div className="mt-4 space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-ink/10 bg-paper/70 p-4">
              <div className="flex items-center gap-2">
                <Database size={18} weight="bold" className="text-ink/70" />
                <p className="text-xs uppercase tracking-[0.2em] text-ink/50">{t.admin.diagnosticsEnv}</p>
              </div>
              <div className="mt-3 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  {data.env.mongo ? (
                    <CheckCircle size={16} weight="fill" className="text-moss" />
                  ) : (
                    <XCircle size={16} weight="fill" className="text-terracotta" />
                  )}
                  <span>{t.admin.diagnosticsMongo}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  {data.env.pvsKey ? (
                    <CheckCircle size={16} weight="fill" className="text-moss" />
                  ) : (
                    <XCircle size={16} weight="fill" className="text-terracotta" />
                  )}
                  <span>{t.admin.diagnosticsPvs}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  {data.env.mono ? (
                    <CheckCircle size={16} weight="fill" className="text-moss" />
                  ) : (
                    <XCircle size={16} weight="fill" className="text-terracotta" />
                  )}
                  <span>Monobank token</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  {data.env.monoPubkey ? (
                    <CheckCircle size={16} weight="fill" className="text-moss" />
                  ) : (
                    <XCircle size={16} weight="fill" className="text-terracotta" />
                  )}
                  <span>Monobank pubkey</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  {data.env.smtp ? (
                    <CheckCircle size={16} weight="fill" className="text-moss" />
                  ) : (
                    <XCircle size={16} weight="fill" className="text-terracotta" />
                  )}
                  <span>{t.admin.diagnosticsSmtp}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  {data.env.sentry ? (
                    <CheckCircle size={16} weight="fill" className="text-moss" />
                  ) : (
                    <XCircle size={16} weight="fill" className="text-terracotta" />
                  )}
                  <span>{t.admin.diagnosticsSentry}</span>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-ink/10 bg-paper/70 p-4">
              <div className="flex items-center gap-2">
                <Database size={18} weight="bold" className="text-ink/70" />
                <p className="text-xs uppercase tracking-[0.2em] text-ink/50">{t.admin.diagnosticsDb}</p>
              </div>
              <div className="mt-3 flex items-center gap-2 text-sm">
                {data.db.ok ? (
                  <CheckCircle size={16} weight="fill" className="text-moss" />
                ) : (
                  <XCircle size={16} weight="fill" className="text-terracotta" />
                )}
                <span>{data.db.ok ? t.admin.diagnosticsOk : t.admin.diagnosticsFail}</span>
              </div>
            </div>
            <div className="rounded-2xl border border-ink/10 bg-paper/70 p-4">
              <div className="flex items-center gap-2">
                <Brain size={18} weight="bold" className="text-ink/70" />
                <p className="text-xs uppercase tracking-[0.2em] text-ink/50">{t.admin.diagnosticsAi}</p>
              </div>
              <p className="mt-3 text-sm font-semibold">{data.ai.model}</p>
              <p className="text-xs text-ink/60">{t.admin.diagnosticsMaxTokens}: {data.ai.maxTokens}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-ink/10 bg-paper/70 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-ink/50">{t.admin.diagnosticsPlans}</p>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              {data.plans.map((plan) => (
                <div key={plan.id} className="rounded-2xl border border-ink/10 bg-paper px-3 py-2 text-sm">
                  <p className="font-semibold">{t.cabinet.planLabels[plan.id as keyof typeof t.cabinet.planLabels] || plan.id}</p>
                  <p className="text-xs text-ink/60">
                    {plan.priceUah} ₴ · {t.cabinet.creditsLabel}: {plan.credits}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={runAiTest}
              className="flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-xs font-semibold text-paper transition hover:bg-ink/90 disabled:opacity-50"
              disabled={aiTest.status === "loading"}
            >
              <Lightning size={14} weight="fill" />
              {aiTest.status === "loading" ? t.common.loading : t.admin.aiTestAction}
            </button>
            {aiTest.status === "ok" && (
              <span className="flex items-center gap-1 text-xs font-semibold text-moss">
                <CheckCircle size={14} weight="fill" />
                {aiTest.message}
              </span>
            )}
            {aiTest.status === "error" && (
              <span className="flex items-center gap-1 text-xs font-semibold text-terracotta">
                <XCircle size={14} weight="fill" />
                {aiTest.message}
              </span>
            )}
            <span className="text-xs text-ink/50">{t.admin.aiTestHint}</span>
          </div>

          <div className="rounded-2xl border border-ink/10 bg-paper/70 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Bug size={18} weight="bold" className="text-ink/70" />
                <p className="text-xs uppercase tracking-[0.2em] text-ink/50">{t.admin.sentryTitle}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={runSentryTest}
                  className="flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-xs font-semibold text-paper transition hover:bg-ink/90 disabled:opacity-50"
                  disabled={sentryTest.status === "loading"}
                >
                  {sentryTest.status === "loading" ? t.common.loading : t.admin.sentryTestAction}
                </button>
                {sentryTest.status === "ok" && (
                  <span className="flex items-center gap-1 text-xs font-semibold text-moss">
                    <CheckCircle size={14} weight="fill" />
                    {sentryTest.message}
                  </span>
                )}
                {sentryTest.status === "error" && (
                  <span className="flex items-center gap-1 text-xs font-semibold text-terracotta">
                    <XCircle size={14} weight="fill" />
                    {sentryTest.message}
                  </span>
                )}
              </div>
            </div>
            <div className="mt-3 grid gap-2 text-xs text-ink/60">
              <p>{t.admin.sentryGuideIntro}</p>
              <p>{t.admin.sentryGuideSteps}</p>
              <p>{t.admin.sentryGuideAlerts}</p>
            </div>
          </div>
        </div>
      ) : (
        <p className="mt-4 text-sm text-ink/60">{t.admin.diagnosticsEmpty}</p>
      )}
    </div>
  );
}
