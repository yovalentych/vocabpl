"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { useAuthStatus } from "@/components/useAuthStatus";
import type { Route } from "next";
import { BookBookmark, BookOpen, NotePencil, TestTube, Trophy, CaretLeft, CaretRight } from "@phosphor-icons/react";

export default function ClassSidebar() {
  const pathname = usePathname();
  const { t } = useLocale();
  const auth = useAuthStatus();
  const [collapsed, setCollapsed] = useState(false);

  const showSidebar = auth.isAuthenticated && pathname.startsWith("/class");

  useEffect(() => {
    if (!showSidebar) {
      document.documentElement.style.setProperty("--sidebar-width", "0px");
      return;
    }
    document.documentElement.style.setProperty("--sidebar-width", collapsed ? "72px" : "210px");
  }, [showSidebar, collapsed]);

  useEffect(() => {
    const saved = window.localStorage.getItem("nav-collapsed");
    if (saved === "true") setCollapsed(true);
  }, []);

  useEffect(() => {
    window.localStorage.setItem("nav-collapsed", String(collapsed));
  }, [collapsed]);

  type NavItem = {
    href: Route;
    label: string;
    icon: typeof BookOpen;
    tone: string;
  };

  const items: NavItem[] = [
    { href: "/class/dict", label: t.nav.deck, icon: BookBookmark, tone: "bg-terracotta/20 text-terracotta" },
    { href: "/class/reading", label: t.nav.reading, icon: BookOpen, tone: "bg-gold/30 text-terracotta" },
    { href: "/class/workbook", label: t.nav.workbook, icon: NotePencil, tone: "bg-ink/10 text-ink" },
    { href: "/class/tests", label: t.nav.tests, icon: TestTube, tone: "bg-moss/20 text-moss" },
    { href: "/class/leaderboard", label: t.nav.leaderboard, icon: Trophy, tone: "bg-terracotta/15 text-terracotta" }
  ];

  const labelVisibility = collapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100";
  const navGap = collapsed ? "gap-2" : "gap-3";
  const navPadding = collapsed ? "px-2" : "px-4";

  if (!showSidebar) return null;

  return (
    <aside
      className="relative hidden md:flex h-full flex-col"
      style={{ width: "var(--sidebar-width)" }}
    >
      <div className={`flex h-full flex-col py-4 ${navPadding} transition-[padding] duration-300 ease-out`}>
        <div className={`flex flex-1 flex-col ${navGap} transition-[gap] duration-300 ease-out`}>
          {items.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center ${navGap} rounded-full px-2 py-2 text-sm font-semibold transition ${
                  isActive ? "text-ink" : "text-ink/60 hover:text-ink"
                }`}
                title={collapsed ? item.label : undefined}
              >
                <span
                  className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl shadow-soft transition ${
                    isActive ? "bg-ink text-paper" : `${item.tone} bg-opacity-80`
                  }`}
                >
                  <Icon size={16} weight="bold" />
                </span>
                <span className={`text-sm transition ${labelVisibility}`}>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
      <button
        type="button"
        onClick={() => setCollapsed((prev) => !prev)}
        className="absolute -right-3 top-1/2 hidden h-28 w-6 -translate-y-1/2 items-center justify-center rounded-full border border-ink/10 bg-paper/80 text-ink/40 shadow-soft transition hover:bg-paper hover:text-ink md:flex"
        aria-label="Toggle sidebar"
      >
        <span className="inline-flex h-10 w-4 items-center justify-center rounded-full bg-paper/80">
          {collapsed ? <CaretRight size={16} weight="bold" /> : <CaretLeft size={16} weight="bold" />}
        </span>
      </button>
    </aside>
  );
}
