"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { plans as defaultPlans, Plan } from "@/lib/plans";
type UserProfile = {
  username: string;
  name?: string;
  email?: string;
  emailVerified?: boolean;
  subscription?: {
    status: string;
    expiresAt: string | null;
    promoCode: string | null;
  };
};

export default function CabinetClient({ username }: { username: string }) {
  const { t } = useLocale();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [emailCode, setEmailCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [passwordTone, setPasswordTone] = useState<"error" | "success">("success");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [promoCode, setPromoCode] = useState("");
  const [promoMessage, setPromoMessage] = useState<{ text: string; tone: "error" | "success" } | null>(null);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmReset, setConfirmReset] = useState("");
  const [confirmDelete, setConfirmDelete] = useState("");
  const [ackReset, setAckReset] = useState(false);
  const [ackDelete, setAckDelete] = useState(false);
  const [dangerStatus, setDangerStatus] = useState<"idle" | "saving" | "error" | "done">("idle");
  const hasPromoAccess = Boolean(profile?.subscription?.promoCode);
  const [billingPlans, setBillingPlans] = useState<Plan[]>(defaultPlans);
  const [blurPlans, setBlurPlans] = useState(false);

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
    }
  }

  useEffect(() => {
    loadProfile();
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

  async function requestPasswordCode() {
    setPasswordMessage(null);
    const res = await fetch("/api/user/password/request", { method: "POST" });
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
    const res = await fetch("/api/user/password/confirm", {
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
    const res = await fetch("/api/user/reset", { method: "POST" });
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
    const res = await fetch("/api/user/delete", { method: "DELETE" });
    if (!res.ok) {
      setDangerStatus("error");
      return;
    }
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/register";
  }

  async function applyPromo(event: React.FormEvent) {
    event.preventDefault();
    setPromoMessage(null);
    const res = await fetch("/api/user/promo", {
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

  return (
    <div className="space-y-10">
      <div className="space-y-3">
        <h1 className="text-4xl font-semibold">{t.cabinet.title}</h1>
        <p className="text-sm text-ink/60">{t.cabinet.subtitle}</p>
        <p className="text-sm text-ink/70">{profile?.name || username}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <div className="rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft">
          <h2 className="text-2xl font-semibold">{t.cabinet.profileLabel}</h2>
          <form onSubmit={changePassword} className="mt-6 space-y-4">
            <h3 className="text-lg font-semibold">{t.cabinet.changePassword}</h3>
            <p className="text-sm text-ink/60">{t.cabinet.passwordCodeHint}</p>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={requestPasswordCode}
                disabled={resendCooldown > 0}
                className="rounded-full border border-ink/20 px-5 py-2 text-sm font-semibold text-ink disabled:opacity-60"
              >
                {resendCooldown > 0
                  ? `${t.cabinet.passwordSendCode} (${Math.floor(resendCooldown / 60)}:${String(
                      resendCooldown % 60
                    ).padStart(2, "0")})`
                  : t.cabinet.passwordSendCode}
              </button>
              <span className="text-xs text-ink/50">{profile?.email || ""}</span>
            </div>
            <label className="block text-sm text-ink/70">
              {t.cabinet.passwordCode}
              <input
                value={emailCode}
                onChange={(event) => setEmailCode(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-ink/20 bg-paper px-4 py-3 tracking-[0.4em]"
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
                className="mt-2 w-full rounded-2xl border border-ink/20 bg-paper px-4 py-3"
                required
              />
            </label>
            <label className="block text-sm text-ink/70">
              {t.cabinet.confirmPassword}
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-ink/20 bg-paper px-4 py-3"
                required
              />
            </label>
            <button
              type="submit"
              className="rounded-full bg-ink px-5 py-2 text-sm font-semibold text-paper"
            >
              {t.common.save}
            </button>
            {passwordMessage && (
              <p className={`text-sm ${passwordTone === "error" ? "text-terracotta" : "text-moss"}`}>
                {passwordMessage}
              </p>
            )}
          </form>
        </div>

        <div className="rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft">
          <h2 className="text-2xl font-semibold">{t.cabinet.promoTitle}</h2>
          <p className="mt-2 text-sm text-ink/60">{t.cabinet.promoSubtitle}</p>
          <div className="mt-4 rounded-2xl border border-ink/10 bg-paper/60 px-4 py-3 text-sm text-ink/70">
            {profile?.subscription?.status === "active" ? (
              <>
                {t.cabinet.promoActive}{" "}
                {profile.subscription?.expiresAt
                  ? new Date(profile.subscription.expiresAt).toLocaleDateString()
                  : t.cabinet.promoUnlimited}
              </>
            ) : (
              t.cabinet.promoInactive
            )}
          </div>
          <form onSubmit={applyPromo} className="mt-4 flex flex-wrap gap-3">
            <input
              value={promoCode}
              onChange={(event) => setPromoCode(event.target.value.toUpperCase())}
              className="min-w-[220px] flex-1 rounded-2xl border border-ink/20 bg-paper px-4 py-3 text-sm"
              placeholder={t.cabinet.promoPlaceholder}
            />
            <button
              type="submit"
              className="rounded-full bg-ink px-5 py-2 text-sm font-semibold text-paper"
            >
              {t.cabinet.promoApply}
            </button>
          </form>
          {promoMessage && (
            <p className={`mt-3 text-sm ${promoMessage.tone === "error" ? "text-terracotta" : "text-moss"}`}>
              {promoMessage.text}
            </p>
          )}
        </div>

        <div className="rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft">
          <h2 className="text-2xl font-semibold">{t.cabinet.billingTitle}</h2>
          <p className="mt-2 text-sm text-ink/60">{t.cabinet.billingSubtitle}</p>
          <div className="mt-4 rounded-2xl border border-ink/10 bg-paper/60 px-4 py-3 text-sm text-ink/70">
            {profile?.subscription?.status === "active" ? (
              <>
                {t.cabinet.billingActive}{" "}
                {profile.subscription?.expiresAt
                  ? `${Math.max(
                      0,
                      Math.ceil(
                        (new Date(profile.subscription.expiresAt).getTime() - Date.now()) /
                          (1000 * 60 * 60 * 24)
                      )
                    )} ${t.cabinet.billingDays}`
                  : t.cabinet.promoUnlimited}
              </>
            ) : (
              t.cabinet.billingInactive
            )}
          </div>
          {(hasPromoAccess || blurPlans) && (
            <div className="mt-4 rounded-2xl border border-ink/10 bg-paper/60 px-4 py-3 text-sm text-ink/70">
              {hasPromoAccess ? t.cabinet.billingPromoNotice : t.cabinet.billingSoonNotice}
            </div>
          )}
          <div
            className={`mt-4 grid gap-3 sm:grid-cols-2 ${
              hasPromoAccess || blurPlans ? "pointer-events-none select-none blur-[8px] opacity-40" : ""
            }`}
          >
            {billingPlans.map((plan) => (
              <div key={plan.id} className="rounded-2xl border border-ink/10 bg-paper/80 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-ink/50">
                  {t.cabinet.planLabels[plan.id]}
                </p>
                <p className="mt-2 text-2xl font-semibold">{plan.priceUah} ₴</p>
                <button
                  className="mt-3 w-full rounded-full border border-ink/20 px-4 py-2 text-xs font-semibold text-ink"
                  disabled
                >
                  {t.cabinet.billingMonoSoon}
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft">
          <h2 className="text-2xl font-semibold">{t.cabinet.dangerTitle}</h2>
          <p className="mt-2 text-sm text-ink/60">{t.cabinet.dangerHint}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={() => {
                setDangerStatus("idle");
                setShowResetModal(true);
              }}
              className="rounded-full border border-terracotta/40 px-5 py-2 text-sm font-semibold text-terracotta"
            >
              {t.cabinet.resetProgress}
            </button>
            <button
              onClick={() => {
                setDangerStatus("idle");
                setShowDeleteModal(true);
              }}
              className="rounded-full bg-terracotta px-5 py-2 text-sm font-semibold text-paper"
            >
              {t.cabinet.deleteAccount}
            </button>
          </div>
          {dangerStatus === "error" && (
            <p className="mt-3 text-sm text-terracotta">{t.cabinet.dangerError}</p>
          )}
        </div>
      </div>

      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 px-4">
          <div className="w-full max-w-lg rounded-3xl border border-ink/10 bg-paper p-6 shadow-soft">
            <h3 className="text-2xl font-semibold">{t.cabinet.resetTitle}</h3>
            <p className="mt-2 text-sm text-ink/60">{t.cabinet.resetText}</p>
            <div className="mt-6 space-y-4">
              <label className="block text-sm text-ink/70">
                {t.cabinet.resetConfirm}
                <input
                  value={confirmReset}
                  onChange={(event) => setConfirmReset(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-ink/20 bg-paper px-4 py-3"
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
                className="rounded-full border border-ink/20 px-4 py-2 text-sm font-semibold"
              >
                {t.common.cancel}
              </button>
              <button
                onClick={resetProgress}
                disabled={confirmReset.trim().toUpperCase() !== "RESET" || !ackReset}
                className="rounded-full bg-terracotta px-5 py-2 text-sm font-semibold text-paper disabled:opacity-60"
              >
                {dangerStatus === "saving" ? t.cabinet.working : t.cabinet.resetAction}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 px-4">
          <div className="w-full max-w-lg rounded-3xl border border-ink/10 bg-paper p-6 shadow-soft">
            <h3 className="text-2xl font-semibold">{t.cabinet.deleteTitle}</h3>
            <p className="mt-2 text-sm text-ink/60">{t.cabinet.deleteText}</p>
            <div className="mt-6 space-y-4">
              <label className="block text-sm text-ink/70">
                {t.cabinet.deleteConfirm}
                <input
                  value={confirmDelete}
                  onChange={(event) => setConfirmDelete(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-ink/20 bg-paper px-4 py-3"
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
                className="rounded-full border border-ink/20 px-4 py-2 text-sm font-semibold"
              >
                {t.common.cancel}
              </button>
              <button
                onClick={deleteAccount}
                disabled={confirmDelete.trim().toUpperCase() !== "DELETE" || !ackDelete}
                className="rounded-full bg-terracotta px-5 py-2 text-sm font-semibold text-paper disabled:opacity-60"
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
