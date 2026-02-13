"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/components/LocaleProvider";
import Link from "next/link";

export default function AuthPanel({ initialMode = "login" }: { initialMode?: "login" | "register" }) {
  const { t } = useLocale();
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const [stage, setStage] = useState<"auth" | "verify" | "recover">("auth");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [recoverEmail, setRecoverEmail] = useState("");
  const [recoverCode, setRecoverCode] = useState("");
  const [recoverPassword, setRecoverPassword] = useState("");
  const [recoverConfirm, setRecoverConfirm] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const storedEmail = window.localStorage.getItem("pendingVerificationEmail");
    if (storedEmail) {
      setEmail(storedEmail);
      setStage("verify");
      setMessage(t.auth.verifySent);
      startCooldown(60);
    }
  }, [t]);

  useEffect(() => {
    const storedPromo = window.localStorage.getItem("pvs_beta_promo");
    if (storedPromo && !promoCode) {
      setPromoCode(storedPromo);
    }
  }, [promoCode]);

  const identifierLabel = useMemo(() => t.auth.identifier, [t]);
  const resendLabel = useMemo(() => {
    if (resendCooldown <= 0) return t.auth.verifyResend;
    const seconds = resendCooldown % 60;
    const padded = String(seconds).padStart(2, "0");
    return `${t.auth.verifyResend} (${Math.floor(resendCooldown / 60)}:${padded})`;
  }, [resendCooldown, t]);

  function startCooldown(seconds: number) {
    setResendCooldown(seconds);
  }

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = window.setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [resendCooldown]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    if (mode === "register" && !agreeTerms) {
      setMessage(t.auth.termsError);
      setLoading(false);
      return;
    }

    const body =
      mode === "register"
        ? {
            username,
            password,
            confirmPassword,
            name,
            promoCode: promoCode.trim() || null,
            email,
            acceptTerms: agreeTerms,
            marketingOptIn
          }
        : { identifier: username, password };

    const res = await fetch(`/api/auth/${mode}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      if (data?.code === "EMAIL_NOT_VERIFIED" && data?.email) {
        setEmail(data.email);
        setStage("verify");
        setMessage(t.auth.verifySent);
        startCooldown(60);
        window.localStorage.setItem("pendingVerificationEmail", data.email);
      } else if (data?.code === "USERNAME_EXISTS") {
        setMessage(t.auth.usernameExists);
      } else if (data?.code === "EMAIL_EXISTS") {
        setMessage(t.auth.emailExists);
      } else {
        setMessage(data?.error || t.auth.error);
      }
      setLoading(false);
      return;
    }

    if (data?.pendingVerification) {
      setEmail(data.email || email);
      setStage("verify");
      setMessage(t.auth.verifySent);
      startCooldown(60);
      window.localStorage.setItem("pendingVerificationEmail", data.email || email);
      setLoading(false);
      return;
    }

    window.dispatchEvent(new Event("auth-changed"));
    router.push("/cabinet");
  }

  async function handleVerify(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    const res = await fetch("/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code: verificationCode })
    });

    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setMessage(data?.error || t.auth.verifyError);
      setLoading(false);
      return;
    }

    window.localStorage.removeItem("pendingVerificationEmail");
    window.dispatchEvent(new Event("auth-changed"));
    router.push("/cabinet");
  }

  async function handleResend() {
    setLoading(true);
    setMessage(null);

    const res = await fetch("/api/auth/resend-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setMessage(data?.error || t.auth.verifyError);
      setLoading(false);
      return;
    }
    setMessage(t.auth.verifyResent);
    startCooldown(60);
    setLoading(false);
  }

  async function handleChangeEmail() {
    if (!email) return;
    const newEmail = window.prompt(t.auth.changeEmailPrompt, email);
    if (!newEmail) return;
    setLoading(true);
    setMessage(null);
    const res = await fetch("/api/auth/change-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ oldEmail: email, newEmail })
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setMessage(data?.error || t.auth.verifyError);
      setLoading(false);
      return;
    }
    const nextEmail = data.email || newEmail;
    setEmail(nextEmail);
    setMessage(t.auth.verifySent);
    startCooldown(60);
    window.localStorage.setItem("pendingVerificationEmail", nextEmail);
    setLoading(false);
  }

  async function handleRecoverRequest(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    const res = await fetch("/api/auth/password/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: recoverEmail })
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setMessage(data?.error || t.auth.recoverError);
      setLoading(false);
      return;
    }
    setMessage(t.auth.recoverSent);
    startCooldown(60);
    setLoading(false);
  }

  async function handleRecoverConfirm(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    const res = await fetch("/api/auth/password/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: recoverEmail,
        code: recoverCode,
        newPassword: recoverPassword,
        confirmPassword: recoverConfirm
      })
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setMessage(data?.error || t.auth.recoverError);
      setLoading(false);
      return;
    }
    setMessage(t.auth.recoverDone);
    setStage("auth");
    setRecoverCode("");
    setRecoverPassword("");
    setRecoverConfirm("");
    setLoading(false);
  }

  return (
    <div className="relative pb-8">
      <div className="relative p-6 sm:p-10">
        <div className="mx-auto max-w-lg rounded-3xl border-2 border-ink/10 bg-paper/90 p-8 sm:p-8 shadow-soft">
          {stage === "auth" && (
            <>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.4em] text-ink/50 font-bold">{t.auth.welcome}</p>
                  <h1 className="mt-4 sm:mt-3 text-3xl sm:text-3xl font-bold sm:font-semibold leading-tight">
                    {mode === "login" ? t.auth.loginTab : t.auth.registerTab}
                  </h1>
                  <p className="mt-3 sm:mt-2 text-base sm:text-sm text-ink/60 leading-relaxed">{t.auth.subtitle}</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="mt-10 sm:mt-8 space-y-6">
                {mode === "register" ? (
                  <>
                    <div className="grid gap-5 sm:gap-4 sm:grid-cols-2">
                      <label className="block text-base sm:text-sm text-ink/70 font-medium sm:font-normal">
                        {t.auth.name}
                        <input
                          value={name}
                          onChange={(event) => setName(event.target.value)}
                          className="mt-3 sm:mt-2 w-full rounded-2xl border-2 border-ink/20 bg-paper px-5 py-4 sm:px-4 sm:py-3 text-base focus:border-ink/40 focus:outline-none transition"
                          placeholder="Imię"
                          required
                        />
                      </label>
                      <label className="block text-base sm:text-sm text-ink/70 font-medium sm:font-normal">
                        {t.auth.email}
                        <input
                          type="email"
                          value={email}
                          onChange={(event) => setEmail(event.target.value)}
                          className="mt-3 sm:mt-2 w-full rounded-2xl border-2 border-ink/20 bg-paper px-5 py-4 sm:px-4 sm:py-3 text-base focus:border-ink/40 focus:outline-none transition"
                          placeholder={t.auth.emailPlaceholder}
                          required
                        />
                      </label>
                    </div>
                    <div className="grid gap-5 sm:gap-4 sm:grid-cols-2">
                      <label className="block text-base sm:text-sm text-ink/70 font-medium sm:font-normal">
                        {t.auth.username}
                        <input
                          value={username}
                          onChange={(event) => setUsername(event.target.value)}
                          className="mt-3 sm:mt-2 w-full rounded-2xl border-2 border-ink/20 bg-paper px-5 py-4 sm:px-4 sm:py-3 text-base focus:border-ink/40 focus:outline-none transition"
                          placeholder="username"
                          required
                        />
                      </label>
                      <label className="block text-base sm:text-sm text-ink/70 font-medium sm:font-normal">
                        {t.auth.promoCode}
                        <input
                          value={promoCode}
                          onChange={(event) => setPromoCode(event.target.value.toUpperCase())}
                          className="mt-3 sm:mt-2 w-full rounded-2xl border-2 border-ink/20 bg-paper px-5 py-4 sm:px-4 sm:py-3 text-base focus:border-ink/40 focus:outline-none transition"
                          placeholder="OPTIONAL"
                        />
                      </label>
                    </div>
                    <div className="grid gap-5 sm:gap-4 sm:grid-cols-2">
                      <label className="block text-base sm:text-sm text-ink/70 font-medium sm:font-normal">
                        {t.auth.password}
                        <input
                          type="password"
                          value={password}
                          onChange={(event) => setPassword(event.target.value)}
                          className="mt-3 sm:mt-2 w-full rounded-2xl border-2 border-ink/20 bg-paper px-5 py-4 sm:px-4 sm:py-3 text-base focus:border-ink/40 focus:outline-none transition"
                          placeholder="••••••••"
                          required
                        />
                      </label>
                      <label className="block text-base sm:text-sm text-ink/70 font-medium sm:font-normal">
                        {t.auth.confirmPassword}
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(event) => setConfirmPassword(event.target.value)}
                          className="mt-3 sm:mt-2 w-full rounded-2xl border-2 border-ink/20 bg-paper px-5 py-4 sm:px-4 sm:py-3 text-base focus:border-ink/40 focus:outline-none transition"
                          placeholder="••••••••"
                          required
                        />
                      </label>
                    </div>
                  </>
                ) : (
                  <>
                    <label className="block text-base sm:text-sm text-ink/70 font-medium sm:font-normal">
                      {identifierLabel}
                      <input
                        value={username}
                        onChange={(event) => setUsername(event.target.value)}
                        className="mt-3 sm:mt-2 w-full rounded-2xl border-2 border-ink/20 bg-paper px-5 py-4 sm:px-4 sm:py-3 text-base focus:border-ink/40 focus:outline-none transition"
                        placeholder={t.auth.identifierPlaceholder}
                        required
                      />
                    </label>
                    <label className="block text-sm text-ink/70">
                      {t.auth.password}
                      <input
                        type="password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        className="mt-2 w-full rounded-2xl border border-ink/20 bg-paper px-4 py-3 text-base"
                        placeholder="••••••••"
                        required
                      />
                    </label>
                  </>
                )}
                {mode === "register" && (
                  <>
                  <label className="flex items-start gap-3 rounded-2xl border border-ink/10 bg-paper/60 px-4 py-3 text-xs sm:text-xs text-ink/70">
                    <input
                      type="checkbox"
                      checked={agreeTerms}
                      onChange={(event) => setAgreeTerms(event.target.checked)}
                      className="mt-0.5 h-4 w-4 flex-shrink-0 rounded border-ink/30 accent-ink"
                      required
                    />
                    <span className="leading-relaxed text-xs sm:text-xs">
                      {t.auth.termsLabelStart}{" "}
                      <Link className="underline underline-offset-4" href="/terms">
                        {t.auth.termsLink}
                      </Link>{" "}
                      {t.auth.termsLabelAnd}{" "}
                      <Link className="underline underline-offset-4" href="/privacy">
                        {t.auth.privacyLink}
                      </Link>
                      ,{" "}
                      <Link className="underline underline-offset-4" href="/subscription">
                        {t.auth.subscriptionLink}
                      </Link>{" "}
                      {t.auth.termsLabelAnd}{" "}
                      <Link className="underline underline-offset-4" href="/cookies">
                        {t.auth.cookiesLink}
                      </Link>
                      .{" "}
                      <span className="text-ink/50">{t.auth.ageNotice}</span>
                    </span>
                  </label>
                  <label className="flex items-start gap-3 rounded-2xl border border-ink/10 bg-paper/40 px-4 py-3 text-xs text-ink/60">
                    <input
                      type="checkbox"
                      checked={marketingOptIn}
                      onChange={(event) => setMarketingOptIn(event.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-ink/30 accent-ink"
                    />
                    <span>{t.auth.marketingOptIn}</span>
                  </label>
                  </>
                )}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-ink px-8 py-4 sm:px-6 sm:py-3.5 text-base sm:text-sm font-bold sm:font-semibold text-paper disabled:opacity-60 transition-all active:scale-95 shadow-soft"
            >
              {mode === "login" ? t.auth.login : t.auth.register}
            </button>
            {mode === "login" && (
              <button
                type="button"
                onClick={() => {
                  setStage("recover");
                  setMessage(null);
                  setRecoverEmail("");
                  setRecoverCode("");
                }}
                className="text-left text-sm font-semibold text-ink/60 underline underline-offset-4 hover:text-ink"
              >
                {t.auth.forgotPassword}
              </button>
            )}
            <div className="text-center text-sm text-ink/50">
              {mode === "login" ? t.auth.noAccount : t.auth.haveAccount}{" "}
              <button
                type="button"
                onClick={() => setMode(mode === "login" ? "register" : "login")}
                className="font-semibold text-ink underline underline-offset-4"
              >
                {mode === "login" ? t.auth.registerTab : t.auth.loginTab}
              </button>
            </div>
          </form>
            </>
          )}

          {stage === "verify" && (
            <>
          <h1 className="text-3xl font-semibold">{t.auth.verifyTitle}</h1>
          <p className="mt-3 text-sm text-ink/60">{t.auth.verifySubtitle}</p>
          <form onSubmit={handleVerify} className="mt-8 space-y-5">
            <label className="block text-sm text-ink/70">
              {t.auth.email}
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-ink/20 bg-paper px-4 py-3 text-base"
                placeholder={t.auth.emailPlaceholder}
                required
              />
            </label>
            <label className="block text-sm text-ink/70">
              {t.auth.verifyCode}
              <input
                value={verificationCode}
                onChange={(event) => setVerificationCode(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-ink/20 bg-paper px-4 py-3 text-base tracking-[0.4em]"
                placeholder={t.auth.verifyCodePlaceholder}
                required
              />
            </label>
            <p className="text-xs text-ink/50">{t.auth.verifyHelp}</p>
            <div className="flex flex-col sm:flex-row flex-wrap gap-3">
              <button
                type="submit"
                disabled={loading}
                className="rounded-full bg-ink px-8 py-4 sm:px-6 sm:py-3 text-base sm:text-sm font-bold sm:font-semibold text-paper disabled:opacity-60 transition-all active:scale-95 shadow-soft"
              >
                {t.auth.verifyButton}
              </button>
              <button
                type="button"
                onClick={handleResend}
                disabled={loading || resendCooldown > 0}
                className="rounded-full border border-ink/20 px-6 py-3 text-sm font-semibold text-ink disabled:opacity-60"
              >
                {resendLabel}
              </button>
              <button
                type="button"
                onClick={handleChangeEmail}
                disabled={loading}
                className="rounded-full border border-ink/20 px-6 py-3 text-sm font-semibold text-ink"
              >
                {t.auth.changeEmail}
              </button>
            </div>
          </form>
            </>
          )}

          {stage === "recover" && (
            <>
          <h1 className="text-3xl font-semibold">{t.auth.recoverTitle}</h1>
          <p className="mt-3 text-sm text-ink/60">{t.auth.recoverSubtitle}</p>
          <form onSubmit={handleRecoverRequest} className="mt-8 space-y-5">
            <label className="block text-sm text-ink/70">
              {t.auth.email}
              <input
                type="email"
                value={recoverEmail}
                onChange={(event) => setRecoverEmail(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-ink/20 bg-paper px-4 py-3 text-base"
                placeholder={t.auth.emailPlaceholder}
                required
              />
            </label>
            <div className="flex flex-col sm:flex-row flex-wrap gap-3">
              <button
                type="submit"
                disabled={loading || resendCooldown > 0}
                className="rounded-full bg-ink px-8 py-4 sm:px-6 sm:py-3 text-base sm:text-sm font-bold sm:font-semibold text-paper disabled:opacity-60 transition-all active:scale-95 shadow-soft"
              >
                {resendCooldown > 0
                  ? `${t.auth.recoverSend} (${Math.floor(resendCooldown / 60)}:${String(
                      resendCooldown % 60
                    ).padStart(2, "0")})`
                  : t.auth.recoverSend}
              </button>
              <button
                type="button"
                onClick={() => {
                  setStage("auth");
                  setMessage(null);
                }}
                className="rounded-full border border-ink/20 px-6 py-3 text-sm font-semibold text-ink"
              >
                {t.auth.backToLogin}
              </button>
            </div>
          </form>

          <form onSubmit={handleRecoverConfirm} className="mt-8 space-y-5">
            <label className="block text-sm text-ink/70">
              {t.auth.recoverCode}
              <input
                value={recoverCode}
                onChange={(event) => setRecoverCode(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-ink/20 bg-paper px-4 py-3 text-base tracking-[0.4em]"
                placeholder={t.auth.recoverCodePlaceholder}
                required
              />
            </label>
            <label className="block text-sm text-ink/70">
              {t.auth.newPassword}
              <input
                type="password"
                value={recoverPassword}
                onChange={(event) => setRecoverPassword(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-ink/20 bg-paper px-4 py-3 text-base"
                placeholder="••••••••"
                required
              />
            </label>
            <label className="block text-sm text-ink/70">
              {t.auth.confirmPassword}
              <input
                type="password"
                value={recoverConfirm}
                onChange={(event) => setRecoverConfirm(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-ink/20 bg-paper px-4 py-3 text-base"
                placeholder="••••••••"
                required
              />
            </label>
            <button
              type="submit"
              disabled={loading}
              className="rounded-full bg-ink px-6 py-3 text-sm font-semibold text-paper disabled:opacity-60"
            >
              {t.auth.recoverConfirm}
            </button>
          </form>
            </>
          )}

          {message && <p className="mt-4 text-sm text-terracotta">{message}</p>}
        </div>
      </div>
    </div>
  );
}
