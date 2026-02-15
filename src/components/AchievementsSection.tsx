"use client";

import { useEffect, useMemo, useState } from "react";
import AchievementsGrid from "@/components/AchievementsGrid";
import AchievementBadge from "@/components/AchievementBadge";
import { getUserAchievements, type AchievementProgress, type UserStatsSnapshot } from "@/lib/achievements";

export default function AchievementsSection({
  username,
  name,
  stats,
  locale,
  title = "Мої ачівки",
  subtitle = "Відстежуй прогрес та відкривай нові нагороди"
}: {
  username: string;
  name?: string;
  stats: UserStatsSnapshot;
  locale: "uk" | "pl";
  title?: string;
  subtitle?: string;
}) {
  const [rank, setRank] = useState<number | null>(null);
  const [newUnlocked, setNewUnlocked] = useState<AchievementProgress[]>([]);

  useEffect(() => {
    let mounted = true;
    async function loadRank() {
      if (!username) return;
      const res = await fetch("/api/leaderboard");
      if (!res.ok) return;
      const data = await res.json().catch(() => ({}));
      if (!mounted) return;
      const row = (data.leaderboard || []).find((r: any) => r.username === username);
      setRank(typeof row?.rank === "number" ? row.rank : null);
    }
    loadRank();
    return () => {
      mounted = false;
    };
  }, [username]);

  const achievements = useMemo(() => {
    return getUserAchievements({ locale, stats, rank });
  }, [locale, stats, rank]);

  useEffect(() => {
    if (!username) return;
    if (!achievements.length) return;
    const key = `pvs_achievements_unlocked_${username}`;
    const storedRaw = typeof window !== "undefined" ? window.localStorage.getItem(key) : null;
    const stored = storedRaw ? (JSON.parse(storedRaw) as string[]) : [];
    const unlockedIds = achievements.filter((a) => a.unlocked).map((a) => a.id);
    const freshIds = unlockedIds.filter((id) => !stored.includes(id));

    if (freshIds.length) {
      const fresh = achievements.filter((a) => freshIds.includes(a.id));
      setNewUnlocked(fresh);
      const next = Array.from(new Set([...stored, ...freshIds]));
      window.localStorage.setItem(key, JSON.stringify(next));
    }
  }, [achievements, username]);

  return (
    <section id="achievements" className="space-y-6">
      <div className="rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-ink/40">{title}</p>
            <h2 className="mt-2 text-2xl font-semibold">{name || username}</h2>
            <p className="mt-1 text-sm text-ink/60">{subtitle}</p>
          </div>
          {typeof rank === "number" && (
            <div className="flex items-center gap-3 rounded-2xl border border-ink/10 bg-paper/70 px-4 py-3">
              <AchievementBadge tone={rank <= 10 ? "terracotta" : "ink"} icon="trophy" size={40} />
              <div>
                <p className="text-xs text-ink/50">Поточний рейтинг</p>
                <p className="text-lg font-semibold">#{rank}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <AchievementsGrid achievements={achievements} />

      {newUnlocked.length > 0 && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-ink/60 p-4">
          <div className="w-full max-w-xl rounded-3xl border border-ink/10 bg-paper p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold">Нові ачівки!</h3>
                <p className="mt-1 text-sm text-ink/60">
                  Круто! Ти щойно відкрив нові нагороди.
                </p>
              </div>
              <button
                onClick={() => setNewUnlocked([])}
                className="rounded-full px-3 py-1 text-xs font-semibold text-ink/60 hover:bg-ink/5"
              >
                Закрити
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {newUnlocked.map((achievement) => (
                <div
                  key={achievement.id}
                  className="flex items-center gap-3 rounded-2xl border border-moss/20 bg-moss/5 p-3"
                >
                  <AchievementBadge tone={achievement.tone} icon={achievement.icon} />
                  <div>
                    <p className="font-semibold">{achievement.title}</p>
                    <p className="text-xs text-ink/50">{achievement.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setNewUnlocked([])}
              className="mt-5 w-full rounded-full bg-ink px-4 py-2 text-sm font-semibold text-paper"
            >
              Супер!
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
