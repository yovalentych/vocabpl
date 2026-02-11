"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale } from "@/components/LocaleProvider";
import { useAuthStatus } from "@/components/useAuthStatus";
import type { Route } from "next";
import { BookBookmark, BookOpen, NotePencil, TestTube, Trophy } from "@phosphor-icons/react";

type NavItem = {
  href: Route;
  label: string;
  icon: typeof BookOpen;
  tone: string;
};

export default function ClassFloatingNav() {
  const pathname = usePathname();
  const { t } = useLocale();
  const auth = useAuthStatus();

  const showNav = auth.isAuthenticated && pathname.startsWith("/class");
  if (!showNav) return null;

  const items: NavItem[] = [
    { href: "/class/dict", label: t.nav.deck, icon: BookBookmark, tone: "bg-terracotta/20 text-terracotta" },
    { href: "/class/reading", label: t.nav.reading, icon: BookOpen, tone: "bg-gold/30 text-terracotta" },
    { href: "/class/workbook", label: t.nav.workbook, icon: NotePencil, tone: "bg-ink/10 text-ink" },
    { href: "/class/tests", label: t.nav.tests, icon: TestTube, tone: "bg-moss/20 text-moss" },
    { href: "/class/leaderboard", label: t.nav.leaderboard, icon: Trophy, tone: "bg-terracotta/15 text-terracotta" }
  ];

  return (
    <>
      {/* Desktop floating nav - left side */}
      <div className="fixed left-6 top-[calc(var(--header-height,88px)+96px)] z-40 hidden flex-col gap-3 md:flex">
        {items.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} className="group inline-flex items-center" aria-label={item.label}>
              <span
                className={`inline-flex h-12 w-12 items-center justify-center rounded-full shadow-soft transition ${
                  isActive ? "bg-ink text-paper" : `${item.tone} bg-opacity-90`
                }`}
              >
                <Icon size={16} weight="bold" />
              </span>
              <span
                className={`ml-2 inline-flex h-9 max-w-0 origin-left scale-x-0 items-center overflow-hidden whitespace-nowrap rounded-full px-3 text-[11px] font-semibold opacity-0 shadow-soft transition-[max-width,opacity,transform] duration-300 ease-out group-hover:max-w-[140px] group-hover:scale-x-100 group-hover:opacity-100 ${
                  isActive ? "bg-ink text-paper" : "border border-ink/15 bg-paper/90 text-ink/70"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Mobile bottom nav */}
      <div
        className="fixed left-0 right-0 z-50 md:hidden border-t border-ink/10 bg-paper/95 backdrop-blur-sm shadow-[0_-4px_12px_rgba(0,0,0,0.08)]"
        style={{ bottom: "var(--footer-height, 96px)" }}
      >
        <div className="flex items-center justify-around px-2 py-3">
          {items.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center gap-1 min-w-0 flex-1"
                aria-label={item.label}
              >
                <span
                  className={`inline-flex h-9 w-9 items-center justify-center rounded-full transition ${
                    isActive ? "bg-ink text-paper" : `${item.tone} bg-opacity-90`
                  }`}
                >
                  <Icon size={16} weight="bold" />
                </span>
                <span className={`text-[9px] font-semibold truncate max-w-full px-1 ${isActive ? "text-ink" : "text-ink/60"}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
