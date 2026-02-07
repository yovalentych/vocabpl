"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useLocale } from "@/components/LocaleProvider";
import LocaleSwitcher from "@/components/LocaleSwitcher";
import { useAuthStatus } from "@/components/useAuthStatus";
import type { Route } from "next";
import {
  EnvelopeSimple,
  BookBookmark,
  BookOpen,
  NotePencil,
  TestTube,
  Trophy,
  SignOut,
  CaretLeft,
  CaretRight
} from "@phosphor-icons/react";

export default function NavBar() {
  const pathname = usePathname();
  const { t } = useLocale();
  const auth = useAuthStatus();
  const [pendingCount, setPendingCount] = useState(0);
  const [collapsed, setCollapsed] = useState(false);

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

  useEffect(() => {
    const saved = window.localStorage.getItem("nav-collapsed");
    if (saved === "true") setCollapsed(true);
  }, []);

  useEffect(() => {
    window.localStorage.setItem("nav-collapsed", String(collapsed));
  }, [collapsed]);

  useEffect(() => {
    if (!auth.isAuthenticated) {
      document.documentElement.style.setProperty("--sidebar-width", "0px");
      return;
    }
    document.documentElement.style.setProperty("--sidebar-width", collapsed ? "96px" : "288px");
  }, [auth.isAuthenticated, collapsed]);

  type NavItem = {
    href: Route;
    label: string;
    icon?: typeof BookOpen;
    tone?: string;
  };

  const publicItems = [
    { href: "/login", label: t.nav.login },
    { href: "/register", label: t.nav.register }
  ] satisfies NavItem[];

  const privateItems = [
    {
      href: "/deck",
      label: t.nav.deck,
      icon: BookBookmark,
      tone: "bg-terracotta/20 text-terracotta"
    },
    {
      href: "/reading",
      label: t.nav.reading,
      icon: BookOpen,
      tone: "bg-gold/30 text-terracotta"
    },
    {
      href: "/workbook",
      label: t.nav.workbook,
      icon: NotePencil,
      tone: "bg-ink/10 text-ink"
    },
    {
      href: "/tests",
      label: t.nav.tests,
      icon: TestTube,
      tone: "bg-moss/20 text-moss"
    },
    {
      href: "/leaderboard",
      label: t.nav.leaderboard,
      icon: Trophy,
      tone: "bg-terracotta/15 text-terracotta"
    }
  ] satisfies NavItem[];
  const adminItem = { href: "/admin", label: t.nav.admin } satisfies NavItem;

  const navItems: NavItem[] = auth.isAuthenticated ? privateItems : publicItems;
  const allItems: NavItem[] = auth.isAuthenticated && auth.isAdmin ? [...navItems, adminItem] : navItems;
  const mainItems = auth.isAuthenticated && auth.isAdmin ? navItems : allItems;
  const labelVisibility = collapsed ? "md:opacity-0 md:w-0 md:overflow-hidden" : "opacity-100";
  const sidebarWidth = "md:w-[var(--sidebar-width)]";
  const navGap = collapsed ? "gap-2" : "gap-3";
  const navPadding = collapsed ? "md:px-2" : "md:px-4";
  const toggleOffset = collapsed ? "md:left-[84px]" : "md:left-[276px]";

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
    <>
      <header className="sticky top-0 z-50 border-b border-ink/10 bg-paper/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-4">
          <Link href="/" className="flex items-center gap-2 text-lg font-semibold tracking-wide">
            Polish Vocab Studio
          </Link>
          <div className="flex flex-wrap items-center gap-2 text-sm">
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

      <aside
        className={`hidden md:flex z-40 border-b border-ink/5 bg-paper/60 backdrop-blur md:fixed md:left-0 md:top-[72px] md:bottom-24 md:h-auto md:border-b-0 md:border-r md:shadow-[6px_0_20px_rgba(0,0,0,0.04)] ${sidebarWidth} transition-[width] duration-300 ease-out`}
      >
        <div className={`flex h-full flex-col px-3 pb-6 pt-6 ${navPadding} transition-[padding] duration-300 ease-out`}>
          <div className={`flex flex-1 flex-col ${navGap} transition-[gap] duration-300 ease-out`}>
            {mainItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = (item as any).icon as typeof BookOpen | undefined;
              const tone = (item as any).tone as string | undefined;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group flex items-center ${navGap} rounded-2xl px-3 py-2 text-sm font-semibold transition ${
                    isActive ? "bg-ink text-paper shadow-soft" : "text-ink/60 hover:bg-ink/5"
                  }`}
                  title={collapsed ? item.label : undefined}
                >
                  {Icon ? (
                    <span
                      className={`inline-flex h-9 w-9 items-center justify-center rounded-2xl ${
                        isActive ? "bg-paper/15 text-paper" : `${tone} bg-opacity-70`
                      }`}
                    >
                      <Icon size={16} weight="bold" />
                    </span>
                  ) : (
                    <span
                      className={`inline-flex h-9 w-9 items-center justify-center rounded-2xl ${
                        isActive ? "bg-paper/15 text-paper" : "bg-ink/5 text-ink/60"
                      }`}
                    >
                      <span className="text-xs">•</span>
                    </span>
                  )}
                  <span className={`transition ${labelVisibility}`}>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {auth.isAdmin && (
            <div className="mt-auto pt-4">
              <div className={`mb-3 text-[10px] uppercase tracking-[0.3em] text-ink/40 ${labelVisibility}`}>
                Admin
              </div>
              <Link
                href={adminItem.href}
                className={`flex items-center gap-3 rounded-2xl px-3 py-2 text-sm font-semibold transition ${
                  pathname === adminItem.href
                    ? "bg-terracotta text-paper shadow-soft"
                    : "border border-terracotta/30 bg-terracotta/10 text-terracotta hover:bg-terracotta/20"
                }`}
                title={collapsed ? adminItem.label : undefined}
              >
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-paper/50 text-terracotta">
                  <Trophy size={16} weight="bold" />
                </span>
                <span className={`transition ${labelVisibility}`}>{adminItem.label}</span>
              </Link>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => setCollapsed((prev) => !prev)}
          className={`hidden md:flex absolute top-1/2 -translate-y-1/2 h-12 w-8 items-center justify-center rounded-full border border-ink/10 bg-paper/80 text-ink/40 shadow-soft transition hover:bg-paper hover:text-ink ${toggleOffset}`}
          aria-label="Toggle sidebar"
        >
          {collapsed ? <CaretRight size={16} weight="bold" /> : <CaretLeft size={16} weight="bold" />}
        </button>
      </aside>
    </>
  );
}
