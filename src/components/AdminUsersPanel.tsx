"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/components/LocaleProvider";
import Loader from "@/components/ui/Loader";
import {
  Users,
  MagnifyingGlass,
  Trophy,
  Target,
  X,
  Clock,
  Star,
  ChartLineUp,
  BookOpenText
} from "@phosphor-icons/react/dist/ssr";

type UserRow = {
  id: string;
  username: string;
  name: string;
  role: string;
  favoritesCount: number;
  stats: {
    wordsStudied: number;
    sessions: number;
    testsTaken: number;
    points?: number;
  };
  createdAt: string | null;
};

type UserDetails = {
  user: {
    id: string;
    username: string;
    name: string;
    role: string;
    stats: {
      wordsStudied: number;
      sessions: number;
      testsTaken: number;
      points?: number;
    };
    createdAt: string | null;
  };
  wordProgress: {
    wordId: string;
    seenCount: number;
    correctCount: number;
    lastSeen: string | null;
    word: { id: string; pl: string; uk: string; type: string } | null;
  }[];
  testHistory: { testId: string; correct: number; total: number; completedAt: string }[];
  favorites: { id: string; pl: string; uk: string; type: string }[];
};

export default function AdminUsersPanel() {
  const { t } = useLocale();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [details, setDetails] = useState<UserDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsTab, setDetailsTab] = useState<"overview" | "activity" | "progress" | "favorites">("overview");
  const [activityWindow, setActivityWindow] = useState<7 | 30>(7);
  const [activityType, setActivityType] = useState<"all" | "test" | "word">("all");

  useEffect(() => {
    let mounted = true;
    async function load() {
      const res = await fetch("/api/admin/users");
      if (!mounted) return;
      if (!res.ok) {
        setUsers([]);
        setLoading(false);
        return;
      }
      const data = await res.json();
      setUsers(data.users || []);
      setLoading(false);
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    let mounted = true;
    async function loadDetails() {
      setDetailsLoading(true);
      const res = await fetch(`/api/admin/users/${selectedId}`);
      if (!mounted) return;
      if (!res.ok) {
        setDetails(null);
        setDetailsLoading(false);
        return;
      }
      const data = await res.json();
      setDetails(data);
      setDetailsTab("overview");
      setDetailsLoading(false);
    }
    loadDetails();
    return () => {
      mounted = false;
    };
  }, [selectedId]);

  const activity = (details
    ? [
        ...(details.testHistory || []).map((entry) => ({
          type: "test" as const,
          date: entry.completedAt,
          label: `${entry.testId} · ${entry.correct}/${entry.total}`
        })),
        ...(details.wordProgress || []).map((entry) => ({
          type: "word" as const,
          date: entry.lastSeen,
          label: entry.word ? `${entry.word.pl} → ${entry.word.uk}` : entry.wordId
        }))
      ]
    : []
  )
    .filter((item) => item.date)
    .sort((a, b) => new Date(b.date as string).getTime() - new Date(a.date as string).getTime())
    .slice(0, 15);

  const activitySeries = details
    ? (() => {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - activityWindow + 1);
        const entries = [
          ...(details.testHistory || []).map((entry) => ({
            type: "test" as const,
            date: entry.completedAt
          })),
          ...(details.wordProgress || []).map((entry) => ({
            type: "word" as const,
            date: entry.lastSeen
          }))
        ].filter((item) => item.date);
        const filtered = entries.filter((entry) => {
          const date = new Date(entry.date as string);
          if (date < cutoff) return false;
          if (activityType === "all") return true;
          return entry.type === activityType;
        });
        const counts = new Map<string, number>();
        for (const entry of filtered) {
          const day = new Date(entry.date as string);
          const key = day.toISOString().slice(0, 10);
          counts.set(key, (counts.get(key) || 0) + 1);
        }
        const days = Array.from({ length: activityWindow }, (_, idx) => {
          const day = new Date(cutoff);
          day.setDate(cutoff.getDate() + idx);
          const key = day.toISOString().slice(0, 10);
          return {
            key,
            label: day.toLocaleDateString(undefined, { day: "2-digit", month: "2-digit" }),
            value: counts.get(key) || 0
          };
        });
        return days;
      })()
    : [];

  const wordRankings = details
    ? (() => {
        const enriched = details.wordProgress.map((entry) => {
          const seen = entry.seenCount || 0;
          const correct = entry.correctCount || 0;
          const accuracy = seen ? correct / seen : 0;
          return {
            ...entry,
            seen,
            correct,
            accuracy
          };
        });
        const strongest = enriched
          .filter((entry) => entry.seen >= 3)
          .sort((a, b) => b.accuracy - a.accuracy || b.seen - a.seen)
          .slice(0, 5);
        const weakest = enriched
          .filter((entry) => entry.seen >= 3)
          .sort((a, b) => a.accuracy - b.accuracy || b.seen - a.seen)
          .slice(0, 5);
        return { strongest, weakest };
      })()
    : { strongest: [], weakest: [] };

  const derived = details
    ? (() => {
        const totalSeen = details.wordProgress.reduce((sum, entry) => sum + (entry.seenCount || 0), 0);
        const totalCorrect = details.wordProgress.reduce((sum, entry) => sum + (entry.correctCount || 0), 0);
        const accuracy = totalSeen ? Math.round((totalCorrect / totalSeen) * 100) : 0;
        const lastWordSeen = details.wordProgress
          .map((entry) => entry.lastSeen)
          .filter(Boolean)
          .sort((a, b) => new Date(b as string).getTime() - new Date(a as string).getTime())[0];
        const lastTestSeen = details.testHistory
          .map((entry) => entry.completedAt)
          .filter(Boolean)
          .sort((a, b) => new Date(b as string).getTime() - new Date(a as string).getTime())[0];
        const lastActivity = [lastWordSeen, lastTestSeen]
          .filter(Boolean)
          .sort((a, b) => new Date(b as string).getTime() - new Date(a as string).getTime())[0];
        const testsTotal = details.testHistory.reduce((sum, entry) => sum + entry.total, 0);
        const testsCorrect = details.testHistory.reduce((sum, entry) => sum + entry.correct, 0);
        const avgTestScore = testsTotal ? Math.round((testsCorrect / testsTotal) * 100) : 0;
        const recentTests = [...details.testHistory]
          .filter((entry) => entry.completedAt)
          .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
          .slice(0, 5);
        const recentWords = [...details.wordProgress]
          .filter((entry) => entry.lastSeen)
          .sort((a, b) => new Date(b.lastSeen as string).getTime() - new Date(a.lastSeen as string).getTime())
          .slice(0, 5);
        return {
          totalSeen,
          totalCorrect,
          accuracy,
          lastActivity,
          lastWordSeen,
          lastTestSeen,
          avgTestScore,
          recentTests,
          recentWords
        };
      })()
    : null;

  const filteredUsers = users.filter((user) => {
    if (!search.trim()) return true;
    const needle = search.trim().toLowerCase();
    return (
      user.username.toLowerCase().includes(needle) ||
      (user.name || "").toLowerCase().includes(needle) ||
      user.role.toLowerCase().includes(needle)
    );
  });

  return (
    <div className="rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Users size={24} weight="bold" className="text-ink" />
          <div>
            <h2 className="text-2xl font-semibold">{t.admin.usersTitle}</h2>
            <p className="mt-1 text-sm text-ink/60">{t.admin.usersSubtitle}</p>
          </div>
        </div>
        <div className="relative">
          <MagnifyingGlass size={16} weight="bold" className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t.common.search}
            className="min-w-[220px] rounded-full border border-ink/20 bg-paper pl-9 pr-4 py-2 text-sm"
          />
        </div>
      </div>

      {loading ? (
        <div className="mt-6">
          <Loader label={t.common.loading} />
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {filteredUsers.map((user) => (
            <button
              key={user.id}
              onClick={() => setSelectedId(user.id)}
              className="w-full rounded-2xl border border-ink/10 bg-paper/70 px-4 py-4 text-left transition hover:border-ink/30"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">{user.username}</p>
                  <p className="text-xs text-ink/50">{user.name || "-"}</p>
                </div>
                <span className="rounded-full border border-ink/10 bg-paper px-3 py-1 text-xs uppercase tracking-[0.2em] text-ink/50">
                  {user.role}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-ink/60">
                <span className="flex items-center gap-1 rounded-full border border-ink/10 bg-paper px-3 py-1">
                  <Target size={12} weight="fill" className="text-moss" />
                  {t.cabinet.stats.wordsStudied}: <span className="font-semibold text-ink">{user.stats.wordsStudied}</span>
                </span>
                <span className="flex items-center gap-1 rounded-full border border-ink/10 bg-paper px-3 py-1">
                  <Trophy size={12} weight="fill" className="text-gold" />
                  {t.leaderboard.points}: <span className="font-semibold text-ink">{user.stats.points || 0}</span>
                </span>
                <span className="rounded-full border border-ink/10 bg-paper px-3 py-1">
                  {t.cabinet.stats.testsTaken}: <span className="font-semibold text-ink">{user.stats.testsTaken}</span>
                </span>
              </div>
            </button>
          ))}
          {!filteredUsers.length && <p className="text-xs text-ink/50">{t.admin.noData}</p>}
        </div>
      )}

      {selectedId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 px-4">
          <div className="w-full max-w-5xl rounded-3xl border border-ink/10 bg-paper p-6 shadow-soft">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users size={24} weight="bold" className="text-ink" />
                <h3 className="text-2xl font-semibold">{t.admin.userDetails}</h3>
              </div>
              <button
                onClick={() => {
                  setSelectedId(null);
                  setDetails(null);
                }}
                className="flex items-center gap-2 rounded-full border border-ink/20 px-3 py-1 text-xs font-semibold transition hover:bg-ink/5"
              >
                <X size={14} weight="bold" />
                {t.admin.close}
              </button>
            </div>

            {detailsLoading ? (
              <div className="mt-6">
                <Loader label={t.common.loading} />
              </div>
            ) : details ? (
              <div className="mt-6">
                <div className="flex flex-wrap gap-2 border-b border-ink/10 pb-4">
                  {[
                    { id: "overview", label: t.admin.userStats },
                    { id: "activity", label: t.admin.userActivity },
                    { id: "progress", label: t.admin.userProgress },
                    { id: "favorites", label: t.admin.userFavorites }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setDetailsTab(tab.id as typeof detailsTab)}
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        detailsTab === tab.id ? "bg-ink text-paper" : "border border-ink/20 text-ink"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="mt-6 max-h-[70vh] overflow-y-auto pr-1">
                  {detailsTab === "overview" && (
                    <div className="space-y-6">
                      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                        <div className="rounded-2xl border border-ink/10 bg-paper/80 p-5">
                          <p className="text-xs uppercase tracking-[0.3em] text-ink/40">{t.admin.userDetails}</p>
                          <p className="mt-2 text-lg font-semibold">{details.user.username}</p>
                          <p className="text-sm text-ink/60">{details.user.name || "-"}</p>
                          <div className="mt-4 grid gap-2 text-xs text-ink/60">
                            <div className="flex items-center justify-between">
                              <span>{t.admin.userRole}</span>
                              <span className="rounded-full border border-ink/10 bg-paper px-3 py-1 uppercase tracking-[0.2em]">
                                {details.user.role}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span>{t.admin.userSince}</span>
                              <span className="font-semibold">
                                {details.user.createdAt ? new Date(details.user.createdAt).toLocaleDateString() : "-"}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span>{t.admin.lastActive}</span>
                              <span className="font-semibold">
                                {derived?.lastActivity ? new Date(derived.lastActivity).toLocaleDateString() : "-"}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="rounded-2xl border border-ink/10 bg-paper/80 p-5">
                          <p className="text-xs uppercase tracking-[0.3em] text-ink/40">{t.admin.userStats}</p>
                          <div className="mt-4 grid gap-3 text-sm text-ink/70">
                            <div className="flex items-center justify-between">
                              <span>{t.cabinet.stats.wordsStudied}</span>
                              <span className="font-semibold">{details.user.stats.wordsStudied}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span>{t.cabinet.stats.sessions}</span>
                              <span className="font-semibold">{details.user.stats.sessions}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span>{t.cabinet.stats.testsTaken}</span>
                              <span className="font-semibold">{details.user.stats.testsTaken}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span>{t.leaderboard.points}</span>
                              <span className="font-semibold">{details.user.stats.points || 0}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {[
                          {
                            label: t.admin.totalSeen,
                            value: derived?.totalSeen || 0,
                            icon: BookOpenText,
                            tone: "moss"
                          },
                          {
                            label: t.admin.totalCorrect,
                            value: derived?.totalCorrect || 0,
                            icon: Target,
                            tone: "terracotta"
                          },
                          {
                            label: t.admin.accuracy,
                            value: `${derived?.accuracy ?? 0}%`,
                            icon: ChartLineUp,
                            tone: "gold"
                          },
                          {
                            label: t.admin.avgTestScore,
                            value: `${derived?.avgTestScore ?? 0}%`,
                            icon: Trophy,
                            tone: "ink"
                          }
                        ].map((stat) => (
                          <div key={stat.label} className="rounded-2xl border border-ink/10 bg-paper/80 p-4">
                            <div className="flex items-center gap-2">
                              <span
                                className={`inline-flex h-9 w-9 items-center justify-center rounded-2xl ${
                                  stat.tone === "moss"
                                    ? "bg-moss/10 text-moss"
                                    : stat.tone === "terracotta"
                                    ? "bg-terracotta/10 text-terracotta"
                                    : stat.tone === "gold"
                                    ? "bg-gold/20 text-terracotta"
                                    : "bg-ink/10 text-ink"
                                }`}
                              >
                                <stat.icon size={16} weight="fill" />
                              </span>
                              <div>
                                <p className="text-[11px] uppercase tracking-[0.2em] text-ink/50">{stat.label}</p>
                                <p className="text-lg font-semibold">{stat.value}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
                        <div className="rounded-2xl border border-ink/10 bg-paper/80 p-5">
                          <p className="text-xs uppercase tracking-[0.3em] text-ink/40">{t.admin.recentTests}</p>
                          <div className="mt-3 space-y-2 text-sm text-ink/70">
                            {derived?.recentTests.length ? (
                              derived.recentTests.map((entry) => (
                                <div
                                  key={`${entry.testId}-${entry.completedAt}`}
                                  className="flex items-center justify-between rounded-xl border border-ink/10 bg-paper/60 px-3 py-2"
                                >
                                  <span>{entry.testId}</span>
                                  <span className="text-xs text-ink/50">
                                    {entry.correct}/{entry.total} ·{" "}
                                    {new Date(entry.completedAt).toLocaleDateString()}
                                  </span>
                                </div>
                              ))
                            ) : (
                              <p className="text-xs text-ink/50">{t.admin.noRecentActivity}</p>
                            )}
                          </div>
                        </div>

                        <div className="rounded-2xl border border-ink/10 bg-paper/80 p-5">
                          <p className="text-xs uppercase tracking-[0.3em] text-ink/40">{t.admin.recentWords}</p>
                          <div className="mt-3 space-y-2 text-sm text-ink/70">
                            {derived?.recentWords.length ? (
                              derived.recentWords.map((entry) => (
                                <div
                                  key={entry.wordId}
                                  className="flex items-center justify-between rounded-xl border border-ink/10 bg-paper/60 px-3 py-2"
                                >
                                  <span>{entry.word ? `${entry.word.pl} → ${entry.word.uk}` : entry.wordId}</span>
                                  <span className="text-xs text-ink/50">
                                    {entry.correctCount}/{entry.seenCount}
                                  </span>
                                </div>
                              ))
                            ) : (
                              <p className="text-xs text-ink/50">{t.admin.noRecentActivity}</p>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
                        <div className="rounded-2xl border border-ink/10 bg-paper/80 p-5">
                          <p className="text-xs uppercase tracking-[0.3em] text-ink/40">{t.admin.strongestWords}</p>
                          <div className="mt-3 space-y-2 text-sm text-ink/70">
                            {wordRankings.strongest.length ? (
                              wordRankings.strongest.map((entry) => (
                                <div
                                  key={entry.wordId}
                                  className="flex items-center justify-between rounded-xl border border-ink/10 bg-paper/60 px-3 py-2"
                                >
                                  <span>{entry.word ? `${entry.word.pl} → ${entry.word.uk}` : entry.wordId}</span>
                                  <span className="text-xs text-ink/50">
                                    {Math.round(entry.accuracy * 100)}% · {entry.correct}/{entry.seen}
                                  </span>
                                </div>
                              ))
                            ) : (
                              <p className="text-xs text-ink/50">{t.admin.noData}</p>
                            )}
                          </div>
                        </div>

                        <div className="rounded-2xl border border-ink/10 bg-paper/80 p-5">
                          <p className="text-xs uppercase tracking-[0.3em] text-ink/40">{t.admin.weakestWords}</p>
                          <div className="mt-3 space-y-2 text-sm text-ink/70">
                            {wordRankings.weakest.length ? (
                              wordRankings.weakest.map((entry) => (
                                <div
                                  key={entry.wordId}
                                  className="flex items-center justify-between rounded-xl border border-ink/10 bg-paper/60 px-3 py-2"
                                >
                                  <span>{entry.word ? `${entry.word.pl} → ${entry.word.uk}` : entry.wordId}</span>
                                  <span className="text-xs text-ink/50">
                                    {Math.round(entry.accuracy * 100)}% · {entry.correct}/{entry.seen}
                                  </span>
                                </div>
                              ))
                            ) : (
                              <p className="text-xs text-ink/50">{t.admin.noData}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {detailsTab === "favorites" && (
                    <div className="rounded-2xl border border-ink/10 bg-paper/80 p-5">
                      <div className="flex items-center justify-between">
                        <p className="text-xs uppercase tracking-[0.3em] text-ink/40">{t.admin.userFavorites}</p>
                        <span className="rounded-full border border-ink/10 bg-paper px-3 py-1 text-[11px] text-ink/60">
                          {t.admin.favoritesCount}: {details.favorites.length}
                        </span>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs text-ink/70">
                        {details.favorites.length ? (
                          details.favorites.map((word) => (
                            <span
                              key={word.id}
                              className="rounded-full border border-ink/10 bg-paper/60 px-3 py-1"
                            >
                              {word.pl} · {word.uk}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-ink/50">{t.admin.noData}</span>
                        )}
                      </div>
                    </div>
                  )}

                  {detailsTab === "activity" && (
                    <div className="rounded-2xl border border-ink/10 bg-paper/80 p-5">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-xs uppercase tracking-[0.3em] text-ink/40">{t.admin.userActivity}</p>
                        <div className="flex flex-wrap gap-2 text-[11px]">
                          {[
                            { id: "all", label: t.admin.activityAll },
                            { id: "word", label: t.admin.activityWords },
                            { id: "test", label: t.admin.activityTests }
                          ].map((item) => (
                            <button
                              key={item.id}
                              onClick={() => setActivityType(item.id as typeof activityType)}
                              className={`rounded-full px-3 py-1 font-semibold ${
                                activityType === item.id
                                  ? "bg-ink text-paper"
                                  : "border border-ink/20 text-ink/60"
                              }`}
                            >
                              {item.label}
                            </button>
                          ))}
                          {[7, 30].map((days) => (
                            <button
                              key={days}
                              onClick={() => setActivityWindow(days as 7 | 30)}
                              className={`rounded-full px-3 py-1 font-semibold ${
                                activityWindow === days
                                  ? "bg-ink text-paper"
                                  : "border border-ink/20 text-ink/60"
                              }`}
                            >
                              {days}d
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="mt-4 rounded-2xl border border-ink/10 bg-paper/60 p-4">
                        <div className="flex items-end gap-2">
                          {activitySeries.map((entry) => (
                            <div key={entry.key} className="flex flex-1 flex-col items-center gap-2">
                              <div className="h-24 w-full rounded-full bg-fog/70">
                                <div
                                  className="w-full rounded-full bg-moss/60"
                                  style={{ height: `${Math.min(100, entry.value * (activityWindow === 7 ? 18 : 8))}%` }}
                                />
                              </div>
                              <span className="text-[10px] text-ink/50">{entry.label}</span>
                              <span className="text-[10px] text-ink/40">{entry.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="mt-4 space-y-2 text-sm text-ink/70">
                        {activity.length ? (
                          activity.map((entry, idx) => (
                            <div
                              key={`${entry.type}-${idx}`}
                              className="flex items-center justify-between rounded-xl border border-ink/10 bg-paper/60 px-3 py-2"
                            >
                              <div className="flex items-center gap-2">
                                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-ink/10 text-ink">
                                  {entry.type === "test" ? <Trophy size={14} weight="fill" /> : <Star size={14} weight="fill" />}
                                </span>
                                <span>{entry.label}</span>
                              </div>
                              <span className="text-xs text-ink/50">
                                {new Date(entry.date as string).toLocaleDateString()}
                              </span>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-ink/50">{t.admin.noRecentActivity}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {detailsTab === "progress" && (
                    <div className="rounded-2xl border border-ink/10 bg-paper/80 p-5">
                      <div className="flex items-center justify-between">
                        <p className="text-xs uppercase tracking-[0.3em] text-ink/40">{t.admin.userProgress}</p>
                        <span className="text-xs text-ink/50">
                          {t.admin.totalSeen}: {derived?.totalSeen || 0}
                        </span>
                      </div>
                      <div className="mt-4 space-y-2 text-sm text-ink/70">
                        {details.wordProgress.map((entry) => {
                          const percent = entry.seenCount
                            ? Math.round((entry.correctCount / entry.seenCount) * 100)
                            : 0;
                          return (
                            <div
                              key={entry.wordId}
                              className="rounded-xl border border-ink/10 bg-paper/60 px-3 py-2"
                            >
                              <div className="flex items-center justify-between">
                                <span>{entry.word ? `${entry.word.pl} → ${entry.word.uk}` : entry.wordId}</span>
                                <span className="text-xs text-ink/50">
                                  {entry.correctCount}/{entry.seenCount} · {percent}%
                                </span>
                              </div>
                              {entry.lastSeen && (
                                <div className="mt-1 flex items-center gap-2 text-[11px] text-ink/50">
                                  <Clock size={12} />
                                  {new Date(entry.lastSeen).toLocaleDateString()}
                                </div>
                              )}
                            </div>
                          );
                        })}
                        {!details.wordProgress.length && (
                          <p className="text-xs text-ink/50">{t.admin.noData}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <p className="mt-6 text-sm text-ink/60">{t.admin.noData}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
