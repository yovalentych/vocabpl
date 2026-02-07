"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useLocale } from "@/components/LocaleProvider";
import LocaleSwitcher from "@/components/LocaleSwitcher";
import { useAuthStatus } from "@/components/useAuthStatus";
import { EnvelopeSimple, SignOut } from "@phosphor-icons/react";

export default function NavBar() {
  const pathname = usePathname();
  const { t } = useLocale();
  const auth = useAuthStatus();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (!auth.isAdmin) return;
    let mounted = true;
    async function loadCount() {
      const res = await fetch("/api/admin/reviews-count");
      const data = await res.json().catch(() => null);
      if (!mounted) return;
      setPendingCount(Number(data?.count || 0));
    }
    loadCount();
    const timer = window.setInterval(loadCount, 30000);
    return () => {
      mounted = false;
      window.clearInterval(timer);
    };
  }, [auth.isAdmin]);


  if (!auth.isAuthenticated) {
    return (
      <header className="sticky top-0 z-50 border-b border-ink/10 bg-paper/80 backdrop-blur">
        <div className="mx-auto w-full max-w-6xl px-6 py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Link href="/" className="text-lg font-semibold tracking-wide">
              Polish Vocab Studio
            </Link>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <Link
                href="/login"
                className={`rounded-full px-3 py-1 transition ${
                  pathname === "/login" ? "bg-ink text-paper" : "border border-ink/20 text-ink/70 hover:bg-ink/10"
                }`}
              >
                {t.nav.login}
              </Link>
              <Link
                href="/register"
                className={`rounded-full px-3 py-1 transition ${
                  pathname === "/register" ? "bg-ink text-paper" : "border border-ink/20 text-ink/70 hover:bg-ink/10"
                }`}
              >
                {t.nav.register}
              </Link>
              <LocaleSwitcher />
            </div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-50 border-b border-ink/10 bg-paper/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-4">
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold tracking-wide">
          Polish Vocab Studio
        </Link>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Link
            href="/class"
            className="rounded-full border border-ink/20 px-3 py-1 text-ink/70 transition hover:bg-ink/10"
          >
            {t.nav.class}
          </Link>
          <Link
            href={auth.isAdmin ? "/admin/reviews" : "/messages"}
            className="relative rounded-full border border-ink/20 px-3 py-1 text-ink/70 hover:bg-ink/10"
            aria-label="Messages"
            title="Messages"
          >
            <EnvelopeSimple size={18} weight="bold" />
            {auth.isAdmin && pendingCount > 0 && (
              <span className="absolute -top-2 -right-1 rounded-full bg-terracotta px-1.5 py-0.5 text-[10px] font-semibold text-paper">
                {pendingCount}
              </span>
            )}
          </Link>
          <Link
            href="/cabinet"
            className="rounded-full border border-ink/10 bg-paper/90 px-3 py-1 text-ink/60 hover:bg-ink/5"
          >
            {auth.username ? `@${auth.username}` : t.nav.cabinet}
          </Link>
          {auth.isAdmin && (
            <Link
              href="/admin"
              className="rounded-full border border-terracotta/40 bg-terracotta/10 px-3 py-1 text-terracotta hover:bg-terracotta/20"
            >
              {t.nav.admin}
            </Link>
          )}
          <button
            onClick={async () => {
              await fetch("/api/auth/logout", { method: "POST" });
              window.dispatchEvent(new Event("auth-changed"));
              window.location.href = "/login";
            }}
            className="rounded-full border border-ink/20 px-3 py-1 text-ink/70 transition hover:border-terracotta/40 hover:bg-terracotta/10 hover:text-terracotta"
            aria-label={t.nav.logout}
            title={t.nav.logout}
          >
            <SignOut size={18} weight="bold" />
          </button>
          <LocaleSwitcher />
        </div>
      </div>
    </header>
  );
}
