"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { plans as defaultPlans, Plan, getPlanById } from "@/lib/plans";
import { readPrefs, setCookie, writePrefs } from "@/lib/prefs";
import { csrfFetch } from "@/lib/csrf-client";
import {
  User,
  Lock,
  Sparkle,
  Trophy,
  Ticket,
  CreditCard,
  Warning,
  CheckCircle,
  XCircle,
  Lightning,
  Brain,
  ChartLineUp
} from "@phosphor-icons/react";

type UserProfile = {
  username: string;
  name?: string;
  email?: string;
  emailVerified?: boolean;
  consent?: {
    marketingAt?: string | null;
  };
  stats?: {
    wordsStudied?: number;
    testsTaken?: number;
    sessions?: number;
    points?: number;
  };
  subscription?: {
    status: string;
    expiresAt: string | null;
    promoCode: string | null;
    planId?: string | null;
    autoRenew?: boolean;
    cancelAtPeriodEnd?: boolean;
  };
  aiUsage?: {
    month: string | null;
    usedCredits: number;
  };
};

export default function CabinetClient({ username }: { username: string }) {
  const { t, locale } = useLocale();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [emailCode, setEmailCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [passwordTone, setPasswordTone] = useState<"error" | "success">("success");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [promoCode, setPromoCode] = useState("");
  const [promoMessage, setPromoMessage] = useState<{ text: string; tone: "error" | "success" } | null>(null);
  const [aiUsageHistory, setAiUsageHistory] = useState<{ id: string; mode: string; credits: number; createdAt: string }[]>([]);
  const [aiUsageSummary, setAiUsageSummary] = useState<{ usedCredits: number; limit: number } | null>(null);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmReset, setConfirmReset] = useState("");
  const [confirmDelete, setConfirmDelete] = useState("");
  const [ackReset, setAckReset] = useState(false);
  const [ackDelete, setAckDelete] = useState(false);
  const [dangerStatus, setDangerStatus] = useState<"idle" | "saving" | "error" | "done">("idle");
  const isActive = profile?.subscription?.status === "active";
  const hasPromoAccess = Boolean(profile?.subscription?.promoCode);
  const [billingPlans, setBillingPlans] = useState<Plan[]>(defaultPlans);
  const [blurPlans, setBlurPlans] = useState(false);
  const [autoRenew, setAutoRenew] = useState(true);
  const [billingMessage, setBillingMessage] = useState<{ text: string; tone: "error" | "success" } | null>(null);
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showPromoForm, setShowPromoForm] = useState(false);
  const [cookieAnalytics, setCookieAnalytics] = useState(false);
  const [cookieMarketing, setCookieMarketing] = useState(false);
  const [prefsStatus, setPrefsStatus] = useState<"idle" | "saving" | "done" | "error">("idle");
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [marketingStatus, setMarketingStatus] = useState<"idle" | "saving" | "done" | "error">("idle");
  const [dataRequestType, setDataRequestType] = useState<"access" | "delete">("access");
  const [dataRequestMessage, setDataRequestMessage] = useState("");
  const [dataRequestStatus, setDataRequestStatus] = useState<"idle" | "saving" | "done" | "error">("idle");
  const hasAiAccess = Boolean(isActive || hasPromoAccess);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = window.setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [resendCooldown]);

  async function loadProfile() {
    const res = await fetch("/api/user/me");
    if (res.ok) {
      const data = await res.json();
      setProfile(data.user);
      setMarketingConsent(Boolean(data.user?.consent?.marketingAt));
      if (typeof data.user?.subscription?.autoRenew === "boolean") {
        setAutoRenew(Boolean(data.user.subscription.autoRenew));
      }
    }
  }

  async function loadAiUsage() {
    const res = await fetch("/api/user/ai-usage");
    if (!res.ok) return;
    const data = await res.json();
    if (Array.isArray(data?.logs)) setAiUsageHistory(data.logs);
    if (data?.usage) setAiUsageSummary({ usedCredits: data.usage.usedCredits, limit: data.usage.limit });
  }

  useEffect(() => {
    loadProfile();
    loadAiUsage();
  }, []);

  useEffect(() => {
    const prefs = readPrefs() || {};
    setCookieAnalytics(Boolean((prefs as any).analyticsConsent));
    setCookieMarketing(Boolean((prefs as any).marketingConsent));
  }, []);

  useEffect(() => {
    async function loadBilling() {
      const res = await fetch("/api/billing");
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data?.plans)) setBillingPlans(data.plans);
      setBlurPlans(Boolean(data?.blurPlans));
    }
    loadBilling();
  }, []);

  async function startPayment(planId: string) {
    setBillingMessage(null);
    const res = await csrfFetch("/api/payments/mono/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planId, autoRenew })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setBillingMessage({ tone: "error", text: data?.error || t.cabinet.paymentCreateError });
      return;
    }
    if (data?.pageUrl) {
      window.location.href = data.pageUrl;
      return;
    }
    setBillingMessage({ tone: "error", text: t.cabinet.paymentLinkError });
  }

  async function cancelSubscription() {
    setBillingMessage(null);
    const res = await csrfFetch("/api/subscription/cancel", { method: "POST" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setBillingMessage({ tone: "error", text: data?.error || t.cabinet.cancelError });
      return;
    }
    setBillingMessage({ tone: "success", text: t.cabinet.billingCancelInfo });
    loadProfile();
  }

  async function resumeSubscription() {
    setBillingMessage(null);
    const res = await csrfFetch("/api/subscription/resume", { method: "POST" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setBillingMessage({ tone: "error", text: data?.error || t.cabinet.resumeError });
      return;
    }
    setBillingMessage({ tone: "success", text: t.cabinet.billingAutoRenew });
    loadProfile();
  }

  async function requestPasswordCode() {
    setPasswordMessage(null);
    const res = await csrfFetch("/api/user/password/request", { method: "POST" });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setPasswordTone("error");
      setPasswordMessage(data?.error || t.cabinet.passwordSendError);
      return;
    }
    setPasswordTone("success");
    setPasswordMessage(t.cabinet.passwordCodeSent);
    setResendCooldown(60);
  }

  async function changePassword(event: React.FormEvent) {
    event.preventDefault();
    setPasswordMessage(null);
    const res = await csrfFetch("/api/user/password/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: emailCode, newPassword, confirmPassword })
    });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setPasswordTone("error");
      setPasswordMessage(data?.error || t.cabinet.passwordChangeError);
      return;
    }
    setPasswordTone("success");
    setPasswordMessage(t.cabinet.passwordUpdated);
    setEmailCode("");
    setNewPassword("");
    setConfirmPassword("");
  }

  async function resetProgress() {
    setDangerStatus("saving");
    const res = await csrfFetch("/api/user/reset", { method: "POST" });
    if (!res.ok) {
      setDangerStatus("error");
      return;
    }
    setDangerStatus("done");
    setShowResetModal(false);
    setConfirmReset("");
    setAckReset(false);
  }

  async function deleteAccount() {
    setDangerStatus("saving");
    const res = await csrfFetch("/api/user/delete", { method: "DELETE" });
    if (!res.ok) {
      setDangerStatus("error");
      return;
    }
    await csrfFetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/register";
  }

  async function applyPromo(event: React.FormEvent) {
    event.preventDefault();
    setPromoMessage(null);
    const res = await csrfFetch("/api/user/promo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: promoCode })
    });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setPromoMessage({ text: data?.error || t.cabinet.promoError, tone: "error" });
      return;
    }
    setPromoMessage({ text: t.cabinet.promoSuccess, tone: "success" });
    setPromoCode("");
    await loadProfile();
  }


  async function saveCookiePreferences() {
    setPrefsStatus("saving");
    try {
      writePrefs({ ...readPrefs(), analyticsConsent: cookieAnalytics, marketingConsent: cookieMarketing });
      setCookie("cookie_consent", "custom", 60 * 60 * 24 * 180);
      setPrefsStatus("done");
      setTimeout(() => setPrefsStatus("idle"), 2000);
    } catch {
      setPrefsStatus("error");
    }
  }

  async function updateMarketingConsent(next: boolean) {
    setMarketingStatus("saving");
    const res = await csrfFetch("/api/user/consent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ marketingOptIn: next })
    });
    if (!res.ok) {
      setMarketingStatus("error");
      return;
    }
    setMarketingConsent(next);
    setMarketingStatus("done");
    setTimeout(() => setMarketingStatus("idle"), 2000);
  }

  async function submitDataRequest(event: React.FormEvent) {
    event.preventDefault();
    setDataRequestStatus("saving");
    const res = await csrfFetch("/api/user/data-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requestType: dataRequestType,
        message: dataRequestMessage.trim()
      })
    });
    if (!res.ok) {
      setDataRequestStatus("error");
      return;
    }
    setDataRequestMessage("");
    setDataRequestStatus("done");
    setTimeout(() => setDataRequestStatus("idle"), 2000);
  }

  // Aggregate AI usage by mode for chart
  const aiUsageByMode = aiUsageHistory.reduce((acc, log) => {
    const mode = log.mode;
    if (!acc[mode]) {
      acc[mode] = { count: 0, credits: 0 };
    }
    acc[mode].count += 1;
    acc[mode].credits += log.credits;
    return acc;
  }, {} as Record<string, { count: number; credits: number }>);

  const aiUsageChartData = Object.entries(aiUsageByMode)
    .map(([mode, data]) => ({
      mode,
      count: data.count,
      credits: data.credits,
      label: t.cabinet.aiUsageItems[mode as keyof typeof t.cabinet.aiUsageItems] || mode
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10); // Top 10

  const maxCount = Math.max(...aiUsageChartData.map((d) => d.count), 1);
  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="relative overflow-hidden rounded-[32px] border border-ink/10 bg-gradient-to-br from-moss/10 to-terracotta/10 p-8 shadow-soft">
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gold/20 blur-3xl" />
        <div className="relative flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <User size={24} weight="fill" className="text-ink/60" />
              <p className="text-xs uppercase tracking-[0.3em] text-ink/60">{t.cabinet.title}</p>
            </div>
            <h1 className="mt-2 text-4xl font-semibold">{profile?.name || username}</h1>
            <p className="mt-1 text-sm text-ink/60">{profile?.email || ""}</p>
          </div>

          <div className="flex flex-col items-end gap-3">
            {isActive && (
              <div className="inline-flex items-center gap-2 rounded-full border border-moss/20 bg-moss/10 px-4 py-2">
                <CheckCircle size={16} weight="fill" className="text-moss" />
                <span className="text-xs font-semibold text-moss">{t.cabinet.premiumActive}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AI Usage Stats */}
      <section>
        <div className="mb-6 flex items-center gap-3">
          <Sparkle size={24} weight="fill" className="text-gold" />
          <h2 className="text-2xl font-semibold">{t.cabinet.aiTitle}</h2>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* AI Status Card */}
          <div className="rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft">
            <div className="flex items-start gap-3">
              <div className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl ${hasAiAccess ? "bg-moss/10 text-moss" : "bg-ink/5 text-ink/40"}`}>
                <Brain size={24} weight="fill" />
              </div>
              <div className="flex-1">
                <p className="text-xs uppercase tracking-[0.2em] text-ink/50">{t.cabinet.aiStatusLabel}</p>
                <p className="mt-1 text-lg font-semibold">
                  {hasAiAccess ? t.cabinet.aiStatusConnected : t.cabinet.aiStatusDisconnected}
                </p>
              </div>
            </div>
          </div>

          {/* AI Credits Card */}
          {hasAiAccess && aiUsageSummary && (
            <div className="rounded-3xl border border-terracotta/20 bg-terracotta/5 p-6 shadow-soft">
              <div className="flex items-start gap-3">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-terracotta/10 text-terracotta">
                  <Lightning size={24} weight="fill" />
                </div>
                <div className="flex-1">
                  <p className="text-xs uppercase tracking-[0.2em] text-ink/50">{t.cabinet.creditsLabel}</p>
                  <p className="mt-1 text-2xl font-semibold text-terracotta">
                    {Math.max(0, aiUsageSummary.limit - aiUsageSummary.usedCredits)}
                  </p>
                  <p className="text-xs text-ink/60">{t.cabinet.creditsOf.replace("{limit}", String(aiUsageSummary.limit))}</p>
                </div>
              </div>
            </div>
          )}

          {/* AI Usage Count */}
          {hasAiAccess ? (
            <div className="rounded-3xl border border-gold/30 bg-gold/5 p-6 shadow-soft">
              <div className="flex items-start gap-3">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gold/20 text-terracotta">
                  <ChartLineUp size={24} weight="fill" />
                </div>
                <div className="flex-1">
                  <p className="text-xs uppercase tracking-[0.2em] text-ink/50">{t.cabinet.usedLabel}</p>
                  <p className="mt-1 text-2xl font-semibold text-ink">{aiUsageHistory.length}</p>
                  <p className="text-xs text-ink/60">{t.cabinet.aiRequests}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-3xl border border-ink/10 bg-fog/60 p-6 shadow-soft lg:col-span-2">
              <div className="flex items-start gap-3">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-ink/10 text-ink/50">
                  <Warning size={24} weight="fill" />
                </div>
                <div className="flex-1">
                  <p className="text-xs uppercase tracking-[0.2em] text-ink/50">{t.cabinet.aiAccessLabel}</p>
                  <p className="mt-1 text-sm text-ink/70">
                    {t.cabinet.aiAccessHint}
                  </p>
                  <a
                    href="#billing"
                    className="mt-3 inline-flex items-center gap-2 rounded-full border border-ink/20 bg-paper px-4 py-2 text-xs font-semibold text-ink/70 hover:bg-ink/5"
                  >
                    {t.cabinet.goToBilling}
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>

        {hasAiAccess && (
          <div className="mt-6 rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-ink/50">{t.cabinet.aiUsageTitle}</p>
                <p className="mt-1 text-sm text-ink/60">{t.cabinet.aiTopUsed}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-semibold text-ink">{aiUsageHistory.length}</p>
                <p className="text-xs text-ink/50">{t.cabinet.totalRequests}</p>
              </div>
            </div>

            {aiUsageHistory.length === 0 ? (
              <div className="mt-6 py-8 text-center">
                <Sparkle size={48} className="mx-auto text-ink/20" weight="fill" />
                <p className="mt-2 text-sm text-ink/60">{t.cabinet.aiUsageEmpty}</p>
              </div>
            ) : (
              <div className="mt-6 space-y-3">
                {aiUsageChartData.map((item, idx) => {
                  const percentage = (item.count / maxCount) * 100;
                  return (
                    <div key={item.mode} className="group">
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className="flex h-5 w-5 items-center justify-center rounded text-xs font-semibold text-ink/40">
                            {idx + 1}
                          </span>
                          <span className="font-medium text-ink">{item.label}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-ink/60">{item.count} {t.cabinet.timesUsed}</span>
                          <span className="text-xs font-semibold text-terracotta">-{item.credits}</span>
                        </div>
                      </div>
                      <div className="relative h-8 overflow-hidden rounded-xl bg-fog">
                        <div
                          className="absolute inset-y-0 left-0 rounded-xl bg-gradient-to-r from-moss/80 to-moss transition-all duration-500 group-hover:from-moss group-hover:to-moss/90"
                          style={{ width: `${percentage}%` }}
                        >
                          <div className="flex h-full items-center justify-end px-3">
                            <span className="text-xs font-semibold text-paper">
                              {percentage.toFixed(0)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {aiUsageHistory.length > 0 && (
              <div className="mt-6 grid grid-cols-3 gap-4 rounded-2xl border border-ink/5 bg-fog/50 p-4">
                <div className="text-center">
                  <p className="text-xs text-ink/50">{t.cabinet.totalCredits}</p>
                  <p className="mt-1 text-lg font-semibold text-terracotta">
                    {aiUsageHistory.reduce((sum, log) => sum + log.credits, 0)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-ink/50">{t.cabinet.avgCost}</p>
                  <p className="mt-1 text-lg font-semibold text-ink">
                    {(aiUsageHistory.reduce((sum, log) => sum + log.credits, 0) / aiUsageHistory.length).toFixed(1)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-ink/50">{t.cabinet.exerciseTypes}</p>
                  <p className="mt-1 text-lg font-semibold text-moss">
                    {Object.keys(aiUsageByMode).length}
                  </p>
                </div>
              </div>
            )}

            <p className="mt-4 text-xs text-ink/50">{t.cabinet.aiExtra}</p>
          </div>
        )}
      </section>

      {/* Account Settings */}
      <section id="billing">
        <div className="mb-6 flex items-center gap-3">
          <Lock size={24} weight="fill" className="text-ink" />
          <h2 className="text-2xl font-semibold">{t.cabinet.accountSettings}</h2>
        </div>

        <div className="space-y-4">
          {/* Password Change - Collapsible */}
          <div className="rounded-3xl border border-ink/10 bg-paper/80 shadow-soft transition hover:border-ink/20">
            <button
              onClick={() => setShowPasswordForm(!showPasswordForm)}
              className="flex w-full items-center justify-between p-6 text-left transition"
            >
              <div className="flex items-center gap-3">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-ink/5 text-ink">
                  <Lock size={20} weight="bold" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{t.cabinet.changePassword}</h3>
                  <p className="text-xs text-ink/60">{t.cabinet.changePasswordDesc}</p>
                </div>
              </div>
              <div className={`transition ${showPasswordForm ? "rotate-180" : ""}`}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                </svg>
              </div>
            </button>

            {showPasswordForm && (
              <div className="border-t border-ink/10 p-6">
                <form onSubmit={changePassword} className="space-y-4">
                  <p className="text-sm text-ink/60">{t.cabinet.passwordCodeHint}</p>
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={requestPasswordCode}
                      disabled={resendCooldown > 0}
                      className="inline-flex items-center gap-2 rounded-full border border-ink/20 px-5 py-2 text-sm font-semibold text-ink transition hover:bg-ink/5 disabled:opacity-60"
                    >
                      <Lightning size={16} weight="fill" />
                      {resendCooldown > 0
                        ? `${t.cabinet.passwordSendCode} (${Math.floor(resendCooldown / 60)}:${String(
                            resendCooldown % 60
                          ).padStart(2, "0")})`
                        : t.cabinet.passwordSendCode}
                    </button>
                  </div>

                  <label className="block text-sm text-ink/70">
                    {t.cabinet.passwordCode}
                    <input
                      value={emailCode}
                      onChange={(event) => setEmailCode(event.target.value)}
                      className="mt-2 w-full rounded-2xl border border-ink/20 bg-paper px-4 py-3 tracking-[0.4em] transition focus:border-ink/40 focus:outline-none"
                      placeholder="123456"
                      required
                    />
                  </label>

                  <label className="block text-sm text-ink/70">
                    {t.cabinet.newPassword}
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(event) => setNewPassword(event.target.value)}
                      className="mt-2 w-full rounded-2xl border border-ink/20 bg-paper px-4 py-3 transition focus:border-ink/40 focus:outline-none"
                      required
                    />
                  </label>

                  <label className="block text-sm text-ink/70">
                    {t.cabinet.confirmPassword}
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      className="mt-2 w-full rounded-2xl border border-ink/20 bg-paper px-4 py-3 transition focus:border-ink/40 focus:outline-none"
                      required
                    />
                  </label>

                  <button
                    type="submit"
                    className="w-full rounded-full bg-ink px-5 py-3 text-sm font-semibold text-paper shadow-soft transition hover:bg-ink/90"
                  >
                    {t.common.save}
                  </button>

                  {passwordMessage && (
                    <div className={`flex items-center gap-2 rounded-2xl border px-4 py-3 ${passwordTone === "error" ? "border-terracotta/20 bg-terracotta/5 text-terracotta" : "border-moss/20 bg-moss/5 text-moss"}`}>
                      {passwordTone === "error" ? (
                        <XCircle size={20} weight="fill" />
                      ) : (
                        <CheckCircle size={20} weight="fill" />
                      )}
                      <p className="text-sm">{passwordMessage}</p>
                    </div>
                  )}
                </form>
              </div>
            )}
          </div>

          {/* Promo Code - Collapsible */}
          <div className="rounded-3xl border border-ink/10 bg-paper/80 shadow-soft transition hover:border-ink/20">
            <button
              onClick={() => setShowPromoForm(!showPromoForm)}
              className="flex w-full items-center justify-between p-6 text-left transition"
            >
              <div className="flex items-center gap-3">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-gold/20 text-terracotta">
                  <Ticket size={20} weight="bold" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{t.cabinet.promoTitle}</h3>
                  <div className="mt-1 flex items-center gap-2">
                    {isActive ? (
                      <>
                        <CheckCircle size={14} weight="fill" className="text-moss" />
                        <span className="text-xs text-moss">{t.cabinet.activePromo}</span>
                      </>
                    ) : (
                      <span className="text-xs text-ink/60">{t.cabinet.activatePromo}</span>
                    )}
                  </div>
                </div>
              </div>
              <div className={`transition ${showPromoForm ? "rotate-180" : ""}`}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                </svg>
              </div>
            </button>

            {showPromoForm && (
              <div className="border-t border-ink/10 p-6">
                <p className="text-sm text-ink/60">{t.cabinet.promoSubtitle}</p>

                <div className={`mt-4 rounded-2xl border px-4 py-3 ${isActive ? "border-moss/20 bg-moss/5" : "border-ink/10 bg-fog"}`}>
                  <div className="flex items-center gap-2">
                    {isActive ? (
                      <CheckCircle size={18} weight="fill" className="text-moss" />
                    ) : (
                      <XCircle size={18} weight="fill" className="text-ink/40" />
                    )}
                    <p className="text-sm text-ink/70">
                      {isActive ? (
                        <>
                          {t.cabinet.promoActive}{" "}
                          {profile.subscription?.expiresAt
                            ? new Date(profile.subscription.expiresAt).toLocaleDateString()
                            : t.cabinet.promoUnlimited}
                        </>
                      ) : (
                        t.cabinet.promoInactive
                      )}
                    </p>
                  </div>
                </div>

                <form onSubmit={applyPromo} className="mt-4 flex flex-wrap gap-3">
                  <input
                    value={promoCode}
                    onChange={(event) => setPromoCode(event.target.value.toUpperCase())}
                    className="min-w-[220px] flex-1 rounded-2xl border border-ink/20 bg-paper px-4 py-3 text-sm uppercase tracking-wider transition focus:border-ink/40 focus:outline-none"
                    placeholder={t.cabinet.promoPlaceholder}
                  />
                  <button
                    type="submit"
                    className="rounded-full bg-ink px-6 py-3 text-sm font-semibold text-paper shadow-soft transition hover:bg-ink/90"
                  >
                    {t.cabinet.promoApply}
                  </button>
                </form>

                {promoMessage && (
                  <div className={`mt-3 flex items-center gap-2 rounded-2xl border px-4 py-3 ${promoMessage.tone === "error" ? "border-terracotta/20 bg-terracotta/5 text-terracotta" : "border-moss/20 bg-moss/5 text-moss"}`}>
                    {promoMessage.tone === "error" ? (
                      <XCircle size={20} weight="fill" />
                    ) : (
                      <CheckCircle size={20} weight="fill" />
                    )}
                    <p className="text-sm">{promoMessage.text}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Billing Plans */}
      <section id="billing">
        <div className="mb-6 flex items-center gap-3">
          <CreditCard size={24} weight="fill" className="text-ink" />
          <h2 className="text-2xl font-semibold">{t.cabinet.billingTitle}</h2>
        </div>

        <div
          className={`relative overflow-hidden rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft ${
            isActive ? "border-moss/20" : ""
          }`}
        >
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-terracotta/15 blur-3xl" />
          <div className="pointer-events-none absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-moss/10 blur-3xl" />
          <div className="relative">
            <div className="flex flex-wrap items-start justify-between gap-6">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-ink/50">{t.cabinet.billingSubtitle}</p>
                <p className="mt-3 text-2xl font-semibold">
                  {isActive ? (
                    <>
                      {t.cabinet.billingActive}{" "}
                      <span className="text-moss">
                        {profile.subscription?.expiresAt
                          ? `${Math.max(
                              0,
                              Math.ceil(
                                (new Date(profile.subscription.expiresAt).getTime() - Date.now()) /
                                  (1000 * 60 * 60 * 24)
                              )
                            )} ${t.cabinet.billingDays}`
                          : t.cabinet.promoUnlimited}
                      </span>
                    </>
                  ) : (
                    t.cabinet.billingInactive
                  )}
                </p>
                <p className="mt-2 text-sm text-ink/60">
                  {isActive ? t.cabinet.billingAutoRenewHint : t.cabinet.billingSubtitle}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                {isActive ? (
                  <span className="inline-flex items-center gap-2 rounded-full border border-moss/30 bg-moss/10 px-4 py-2 text-xs font-semibold text-moss">
                    <Trophy size={16} weight="fill" />
                    {t.cabinet.activePlan}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2 rounded-full border border-ink/20 bg-paper/70 px-4 py-2 text-xs font-semibold text-ink/60">
                    Free
                  </span>
                )}
                <span className="text-xs text-ink/40">Monobank · Visa/Mastercard</span>
              </div>
            </div>

            {(hasPromoAccess || blurPlans) && (
              <div className="mt-4 rounded-2xl border border-gold/30 bg-gold/5 px-4 py-3">
                <div className="flex items-start gap-2">
                  <Sparkle size={18} weight="fill" className="mt-0.5 text-gold" />
                  <p className="text-sm text-ink/70">
                    {hasPromoAccess ? t.cabinet.billingPromoNotice : t.cabinet.billingSoonNotice}
                  </p>
                </div>
              </div>
            )}

            <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
              <label className="flex items-center gap-2 rounded-full border border-ink/10 bg-paper/70 px-4 py-2 text-xs font-semibold text-ink/70">
                <input
                  type="checkbox"
                  checked={autoRenew}
                  onChange={(event) => setAutoRenew(event.target.checked)}
                  className="accent-ink"
                />
                {t.cabinet.billingAutoRenew}
              </label>
              {isActive && (
                <div className="flex flex-wrap items-center gap-3">
                  {profile?.subscription?.autoRenew ? (
                    <button
                      onClick={cancelSubscription}
                      className="rounded-full border border-terracotta/30 bg-terracotta/5 px-4 py-2 text-xs font-semibold text-terracotta transition hover:bg-terracotta/10"
                    >
                      {t.cabinet.billingCancel}
                    </button>
                  ) : (
                    <button
                      onClick={resumeSubscription}
                      className="rounded-full border border-moss/30 bg-moss/5 px-4 py-2 text-xs font-semibold text-moss transition hover:bg-moss/10"
                    >
                      {t.cabinet.billingResume}
                    </button>
                  )}
                </div>
              )}
            </div>

            {billingMessage && (
              <div
                className={`mt-3 rounded-2xl border px-4 py-3 text-sm ${
                  billingMessage.tone === "error"
                    ? "border-terracotta/20 bg-terracotta/5 text-terracotta"
                    : "border-moss/20 bg-moss/5 text-moss"
                }`}
              >
                {billingMessage.text}
              </div>
            )}

            <div
              className={`mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 ${
                hasPromoAccess || blurPlans ? "pointer-events-none select-none blur-[8px] opacity-40" : ""
              }`}
            >
              {billingPlans.map((plan) => {
                const usage = profile?.aiUsage;
                const planInfo = getPlanById(plan.id);
                const remaining =
                  usage?.month ? Math.max(0, planInfo.aiCreditsMonthly - (usage.usedCredits || 0)) : planInfo.aiCreditsMonthly;
                const activePlanId = profile?.subscription?.planId
                  ? getPlanById(profile.subscription.planId).id
                  : null;
                const isCurrentPlan = isActive && activePlanId === plan.id;
                const periodLabel =
                  plan.periodDays >= 365 ? t.cabinet.periodLabels.year : plan.periodDays >= 90 ? t.cabinet.periodLabels.quarter : t.cabinet.periodLabels.month;
                const tierLabel = t.cabinet.planTiers[plan.tier];
                const badge =
                  plan.periodDays >= 365 ? t.cabinet.planBestValue : plan.tier === "pro" ? t.cabinet.planMostPopular : "";

                return (
                  <div
                    key={plan.id}
                    className={`group relative rounded-3xl border p-6 transition duration-200 hover:-translate-y-1 hover:shadow-soft ${
                      isCurrentPlan
                        ? "border-moss/30 bg-moss/5 ring-2 ring-moss/20"
                        : "border-ink/10 bg-paper/90"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink/60">
                          {tierLabel}
                        </p>
                        <div className="mt-3 flex items-end gap-2">
                          <span className="text-3xl font-semibold">{plan.priceUah} ₴</span>
                          <span className="pb-1 text-xs text-ink/50">/ {periodLabel}</span>
                        </div>
                        <p className="mt-2 text-xs text-ink/50">
                          {planInfo.aiCreditsMonthly} {t.cabinet.creditsLabel}
                        </p>
                      </div>
                      {badge ? (
                        <span className="rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-[10px] font-semibold text-gold">
                          {badge}
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-4 space-y-2 text-xs text-ink/70">
                      <div className="flex items-center gap-2">
                        <CheckCircle size={14} weight="fill" className="text-moss" />
                        <span>{plan.allowAIGenerate ? t.cabinet.planAiGenerate : t.cabinet.planAiCheckOnly}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Lightning size={14} weight="fill" className="text-gold" />
                        <span>{planInfo.aiCreditsMonthly} {t.cabinet.creditsLabel}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Brain size={14} weight="fill" className="text-ink/50" />
                        <span>{t.cabinet.aiPvsIncluded}</span>
                      </div>
                    </div>

                    {isCurrentPlan && (
                      <div className="mt-4 rounded-2xl border border-moss/10 bg-moss/5 px-3 py-2 text-xs">
                        <span className="font-semibold text-moss">{remaining}</span>
                        <span className="text-ink/60"> / {planInfo.aiCreditsMonthly} {t.cabinet.remaining}</span>
                      </div>
                    )}

                    <button
                      onClick={() => startPayment(plan.id)}
                      className={`mt-5 w-full rounded-full border px-4 py-2 text-xs font-semibold transition ${
                        isCurrentPlan
                          ? "border-moss/30 bg-moss/10 text-moss"
                          : "border-ink/20 text-ink hover:bg-ink/5"
                      }`}
                      disabled={isCurrentPlan}
                    >
                      {isCurrentPlan ? t.cabinet.activePlan : t.cabinet.billingPayMono}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Privacy & Consents */}
      <section>
        <div className="mb-6 flex items-center gap-3">
          <User size={24} weight="fill" className="text-ink/50" />
          <h2 className="text-2xl font-semibold">{t.cabinet.privacyTitle}</h2>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft">
            <h3 className="text-lg font-semibold">{t.cabinet.cookieSettingsTitle}</h3>
            <p className="mt-1 text-sm text-ink/60">{t.cabinet.cookieSettingsHint}</p>
            <div className="mt-4 space-y-3 text-sm text-ink/70">
              <label className="flex items-start gap-3">
                <input type="checkbox" checked readOnly className="mt-0.5 h-4 w-4 rounded border-ink/30 accent-ink" />
                <span>{t.cabinet.cookieNecessary}</span>
              </label>
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={cookieAnalytics}
                  onChange={(event) => setCookieAnalytics(event.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-ink/30 accent-ink"
                />
                <span>{t.cabinet.cookieAnalytics}</span>
              </label>
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={cookieMarketing}
                  onChange={(event) => setCookieMarketing(event.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-ink/30 accent-ink"
                />
                <span>{t.cabinet.cookieMarketing}</span>
              </label>
            </div>
            <div className="mt-4 flex items-center gap-3">
              <button
                onClick={saveCookiePreferences}
                className="rounded-full bg-ink px-5 py-2 text-sm font-semibold text-paper"
              >
                {t.cabinet.savePreferences}
              </button>
              {prefsStatus === "done" && (
                <span className="text-xs text-moss">{t.cabinet.savePreferencesDone}</span>
              )}
              {prefsStatus === "error" && (
                <span className="text-xs text-terracotta">{t.cabinet.savePreferencesError}</span>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft">
            <h3 className="text-lg font-semibold">{t.cabinet.privacyTitle}</h3>
            <p className="mt-1 text-sm text-ink/60">{t.cabinet.privacySubtitle}</p>
            <div className="mt-4 space-y-3">
              <label className="flex items-start gap-3 text-sm text-ink/70">
                <input
                  type="checkbox"
                  checked={marketingConsent}
                  onChange={(event) => updateMarketingConsent(event.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-ink/30 accent-ink"
                />
                <span>{t.cabinet.marketingConsentLabel}</span>
              </label>
              {marketingStatus === "done" && (
                <span className="text-xs text-moss">{t.cabinet.savePreferencesDone}</span>
              )}
              {marketingStatus === "error" && (
                <span className="text-xs text-terracotta">{t.cabinet.savePreferencesError}</span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Data Request */}
      <section>
        <div className="mb-6 flex items-center gap-3">
          <Warning size={24} weight="fill" className="text-ink/50" />
          <h2 className="text-2xl font-semibold">{t.cabinet.dataRequestTitle}</h2>
        </div>
        <div className="rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft">
          <p className="text-sm text-ink/60">{t.cabinet.dataRequestSubtitle}</p>
          <form onSubmit={submitDataRequest} className="mt-4 space-y-4">
            <label className="block text-sm text-ink/70">
              {t.cabinet.dataRequestType}
              <select
                value={dataRequestType}
                onChange={(event) => setDataRequestType(event.target.value as "access" | "delete")}
                className="mt-2 w-full rounded-2xl border border-ink/20 bg-paper px-4 py-2 text-sm"
              >
                <option value="access">{t.cabinet.dataRequestAccess}</option>
                <option value="delete">{t.cabinet.dataRequestDelete}</option>
              </select>
            </label>
            <label className="block text-sm text-ink/70">
              {t.cabinet.dataRequestMessage}
              <textarea
                value={dataRequestMessage}
                onChange={(event) => setDataRequestMessage(event.target.value)}
                className="mt-2 min-h-[120px] w-full rounded-2xl border border-ink/20 bg-paper px-4 py-3 text-sm"
              />
            </label>
            <div className="flex items-center gap-3">
              <button
                type="submit"
                className="rounded-full bg-ink px-5 py-2 text-sm font-semibold text-paper"
                disabled={dataRequestStatus === "saving"}
              >
                {t.cabinet.dataRequestSend}
              </button>
              {dataRequestStatus === "done" && (
                <span className="text-xs text-moss">{t.cabinet.dataRequestDone}</span>
              )}
              {dataRequestStatus === "error" && (
                <span className="text-xs text-terracotta">{t.cabinet.dataRequestError}</span>
              )}
            </div>
          </form>
        </div>
      </section>

      {/* Danger Zone */}
      <section>
        <div className="mb-6 flex items-center gap-3">
          <Warning size={24} weight="fill" className="text-terracotta" />
          <h2 className="text-2xl font-semibold">{t.cabinet.dangerTitle}</h2>
        </div>

        <div className="rounded-3xl border border-terracotta/20 bg-terracotta/5 p-6 shadow-soft">
          <p className="text-sm text-ink/70">{t.cabinet.dangerHint}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={() => {
                setDangerStatus("idle");
                setShowResetModal(true);
              }}
              className="inline-flex items-center gap-2 rounded-full border border-terracotta/40 px-6 py-3 text-sm font-semibold text-terracotta transition hover:bg-terracotta/10"
            >
              <Warning size={18} weight="bold" />
              {t.cabinet.resetProgress}
            </button>
            <button
              onClick={() => {
                setDangerStatus("idle");
                setShowDeleteModal(true);
              }}
              className="inline-flex items-center gap-2 rounded-full bg-terracotta px-6 py-3 text-sm font-semibold text-paper shadow-soft transition hover:bg-terracotta/90"
            >
              <XCircle size={18} weight="bold" />
              {t.cabinet.deleteAccount}
            </button>
          </div>
          {dangerStatus === "error" && (
            <div className="mt-3 flex items-center gap-2 rounded-2xl border border-terracotta/30 bg-terracotta/10 px-4 py-3">
              <XCircle size={20} weight="fill" className="text-terracotta" />
              <p className="text-sm text-terracotta">{t.cabinet.dangerError}</p>
            </div>
          )}
        </div>
      </section>

      {/* Reset Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 px-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-ink/10 bg-paper p-6 shadow-soft">
            <div className="flex items-center gap-3">
              <Warning size={32} weight="fill" className="text-terracotta" />
              <h3 className="text-2xl font-semibold">{t.cabinet.resetTitle}</h3>
            </div>
            <p className="mt-4 text-sm text-ink/60">{t.cabinet.resetText}</p>
            <div className="mt-6 space-y-4">
              <label className="block text-sm text-ink/70">
                {t.cabinet.resetConfirm}
                <input
                  value={confirmReset}
                  onChange={(event) => setConfirmReset(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-ink/20 bg-paper px-4 py-3 uppercase tracking-wider transition focus:border-ink/40 focus:outline-none"
                  placeholder="RESET"
                />
              </label>
              <label className="flex items-center gap-3 text-sm text-ink/70">
                <input
                  type="checkbox"
                  checked={ackReset}
                  onChange={(event) => setAckReset(event.target.checked)}
                  className="accent-ink"
                />
                {t.cabinet.resetAck}
              </label>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={() => setShowResetModal(false)}
                className="rounded-full border border-ink/20 px-6 py-3 text-sm font-semibold transition hover:bg-ink/5"
              >
                {t.common.cancel}
              </button>
              <button
                onClick={resetProgress}
                disabled={confirmReset.trim().toUpperCase() !== "RESET" || !ackReset}
                className="rounded-full bg-terracotta px-6 py-3 text-sm font-semibold text-paper shadow-soft transition hover:bg-terracotta/90 disabled:opacity-60"
              >
                {dangerStatus === "saving" ? t.cabinet.working : t.cabinet.resetAction}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 px-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-ink/10 bg-paper p-6 shadow-soft">
            <div className="flex items-center gap-3">
              <XCircle size={32} weight="fill" className="text-terracotta" />
              <h3 className="text-2xl font-semibold">{t.cabinet.deleteTitle}</h3>
            </div>
            <p className="mt-4 text-sm text-ink/60">{t.cabinet.deleteText}</p>
            <div className="mt-6 space-y-4">
              <label className="block text-sm text-ink/70">
                {t.cabinet.deleteConfirm}
                <input
                  value={confirmDelete}
                  onChange={(event) => setConfirmDelete(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-ink/20 bg-paper px-4 py-3 uppercase tracking-wider transition focus:border-ink/40 focus:outline-none"
                  placeholder="DELETE"
                />
              </label>
              <label className="flex items-center gap-3 text-sm text-ink/70">
                <input
                  type="checkbox"
                  checked={ackDelete}
                  onChange={(event) => setAckDelete(event.target.checked)}
                  className="accent-ink"
                />
                {t.cabinet.deleteAck}
              </label>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="rounded-full border border-ink/20 px-6 py-3 text-sm font-semibold transition hover:bg-ink/5"
              >
                {t.common.cancel}
              </button>
              <button
                onClick={deleteAccount}
                disabled={confirmDelete.trim().toUpperCase() !== "DELETE" || !ackDelete}
                className="rounded-full bg-terracotta px-6 py-3 text-sm font-semibold text-paper shadow-soft transition hover:bg-terracotta/90 disabled:opacity-60"
              >
                {dangerStatus === "saving" ? t.cabinet.working : t.cabinet.deleteAction}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
