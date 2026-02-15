"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/components/LocaleProvider";
import AchievementsSection from "@/components/AchievementsSection";
import Loader from "@/components/ui/Loader";

type UserSnapshot = {
  username: string;
  name?: string;
  stats?: {
    wordsStudied?: number;
    testsTaken?: number;
    sessions?: number;
    points?: number;
  };
};

export default function CabinetAchievementsClient() {
  const { locale } = useLocale();
  const [user, setUser] = useState<UserSnapshot | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      const res = await fetch("/api/user/me");
      if (!mounted) return;
      if (!res.ok) {
        setLoading(false);
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (!mounted) return;
      setUser(data.user || null);
      setLoading(false);
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft">
        <Loader label="Завантажую..." />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft">
        <p className="text-sm text-ink/60">Не вдалося завантажити дані користувача.</p>
      </div>
    );
  }

  return (
    <AchievementsSection
      username={user.username}
      name={user.name || user.username}
      stats={{
        wordsStudied: Number(user.stats?.wordsStudied || 0),
        testsTaken: Number(user.stats?.testsTaken || 0),
        sessions: Number(user.stats?.sessions || 0),
        points: Number(user.stats?.points || 0)
      }}
      locale={locale}
      title="Мої ачівки"
      subtitle="Відстежуй прогрес та відкривай нові нагороди"
    />
  );
}
