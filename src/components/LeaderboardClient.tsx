"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale } from "@/components/LocaleProvider";
import Loader from "@/components/ui/Loader";

type Row = {
  rank: number;
  username: string;
  name: string;
  points: number;
  wordsStudied: number;
  testsTaken: number;
};

export default function LeaderboardClient() {
  const { t } = useLocale();
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
    return [
      {
        id: "first-test",
        title: "Перші кроки",
        desc: "Завершити 1 тест",
        icon: "🌱",
        unlocked: stats.testsTaken >= 1,
        progress: Math.min(stats.testsTaken, 1),
        target: 1
      },
      {
        id: "five-tests",
        title: "Тестова серія",
        desc: "Завершити 5 тестів",
        icon: "🧪",
        unlocked: stats.testsTaken >= 5,
        progress: Math.min(stats.testsTaken, 5),
        target: 5
      },
      {
        id: "ten-tests",
        title: "Відмінник",
        desc: "Завершити 10 тестів",
        icon: "🏅",
        unlocked: stats.testsTaken >= 10,
        progress: Math.min(stats.testsTaken, 10),
        target: 10
      },
      {
        id: "words-20",
        title: "Словниковий старт",
        desc: "Вивчити 20 слів",
        icon: "📘",
        unlocked: stats.wordsStudied >= 20,
        progress: Math.min(stats.wordsStudied, 20),
        target: 20
      },
      {
        id: "words-100",
        title: "Сто слів",
        desc: "Вивчити 100 слів",
        icon: "📚",
        unlocked: stats.wordsStudied >= 100,
        progress: Math.min(stats.wordsStudied, 100),
        target: 100
      },
      {
        id: "sessions-5",
        title: "Ритм",
        desc: "Зробити 5 навчальних сесій",
        icon: "⏱️",
        unlocked: stats.sessions >= 5,
        progress: Math.min(stats.sessions, 5),
        target: 5
      },
      {
        id: "sessions-20",
        title: "Стабільність",
        desc: "Зробити 20 навчальних сесій",
        icon: "🔥",
        unlocked: stats.sessions >= 20,
        progress: Math.min(stats.sessions, 20),
        target: 20
      },
      {
        id: "points-100",
        title: "Перші 100",
        desc: "Набрати 100 балів",
        icon: "⚡",
        unlocked: stats.points >= 100,
        progress: Math.min(stats.points, 100),
        target: 100
      },
      {
        id: "points-500",
        title: "Сила 500",
        desc: "Набрати 500 балів",
        icon: "💎",
        unlocked: stats.points >= 500,
        progress: Math.min(stats.points, 500),
        target: 500
      },
      {
        id: "top-10",
        title: "Топ-10",
        desc: "Увійти в першу десятку рейтингу",
        icon: "🏆",
        unlocked: typeof userRank === "number" ? userRank <= 10 : false,
        progress: userRank && userRank > 10 ? 0 : 1,
        target: 1
      }
    ];
  }, [userStats, userRank]);

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
              {achievements.map((achievement) => {
                const percent = achievement.target > 0
                  ? Math.round((achievement.progress / achievement.target) * 100)
                  : achievement.unlocked ? 100 : 0;
                return (
                  <div
                    key={achievement.id}
                    className={`rounded-2xl border p-4 shadow-soft ${
                      achievement.unlocked
                        ? "border-moss/20 bg-moss/5"
                        : "border-ink/10 bg-paper/70"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full border border-ink/10 bg-paper text-xl">
                        {achievement.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-semibold">{achievement.title}</p>
                          <span className="text-xs font-semibold text-ink/60">
                            {achievement.unlocked ? "Отримано" : `${achievement.progress}/${achievement.target}`}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-ink/50">{achievement.desc}</p>
                        <div className="mt-3 h-2 w-full rounded-full bg-ink/10">
                          <div
                            className={`h-2 rounded-full ${achievement.unlocked ? "bg-moss" : "bg-gold/70"}`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
