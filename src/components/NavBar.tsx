"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { csrfFetch } from "@/lib/csrf-client";
import LocaleSwitcher from "@/components/LocaleSwitcher";
import { useAuthStatus } from "@/components/useAuthStatus";
import { Bell, SignOut, List, X, CreditCard, GraduationCap, ChatCircle } from "@phosphor-icons/react";

export default function NavBar() {
  const pathname = usePathname();
  const { t, locale } = useLocale();
  const auth = useAuthStatus();
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!auth.isAuthenticated) return;
    let mounted = true;

    async function loadCount() {
      try {
        const res = await fetch("/api/notifications/count");
        if (!res.ok) return;
        const data = await res.json().catch(() => null);
        if (!mounted) return;
        setUnreadCount(Number(data?.unreadCount || 0));
      } catch (error) {
        if (!mounted) return;
        setUnreadCount(0);
      }
    }

    async function loadMsgCount() {
      try {
        const res = await fetch("/api/conversations");
        if (!res.ok) return;
        const data = await res.json().catch(() => null);
        if (!mounted) return;
        const total = (data?.conversations || []).reduce(
          (sum: number, c: any) => sum + (c.unreadCount || 0),
          0
        );
        setUnreadMessages(total);
      } catch {
        if (!mounted) return;
        setUnreadMessages(0);
      }
    }

    loadCount();
    loadMsgCount();
    const timer = window.setInterval(loadCount, 60000);
    const msgTimer = window.setInterval(loadMsgCount, 30000);

    function handleNotificationUpdate() {
      loadCount();
    }
    window.addEventListener("notification-update", handleNotificationUpdate);

    return () => {
      mounted = false;
      window.clearInterval(timer);
      window.clearInterval(msgTimer);
      window.removeEventListener("notification-update", handleNotificationUpdate);
    };
  }, [auth.isAuthenticated]);


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
              className="sm:hidden rounded-full border border-ink/20 p-3 text-ink/70 active:bg-ink/10 transition-transform active:scale-95"
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X size={22} weight="bold" /> : <List size={22} weight="bold" />}
            </button>
          </div>
          {/* Mobile menu */}
          <div
            className={`sm:hidden overflow-hidden transition-all duration-300 ease-out ${
              mobileMenuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
            }`}
          >
            <div className="mt-4 pt-4 pb-3 border-t border-ink/10 flex flex-col gap-3 px-1">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className={`rounded-full px-6 py-3.5 text-base font-medium transition-all active:scale-95 ${
                  pathname === "/login" ? "bg-ink text-paper shadow-soft" : "border-2 border-ink/20 text-ink/70 active:bg-ink/10"
                }`}
              >
                {t.nav.login}
              </Link>
              <Link
                href="/register"
                onClick={() => setMobileMenuOpen(false)}
                className={`rounded-full px-6 py-3.5 text-base font-medium transition-all active:scale-95 ${
                  pathname === "/register" ? "bg-ink text-paper shadow-soft" : "border-2 border-ink/20 text-ink/70 active:bg-ink/10"
                }`}
              >
                {t.nav.register}
              </Link>
              <div className="flex justify-center pt-3">
                <LocaleSwitcher />
              </div>
            </div>
          </div>
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
              href="/compendium"
              className="rounded-full border border-ink/20 px-3 py-1 text-ink/70 transition hover:bg-ink/10"
            >
              {t.nav.compendium}
            </Link>
            <Link
              href="/school"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-full border border-moss/30 bg-moss/10 px-3 py-1 text-moss transition hover:bg-moss/20"
            >
              <GraduationCap size={18} weight="bold" />
              <span className="hidden lg:inline text-xs font-semibold">{t.nav.school || (locale === "pl" ? "Szkoła" : "Школа")}</span>
            </Link>
            <Link
              href="/messages"
              className="relative rounded-full border border-ink/20 px-3 py-1 text-ink/70 hover:bg-ink/10"
              aria-label="Повідомлення"
              title="Повідомлення"
            >
              <ChatCircle size={18} weight="bold" />
              {unreadMessages > 0 && (
                <span className="absolute -top-2 -right-1 rounded-full bg-moss px-1.5 py-0.5 text-[10px] font-semibold text-paper">
                  {unreadMessages}
                </span>
              )}
            </Link>
            <Link
              href="/notifications"
              className="relative rounded-full border border-ink/20 px-3 py-1 text-ink/70 hover:bg-ink/10"
              aria-label={t.nav.notifications || "Сповіщення"}
              title={t.nav.notifications || "Сповіщення"}
            >
              <Bell size={18} weight="bold" />
              {unreadCount > 0 && (
                <span className="absolute -top-2 -right-1 rounded-full bg-terracotta px-1.5 py-0.5 text-[10px] font-semibold text-paper">
                  {unreadCount}
                </span>
              )}
            </Link>
            <Link
              href="/cabinet#billing"
              className="flex items-center gap-2 rounded-full border border-terracotta/30 bg-terracotta/10 px-3 py-1 text-terracotta transition hover:bg-terracotta/20"
              aria-label={t.nav.plan}
              title={t.nav.plan}
            >
              <CreditCard size={16} weight="bold" />
              <span className="text-xs font-semibold">{t.nav.plan}</span>
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
                await csrfFetch("/api/auth/logout", { method: "POST" });
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
            className="sm:hidden rounded-full border border-ink/20 p-3 text-ink/70 active:bg-ink/10 transition-transform active:scale-95"
            aria-label="Menu"
          >
            {mobileMenuOpen ? <X size={22} weight="bold" /> : <List size={22} weight="bold" />}
          </button>
        </div>
        {/* Mobile menu */}
        <div
          className={`sm:hidden overflow-hidden transition-all duration-300 ease-out ${
            mobileMenuOpen ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="mt-4 pt-4 pb-3 border-t border-ink/10 flex flex-col gap-3 px-1">
            <Link
              href="/class"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-full border-2 border-ink/20 px-6 py-3.5 text-base font-medium text-ink/70 transition-all active:scale-95 active:bg-ink/10"
            >
              {t.nav.class}
            </Link>
            <Link
              href="/compendium"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-full border-2 border-ink/20 px-6 py-3.5 text-base font-medium text-ink/70 transition-all active:scale-95 active:bg-ink/10"
            >
              {t.nav.compendium}
            </Link>
            <Link
              href="/school"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-full border-2 border-moss/30 bg-moss/10 px-6 py-3.5 text-base font-medium text-moss transition-all active:scale-95 active:bg-moss/20 flex items-center justify-center gap-2.5"
            >
              <GraduationCap size={20} weight="bold" />
              <span>{t.nav.school || (locale === "pl" ? "Szkoła" : "Школа")}</span>
            </Link>
            <Link
              href="/messages"
              onClick={() => setMobileMenuOpen(false)}
              className="relative rounded-full border-2 border-ink/20 px-6 py-3.5 text-base font-medium text-ink/70 transition-all active:scale-95 active:bg-ink/10 flex items-center justify-center gap-2.5"
            >
              <ChatCircle size={20} weight="bold" />
              <span>Повідомлення</span>
              {unreadMessages > 0 && (
                <span className="rounded-full bg-moss px-2.5 py-1 text-xs font-semibold text-paper">
                  {unreadMessages}
                </span>
              )}
            </Link>
            <Link
              href="/notifications"
              onClick={() => setMobileMenuOpen(false)}
              className="relative rounded-full border-2 border-ink/20 px-6 py-3.5 text-base font-medium text-ink/70 transition-all active:scale-95 active:bg-ink/10 flex items-center justify-center gap-2.5"
            >
              <Bell size={20} weight="bold" />
              <span>{t.nav.notifications || "Сповіщення"}</span>
              {unreadCount > 0 && (
                <span className="rounded-full bg-terracotta px-2.5 py-1 text-xs font-semibold text-paper">
                  {unreadCount}
                </span>
              )}
            </Link>
            <Link
              href="/cabinet#billing"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-full border-2 border-terracotta/30 bg-terracotta/10 px-6 py-3.5 text-base font-medium text-terracotta transition-all active:scale-95 active:bg-terracotta/20 flex items-center justify-center gap-2.5"
            >
              <CreditCard size={20} weight="bold" />
              <span>{t.nav.plan}</span>
            </Link>
            <Link
              href="/cabinet"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-full border-2 border-ink/10 bg-paper/90 px-6 py-3.5 text-base font-medium text-ink/60 transition-all active:scale-95 active:bg-ink/5"
            >
              {auth.username ? `@${auth.username}` : t.nav.cabinet}
            </Link>
            {auth.isAdmin && (
              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-full border-2 border-terracotta/40 bg-terracotta/10 px-6 py-3.5 text-base font-medium text-terracotta transition-all active:scale-95 active:bg-terracotta/20"
              >
                {t.nav.admin}
              </Link>
            )}
            <button
              onClick={async () => {
                await csrfFetch("/api/auth/logout", { method: "POST" });
                window.dispatchEvent(new Event("auth-changed"));
                window.location.href = "/login";
              }}
              className="rounded-full border-2 border-ink/20 px-6 py-3.5 text-base font-medium text-ink/70 transition-all active:scale-95 active:border-terracotta/40 active:bg-terracotta/10 active:text-terracotta flex items-center justify-center gap-2.5"
            >
              <SignOut size={20} weight="bold" />
              <span>{t.nav.logout}</span>
            </button>
            <div className="flex justify-center pt-3">
              <LocaleSwitcher />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
