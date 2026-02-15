"use client";

import {
  Leaf,
  TestTube,
  Medal,
  BookBookmark,
  Books,
  Timer,
  Fire,
  Lightning,
  Diamond,
  Trophy
} from "@phosphor-icons/react";
import type { AchievementIcon, AchievementTone } from "@/lib/achievements";

const toneStyles: Record<AchievementTone, { bg: string; ring: string; icon: string; glow: string }> = {
  moss: {
    bg: "from-moss/20 to-moss/5",
    ring: "border-moss/30",
    icon: "text-moss",
    glow: "bg-moss/20"
  },
  gold: {
    bg: "from-gold/30 to-gold/10",
    ring: "border-gold/40",
    icon: "text-gold",
    glow: "bg-gold/20"
  },
  terracotta: {
    bg: "from-terracotta/25 to-terracotta/10",
    ring: "border-terracotta/40",
    icon: "text-terracotta",
    glow: "bg-terracotta/20"
  },
  ink: {
    bg: "from-ink/10 to-ink/5",
    ring: "border-ink/20",
    icon: "text-ink/70",
    glow: "bg-ink/10"
  }
};

const iconMap: Record<AchievementIcon, typeof Leaf> = {
  seedling: Leaf,
  flask: TestTube,
  medal: Medal,
  book: BookBookmark,
  stack: Books,
  timer: Timer,
  fire: Fire,
  bolt: Lightning,
  diamond: Diamond,
  trophy: Trophy
};

export default function AchievementBadge({
  tone,
  icon,
  size = 44
}: {
  tone: AchievementTone;
  icon: AchievementIcon;
  size?: number;
}) {
  const styles = toneStyles[tone];
  const Icon = iconMap[icon] || Trophy;

  return (
    <div
      className={`relative flex items-center justify-center rounded-2xl border bg-gradient-to-br ${styles.bg} ${styles.ring}`}
      style={{ width: size, height: size }}
    >
      <div
        className={`pointer-events-none absolute -top-2 -right-2 h-6 w-6 rounded-full ${styles.glow}`}
        style={{ opacity: 0.25, filter: "blur(4px)" }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl"
        style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.6)" }}
        aria-hidden="true"
      />
      <Icon size={22} weight="fill" className={`${styles.icon} relative z-10`} />
    </div>
  );
}
