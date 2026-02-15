"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale } from "@/components/LocaleProvider";
import Loader from "@/components/ui/Loader";
import AchievementsGrid from "@/components/AchievementsGrid";
import { getUserAchievements } from "@/lib/achievements";

type Row = {
  rank: number;
  username: string;
  name: string;
  points: number;
  wordsStudied: number;
  testsTaken: number;
};

export default function LeaderboardClient() {
  const { t, locale } = useLocale();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"ranking" | "achievements">("ranking");
  const [userStats, setUserStats] = useState<{
    username: string;
    name: string;
    stats: { wordsStudied: number; testsTaken: number; sessions: number; points: number };
  } | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      const res = await fetch("/api/leaderboard");
      if (!mounted) return;
      if (!res.ok) {
        setRows([]);
        setLoading(false);
        return;
      }
      const data = await res.json();
      setRows(data.leaderboard || []);
      setLoading(false);
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    async function loadUser() {
      const res = await fetch("/api/user/me");
      if (!mounted) return;
      if (!res.ok) return;
      const data = await res.json().catch(() => ({}));
      if (!mounted) return;
      if (data?.user) {
        setUserStats({
          username: data.user.username || "",
          name: data.user.name || "",
          stats: {
            wordsStudied: Number(data.user.stats?.wordsStudied || 0),
            testsTaken: Number(data.user.stats?.testsTaken || 0),
            sessions: Number(data.user.stats?.sessions || 0),
            points: Number(data.user.stats?.points || 0)
          }
        });
      }
    }
    loadUser();
    return () => {
      mounted = false;
    };
  }, []);

  const userRank = useMemo(() => {
    if (!userStats?.username) return null;
    const row = rows.find((r) => r.username === userStats.username);
    return row?.rank ?? null;
  }, [rows, userStats?.username]);

  const achievements = useMemo(() => {
    const stats = userStats?.stats || { wordsStudied: 0, testsTaken: 0, sessions: 0, points: 0 };
    return getUserAchievements({
      locale,
      stats,
      rank: userRank
    });
  }, [locale, userStats, userRank]);

  return (
    <div className="space-y-6">
      {loading ? (
        <div className="rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft">
          <Loader label={t.common.loading} />
        </div>
      ) : rows.length === 0 && tab === "ranking" ? (
        <div className="rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft">
          <p className="text-sm text-ink/60">{t.leaderboard.empty}</p>
        </div>
      ) : (
        <div className="rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">{t.leaderboard.listTitle}</h2>
              <p className="text-xs text-ink/50">Рейтинг та нагороди спільноти</p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <button
                onClick={() => setTab("ranking")}
                className={`rounded-full px-4 py-2 font-semibold transition ${
                  tab === "ranking" ? "bg-ink text-paper" : "border border-ink/20 text-ink hover:bg-ink/5"
                }`}
              >
                Рейтинг
              </button>
              <button
                onClick={() => setTab("achievements")}
                className={`rounded-full px-4 py-2 font-semibold transition ${
                  tab === "achievements" ? "bg-ink text-paper" : "border border-ink/20 text-ink hover:bg-ink/5"
                }`}
              >
                Ачівки
              </button>
            </div>
          </div>

          {tab === "ranking" && (
            <div className="mt-5 space-y-3">
              {rows.map((row) => (
                (() => {
                  const badge =
                    row.rank === 1
                      ? "border-amber-300 bg-amber-100 text-amber-900"
                      : row.rank === 2
                        ? "border-slate-300 bg-slate-100 text-slate-700"
                        : row.rank === 3
                          ? "border-orange-300 bg-orange-100 text-orange-800"
                          : "border-ink/10 bg-paper text-ink";
                  return (
                <div
                  key={`row-${row.username}-${row.rank}`}
                  className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-ink/10 bg-paper/70 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex h-9 w-9 items-center justify-center rounded-full border text-sm font-semibold ${badge}`}
                    >
                      {row.rank}
                    </span>
                    <div>
                      <p className="font-semibold">{row.name || row.username}</p>
                      <p className="text-xs text-ink/50">@{row.username}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-ink/60">
                    <span className="rounded-full border border-ink/10 bg-paper px-3 py-1">
                      {t.leaderboard.points}: <span className="font-semibold text-ink">{row.points}</span>
                    </span>
                    <span className="rounded-full border border-ink/10 bg-paper px-3 py-1">
                      {t.cabinet.stats.wordsStudied}: <span className="font-semibold text-ink">{row.wordsStudied}</span>
                    </span>
                    <span className="rounded-full border border-ink/10 bg-paper px-3 py-1">
                      {t.cabinet.stats.testsTaken}: <span className="font-semibold text-ink">{row.testsTaken}</span>
                    </span>
                  </div>
                </div>
                  );
                })()
              ))}
            </div>
          )}

          {tab === "achievements" && (
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <AchievementsGrid achievements={achievements} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
