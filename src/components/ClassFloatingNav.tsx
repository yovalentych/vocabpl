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
  );
}
