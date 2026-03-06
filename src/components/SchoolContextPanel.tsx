"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { GraduationCap, CalendarCheck, ClipboardText, ArrowRight } from "@phosphor-icons/react";

interface Props {
  locale: "uk" | "pl";
}

export default function SchoolContextPanel({ locale }: Props) {
  const [data, setData] = useState<{
    upcomingEvents: any[];
    pendingAssignments: any[];
  } | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/schedule/my").then((r) => r.ok ? r.json() : null).catch(() => null),
      fetch("/api/student/assignments").then((r) => r.ok ? r.json() : null).catch(() => null),
    ]).then(([scheduleData, assignmentsData]) => {
      const now = new Date();
      const upcoming = (scheduleData?.events || [])
        .filter((e: any) => new Date(e.startTime) > now)
        .slice(0, 3);
      const pending = (assignmentsData?.assignments || [])
        .filter((a: any) => a.status === "not_started" || a.status === "in_progress")
        .slice(0, 3);
      setData({ upcomingEvents: upcoming, pendingAssignments: pending });
    });
  }, []);

  if (!data || (data.upcomingEvents.length === 0 && data.pendingAssignments.length === 0)) {
    return null;
  }

  const t = {
    school: locale === "pl" ? "Szkoła" : "Школа",
    upcoming: locale === "pl" ? "Najbliższe zajęcia" : "Найближчі заняття",
    pending: locale === "pl" ? "Aktywne zadania" : "Активні завдання",
    viewAll: locale === "pl" ? "Wszystko" : "Всі",
    today: locale === "pl" ? "Dziś" : "Сьогодні",
    tomorrow: locale === "pl" ? "Jutro" : "Завтра",
  };

  function formatDate(dateStr: string) {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 0) return t.today;
    if (diff === 1) return t.tomorrow;
    return d.toLocaleDateString(locale === "pl" ? "pl-PL" : "uk-UA", { day: "numeric", month: "short" });
  }

  return (
    <section className="mt-10">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GraduationCap size={20} weight="fill" className="text-ink/60" />
          <h2 className="text-lg font-semibold">{t.school}</h2>
        </div>
        <Link href="/school" className="flex items-center gap-1 text-sm text-moss hover:underline">
          {t.viewAll}
          <ArrowRight size={14} />
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Upcoming events */}
        {data.upcomingEvents.length > 0 && (
          <div className="rounded-[24px] border border-ink/10 bg-paper p-5 shadow-soft">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink/60">
              <CalendarCheck size={16} weight="fill" className="text-moss" />
              {t.upcoming}
            </div>
            <div className="space-y-2">
              {data.upcomingEvents.map((ev: any) => (
                <Link
                  key={ev._id}
                  href={`/school?tab=schedule`}
                  className="flex items-center justify-between rounded-[14px] border border-ink/5 bg-ink/5 px-3 py-2.5 text-sm transition-all hover:border-moss/20 hover:bg-moss/5"
                >
                  <span className="font-medium truncate mr-3">{ev.title}</span>
                  <span className="shrink-0 text-xs text-ink/50">{formatDate(ev.startTime)}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Pending assignments */}
        {data.pendingAssignments.length > 0 && (
          <div className="rounded-[24px] border border-ink/10 bg-paper p-5 shadow-soft">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink/60">
              <ClipboardText size={16} weight="fill" className="text-terracotta" />
              {t.pending}
            </div>
            <div className="space-y-2">
              {data.pendingAssignments.map((a: any) => (
                <Link
                  key={a.assignmentId || a._id}
                  href={`/classes/${a.classId}/assignments/${a.assignmentId || a._id}`}
                  className="flex items-center justify-between rounded-[14px] border border-ink/5 bg-ink/5 px-3 py-2.5 text-sm transition-all hover:border-terracotta/20 hover:bg-terracotta/5"
                >
                  <span className="font-medium truncate mr-3">{a.assignmentTitle || a.title}</span>
                  <span className="shrink-0 text-xs text-ink/50">{a.className}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
