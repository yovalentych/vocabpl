"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useLocale } from "@/components/LocaleProvider";
import LocaleSwitcher from "@/components/LocaleSwitcher";
import { useAuthStatus } from "@/components/useAuthStatus";
import { EnvelopeSimple, SignOut, List, X } from "@phosphor-icons/react";

export default function NavBar() {
  const pathname = usePathname();
  const { t } = useLocale();
  const auth = useAuthStatus();
  const [pendingCount, setPendingCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-3 sm:gap-4">
            <Link href="/" className="flex items-center gap-2 text-base sm:text-lg font-semibold tracking-wide">
              <span className="hidden sm:inline">Polish Vocab Studio</span>
              <span className="sm:hidden">PVS</span>
              <span className="animate-shimmer bg-gradient-to-r from-gray-400 via-gray-300 to-gray-400 bg-[length:200%_100%] bg-clip-text text-sm font-bold text-transparent">
                β
              </span>
            </Link>
            {/* Desktop navigation */}
            <div className="hidden sm:flex flex-wrap items-center gap-2 text-sm">
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
            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="sm:hidden rounded-full border border-ink/20 p-2 text-ink/70 hover:bg-ink/10"
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X size={20} weight="bold" /> : <List size={20} weight="bold" />}
            </button>
          </div>
          {/* Mobile menu */}
          {mobileMenuOpen && (
            <div className="sm:hidden mt-3 pt-3 border-t border-ink/10 flex flex-col gap-2">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className={`rounded-full px-4 py-2 text-sm transition ${
                  pathname === "/login" ? "bg-ink text-paper" : "border border-ink/20 text-ink/70 hover:bg-ink/10"
                }`}
              >
                {t.nav.login}
              </Link>
              <Link
                href="/register"
                onClick={() => setMobileMenuOpen(false)}
                className={`rounded-full px-4 py-2 text-sm transition ${
                  pathname === "/register" ? "bg-ink text-paper" : "border border-ink/20 text-ink/70 hover:bg-ink/10"
                }`}
              >
                {t.nav.register}
              </Link>
              <div className="flex justify-center pt-2">
                <LocaleSwitcher />
              </div>
            </div>
          )}
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-50 border-b border-ink/10 bg-paper/80 backdrop-blur">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between gap-3 sm:gap-4">
          <Link href="/" className="flex items-center gap-2 text-base sm:text-lg font-semibold tracking-wide">
            <span className="hidden sm:inline">Polish Vocab Studio</span>
            <span className="sm:hidden">PVS</span>
            <span className="animate-shimmer bg-gradient-to-r from-gray-400 via-gray-300 to-gray-400 bg-[length:200%_100%] bg-clip-text text-sm font-bold text-transparent">
              β
            </span>
          </Link>
          {/* Desktop navigation */}
          <div className="hidden sm:flex flex-wrap items-center gap-2 text-xs sm:text-sm">
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
          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="sm:hidden rounded-full border border-ink/20 p-2 text-ink/70 hover:bg-ink/10"
            aria-label="Menu"
          >
            {mobileMenuOpen ? <X size={20} weight="bold" /> : <List size={20} weight="bold" />}
          </button>
        </div>
        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="sm:hidden mt-3 pt-3 border-t border-ink/10 flex flex-col gap-2">
            <Link
              href="/class"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-full border border-ink/20 px-4 py-2 text-sm text-ink/70 transition hover:bg-ink/10"
            >
              {t.nav.class}
            </Link>
            <Link
              href={auth.isAdmin ? "/admin/reviews" : "/messages"}
              onClick={() => setMobileMenuOpen(false)}
              className="relative rounded-full border border-ink/20 px-4 py-2 text-sm text-ink/70 hover:bg-ink/10 flex items-center justify-center gap-2"
            >
              <EnvelopeSimple size={18} weight="bold" />
              <span>{auth.isAdmin ? t.nav.admin + " Reviews" : "Messages"}</span>
              {auth.isAdmin && pendingCount > 0 && (
                <span className="rounded-full bg-terracotta px-2 py-0.5 text-[10px] font-semibold text-paper">
                  {pendingCount}
                </span>
              )}
            </Link>
            <Link
              href="/cabinet"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-full border border-ink/10 bg-paper/90 px-4 py-2 text-sm text-ink/60 hover:bg-ink/5"
            >
              {auth.username ? `@${auth.username}` : t.nav.cabinet}
            </Link>
            {auth.isAdmin && (
              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-full border border-terracotta/40 bg-terracotta/10 px-4 py-2 text-sm text-terracotta hover:bg-terracotta/20"
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
              className="rounded-full border border-ink/20 px-4 py-2 text-sm text-ink/70 transition hover:border-terracotta/40 hover:bg-terracotta/10 hover:text-terracotta flex items-center justify-center gap-2"
            >
              <SignOut size={18} weight="bold" />
              <span>{t.nav.logout}</span>
            </button>
            <div className="flex justify-center pt-2">
              <LocaleSwitcher />
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
