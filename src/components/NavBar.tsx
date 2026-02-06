"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
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
  SignOut
} from "@phosphor-icons/react";

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
    },
    { href: "/cabinet", label: t.nav.cabinet }
  ] satisfies NavItem[];
  const adminItem = { href: "/admin", label: t.nav.admin } satisfies NavItem;

  const navItems: NavItem[] = auth.isAuthenticated ? privateItems : publicItems;

  return (
    <nav className="sticky top-0 z-40 border-b border-ink/10 bg-paper/80 backdrop-blur">
      <div className="mx-auto w-full max-w-6xl px-6 py-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link href="/" className="text-lg font-semibold tracking-wide">
            Polish Vocab Studio
          </Link>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            {auth.isAuthenticated ? (
              <>
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
                <span className="rounded-full border border-ink/10 bg-paper/90 px-3 py-1 text-ink/60">
                  {auth.username ? `@${auth.username}` : t.nav.cabinet}
                </span>
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
              </>
            ) : (
              <LocaleSwitcher />
            )}
          </div>
        </div>

        <div className="mt-4 flex justify-center">
          <div className="flex flex-wrap items-center gap-2 rounded-full border border-ink/10 bg-paper/90 px-3 py-2 shadow-soft">
            {[...navItems, ...(auth.isAdmin ? [adminItem] : [])].map((item) => {
              const isActive = pathname === item.href;
              const Icon = (item as any).icon as typeof BookOpen | undefined;
              const tone = (item as any).tone as string | undefined;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-full px-3 py-1 transition ${
                    isActive
                      ? "bg-ink text-paper"
                      : "text-ink/70 hover:bg-ink/10"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {Icon ? (
                      <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full ${tone}`}>
                        <Icon size={14} weight="bold" />
                      </span>
                    ) : null}
                    <span>{item.label}</span>
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
