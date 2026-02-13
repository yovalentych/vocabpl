"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuthStatus } from "@/components/useAuthStatus";

const DISMISS_KEY = "pvs_beta_dismissed";
const PROMO_KEY = "pvs_beta_promo";

type Status = "idle" | "sending" | "sent" | "error";

export default function BetaDisclaimer() {
  const auth = useAuthStatus();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (auth.loading) return;
    if (auth.isAdmin || auth.hasPromo) return;
    if (window.localStorage.getItem(DISMISS_KEY)) return;
    const storedPromo = window.localStorage.getItem(PROMO_KEY);
    if (storedPromo) setPromoCode(storedPromo);
    const timer = window.setTimeout(() => setOpen(true), 400);
    return () => window.clearTimeout(timer);
  }, [auth.hasPromo, auth.isAdmin, auth.loading]);

  const close = () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(DISMISS_KEY, "1");
    }
    setOpen(false);
  };

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setStatus("sending");
    setError(null);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(PROMO_KEY, promoCode.trim());
    }

    try {
      const res = await fetch("/api/beta-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          message: message.trim(),
          promoCode: promoCode.trim()
        })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus("error");
        setError(data?.error || "Не вдалося надіслати заявку.");
        return;
      }
      setStatus("sent");
    } catch (err) {
      setStatus("error");
      setError("Помилка мережі. Спробуйте ще раз.");
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center px-4 py-8">
      <div className="absolute inset-0 bg-ink/30 backdrop-blur-sm" />
      <div className="relative w-full max-w-2xl overflow-hidden rounded-[32px] border border-ink/10 bg-paper shadow-[0_28px_80px_rgba(28,20,14,0.25)]">
        <div className="bg-[radial-gradient(circle_at_top,_#fff4ea,_#f6e6d8_55%,_#e8d6c6)] px-6 py-5 sm:px-8">
          <p className="text-xs uppercase tracking-[0.35em] text-ink/50">Beta</p>
          <h2 className="mt-2 text-2xl font-semibold text-ink">Polish Vocab Studio у розробці</h2>
          <p className="mt-2 text-sm text-ink/70">
            Сайт ще у стадії активного тестування та доповнення. Доступ відкриваємо вручну —
            напиши на{" "}
            <a className="font-semibold text-ink underline underline-offset-4" href="mailto:info@vocabpl.uno">
              info@vocabpl.uno
            </a>{" "}
            або використай спеціальний промокод під час реєстрації.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-6 sm:px-8">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-2 text-xs text-ink/60">
              Імʼя
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-2xl border border-ink/10 bg-white/80 px-4 py-2 text-sm text-ink outline-none transition focus:border-ink/30"
                placeholder="Як до вас звертатись"
              />
            </label>
            <label className="space-y-2 text-xs text-ink/60">
              Email для відповіді
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-2xl border border-ink/10 bg-white/80 px-4 py-2 text-sm text-ink outline-none transition focus:border-ink/30"
                placeholder="you@example.com"
                required
              />
            </label>
          </div>

          <label className="space-y-2 text-xs text-ink/60">
            Коротко: для чого хочете тест?
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="min-h-[96px] w-full rounded-2xl border border-ink/10 bg-white/80 px-4 py-2 text-sm text-ink outline-none transition focus:border-ink/30"
              placeholder="Опишіть, що саме хочете перевірити"
              required
            />
          </label>

          <label className="space-y-2 text-xs text-ink/60">
            Промокод (якщо вже маєте)
            <input
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
              className="w-full rounded-2xl border border-ink/10 bg-white/80 px-4 py-2 text-sm text-ink outline-none transition focus:border-ink/30"
              placeholder="Наприклад: BETA2026"
            />
          </label>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={status === "sending"}
              className="rounded-full bg-ink px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-paper transition hover:bg-ink/90 disabled:opacity-60"
            >
              {status === "sending" ? "Надсилаємо..." : "Запит на тест"}
            </button>
            <Link
              href="/register"
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.localStorage.setItem(PROMO_KEY, promoCode.trim());
                  window.localStorage.setItem(DISMISS_KEY, "1");
                }
              }}
              className="text-xs font-semibold text-ink/70 underline underline-offset-4"
            >
              Перейти до реєстрації
            </Link>
            <button
              type="button"
              onClick={close}
              className="text-xs font-semibold text-ink/50 hover:text-ink/70"
            >
              Пізніше
            </button>
          </div>

          {status === "sent" && (
            <div className="rounded-2xl border border-moss/20 bg-moss/5 px-4 py-3 text-xs text-moss">
              Дякуємо! Запит отримано. Ми відповімо на email.
            </div>
          )}
          {status === "error" && (
            <div className="rounded-2xl border border-terracotta/20 bg-terracotta/5 px-4 py-3 text-xs text-terracotta">
              {error || "Не вдалося надіслати заявку."}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
