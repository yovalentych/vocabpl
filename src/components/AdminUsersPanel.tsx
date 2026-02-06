"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/components/LocaleProvider";

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
        <div>
          <h2 className="text-2xl font-semibold">{t.admin.usersTitle}</h2>
          <p className="mt-2 text-sm text-ink/60">{t.admin.usersSubtitle}</p>
        </div>
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={t.common.search}
          className="min-w-[220px] rounded-full border border-ink/20 bg-paper px-4 py-2 text-sm"
        />
      </div>

      {loading ? (
        <p className="mt-6 text-sm text-ink/60">{t.common.loading}</p>
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
              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-ink/60">
                <span className="rounded-full border border-ink/10 bg-paper px-3 py-1">
                  {t.cabinet.stats.wordsStudied}: <span className="font-semibold text-ink">{user.stats.wordsStudied}</span>
                </span>
                <span className="rounded-full border border-ink/10 bg-paper px-3 py-1">
                  {t.cabinet.stats.testsTaken}: <span className="font-semibold text-ink">{user.stats.testsTaken}</span>
                </span>
                <span className="rounded-full border border-ink/10 bg-paper px-3 py-1">
                  {t.leaderboard.points}: <span className="font-semibold text-ink">{user.stats.points || 0}</span>
                </span>
                <span className="rounded-full border border-ink/10 bg-paper px-3 py-1">
                  {t.admin.usersColumns.favorites}: <span className="font-semibold text-ink">{user.favoritesCount}</span>
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
              <h3 className="text-2xl font-semibold">{t.admin.userDetails}</h3>
              <button
                onClick={() => {
                  setSelectedId(null);
                  setDetails(null);
                }}
                className="rounded-full border border-ink/20 px-3 py-1 text-xs font-semibold"
              >
                {t.admin.close}
              </button>
            </div>

            {detailsLoading ? (
              <p className="mt-6 text-sm text-ink/60">{t.common.loading}</p>
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
                    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                      <div className="space-y-6">
                        <div className="rounded-2xl border border-ink/10 bg-paper/80 p-5">
                          <p className="text-xs uppercase tracking-[0.3em] text-ink/40">{t.admin.userDetails}</p>
                          <p className="mt-2 text-lg font-semibold">{details.user.username}</p>
                          <p className="text-sm text-ink/60">{details.user.name || "-"}</p>
                          <p className="mt-3 text-xs uppercase tracking-[0.3em] text-ink/40">
                            {t.admin.userRole}: {details.user.role}
                          </p>
                        </div>
                      </div>
                      <div className="rounded-2xl border border-ink/10 bg-paper/80 p-5">
                        <p className="text-xs uppercase tracking-[0.3em] text-ink/40">{t.admin.userStats}</p>
                        <div className="mt-3 grid gap-2 text-sm text-ink/70">
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
                  )}

                  {detailsTab === "favorites" && (
                    <div className="rounded-2xl border border-ink/10 bg-paper/80 p-5">
                      <p className="text-xs uppercase tracking-[0.3em] text-ink/40">{t.admin.userFavorites}</p>
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
                      <p className="text-xs uppercase tracking-[0.3em] text-ink/40">{t.admin.userActivity}</p>
                      <div className="mt-4 space-y-2 text-sm text-ink/70">
                        {activity.length ? (
                          activity.map((entry, idx) => (
                            <div
                              key={`${entry.type}-${idx}`}
                              className="flex items-center justify-between rounded-xl border border-ink/10 bg-paper/60 px-3 py-2"
                            >
                              <span>{entry.label}</span>
                              <span className="text-xs text-ink/50">
                                {new Date(entry.date as string).toLocaleDateString()}
                              </span>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-ink/50">{t.admin.noData}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {detailsTab === "progress" && (
                    <div className="rounded-2xl border border-ink/10 bg-paper/80 p-5">
                      <p className="text-xs uppercase tracking-[0.3em] text-ink/40">{t.admin.userProgress}</p>
                      <div className="mt-4 space-y-2 text-sm text-ink/70">
                        {details.wordProgress.map((entry) => (
                          <div
                            key={entry.wordId}
                            className="flex items-center justify-between rounded-xl border border-ink/10 bg-paper/60 px-3 py-2"
                          >
                            <span>{entry.word ? `${entry.word.pl} → ${entry.word.uk}` : entry.wordId}</span>
                            <span className="text-xs text-ink/50">
                              {entry.correctCount}/{entry.seenCount}
                            </span>
                          </div>
                        ))}
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
