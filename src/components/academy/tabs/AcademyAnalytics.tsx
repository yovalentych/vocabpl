"use client";

import { useState, useEffect } from "react";
import { useLocale } from "@/components/LocaleProvider";
import Link from "next/link";
import {
  ChartBar,
  CheckCircle,
  Clock,
  Users,
  ClipboardText,
  Warning,
  Star,
  Books,
} from "@phosphor-icons/react";

interface Props {
  isTeacher: boolean;
}

interface StudentDashboard {
  stats: {
    totalClasses: number;
    activeAssignments: number;
    upcomingDeadlines: number;
    averageGrade: number | null;
  };
  classes: {
    _id: string;
    name: string;
    teacherName: string;
    totalAssignments: number;
    completedAssignments: number;
    myAverageGrade: number | null;
    upcomingDeadlines: number;
  }[];
  upcomingDeadlines: {
    assignmentId: string;
    assignmentTitle: string;
    className: string;
    classId: string;
    dueAt: string;
    status: string;
    daysRemaining: number;
  }[];
  recentGrades: {
    assignmentId: string;
    assignmentTitle: string;
    className: string;
    classId: string;
    score: number;
    percentage: number;
    gradedAt: string;
  }[];
}

export default function AcademyAnalytics({ isTeacher }: Props) {
  const { locale } = useLocale();
  const [teacherAnalytics, setTeacherAnalytics] = useState<any>(null);
  const [studentData, setStudentData] = useState<StudentDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, [isTeacher]);

  async function loadAnalytics() {
    setLoading(true);
    try {
      if (isTeacher) {
        const res = await fetch("/api/teacher/analytics");
        if (res.ok) {
          const data = await res.json();
          setTeacherAnalytics(data.analytics);
        }
      } else {
        const res = await fetch("/api/student/dashboard");
        if (res.ok) {
          const data = await res.json();
          setStudentData(data);
        }
      }
    } catch (error) {
      console.error("Failed to load analytics:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-moss border-t-transparent" />
      </div>
    );
  }

  // ── Teacher view ──
  if (isTeacher) {
    if (!teacherAnalytics) {
      return (
        <div className="rounded-[24px] border border-ink/10 bg-ink/5 p-12 text-center">
          <ChartBar size={48} weight="thin" className="mx-auto mb-4 text-ink/40" />
          <p className="text-ink/60">{locale === "pl" ? "Brak danych" : "Немає даних"}</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold">
            {locale === "pl" ? "Statystyki i analiza" : "Статистика та аналіз"}
          </h2>
          <p className="text-sm text-ink/60">
            {locale === "pl" ? "Przegląd wydajności wszystkich klas" : "Огляд ефективності всіх класів"}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-[24px] border border-ink/10 bg-gradient-to-br from-moss/10 to-paper p-6 shadow-soft">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm text-ink/60">{locale === "pl" ? "Klasy" : "Класи"}</span>
              <ChartBar size={20} weight="fill" className="text-moss" />
            </div>
            <div className="text-3xl font-semibold text-moss">{teacherAnalytics.totalClasses}</div>
            <div className="mt-1 text-xs text-ink/60">
              {teacherAnalytics.totalStudents} {locale === "pl" ? "uczniów łącznie" : "студентів загалом"}
            </div>
          </div>

          <div className="rounded-[24px] border border-ink/10 bg-gradient-to-br from-terracotta/10 to-paper p-6 shadow-soft">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm text-ink/60">{locale === "pl" ? "Aktywni" : "Активні"}</span>
              <Users size={20} weight="fill" className="text-terracotta" />
            </div>
            <div className="text-3xl font-semibold text-terracotta">{teacherAnalytics.activeStudents}</div>
            <div className="mt-1 text-xs text-ink/60">
              {locale === "pl" ? "uczniów (30 dni)" : "студентів (30 днів)"}
            </div>
          </div>

          <div className="rounded-[24px] border border-ink/10 bg-gradient-to-br from-gold/10 to-paper p-6 shadow-soft">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm text-ink/60">{locale === "pl" ? "Zadania" : "Завдання"}</span>
              <ClipboardText size={20} weight="fill" className="text-gold" />
            </div>
            <div className="text-3xl font-semibold text-gold">{teacherAnalytics.totalAssignments}</div>
            <div className="mt-1 text-xs text-ink/60">
              {teacherAnalytics.gradedSubmissions} {locale === "pl" ? "ocenionych" : "оцінених"}
            </div>
          </div>

          <div className="rounded-[24px] border border-ink/10 bg-gradient-to-br from-moss/10 to-paper p-6 shadow-soft">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm text-ink/60">{locale === "pl" ? "Wynik śr." : "Сер. оцінка"}</span>
              <CheckCircle size={20} weight="fill" className="text-moss" />
            </div>
            <div className="text-3xl font-semibold text-moss">
              {teacherAnalytics.averageScore > 0 ? `${teacherAnalytics.averageScore}%` : "—"}
            </div>
            <div className="mt-1 text-xs text-ink/60">
              {teacherAnalytics.completionRate}% {locale === "pl" ? "ukończenia" : "виконання"}
            </div>
          </div>
        </div>

        {teacherAnalytics.recentActivity?.length > 0 && (
          <div className="rounded-[24px] border border-ink/10 bg-paper p-6 shadow-soft">
            <h3 className="mb-4 font-semibold">
              {locale === "pl" ? "Ostatnia aktywność" : "Остання активність"}
            </h3>
            <div className="space-y-3">
              {teacherAnalytics.recentActivity.map((item: any, i: number) => (
                <div key={i} className="flex items-center justify-between rounded-[16px] border border-ink/10 bg-ink/5 px-4 py-3">
                  <div>
                    <div className="text-sm font-medium">{item.studentName}</div>
                    <div className="text-xs text-ink/60">{item.assignmentTitle} · {item.className}</div>
                  </div>
                  <div className={`rounded-full px-3 py-1 text-sm font-semibold ${
                    item.percentage >= 80 ? "bg-moss/10 text-moss" :
                    item.percentage >= 60 ? "bg-gold/10 text-gold" :
                    "bg-terracotta/10 text-terracotta"
                  }`}>
                    {item.percentage}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Student view ──
  if (!studentData) {
    return (
      <div className="rounded-[24px] border border-ink/10 bg-ink/5 p-12 text-center">
        <ChartBar size={48} weight="thin" className="mx-auto mb-4 text-ink/40" />
        <p className="text-ink/60">{locale === "pl" ? "Brak danych" : "Немає даних"}</p>
      </div>
    );
  }

  const { stats, classes, upcomingDeadlines, recentGrades } = studentData;

  function gradeColor(pct: number) {
    if (pct >= 80) return "text-moss";
    if (pct >= 60) return "text-gold";
    return "text-terracotta";
  }

  function gradeBg(pct: number) {
    if (pct >= 80) return "bg-moss/10 text-moss";
    if (pct >= 60) return "bg-gold/10 text-gold";
    return "bg-terracotta/10 text-terracotta";
  }

  function deadlineBadge(days: number) {
    if (days < 0) return "bg-terracotta/10 text-terracotta border-terracotta/20";
    if (days <= 1) return "bg-terracotta/10 text-terracotta border-terracotta/20";
    if (days <= 3) return "bg-gold/10 text-gold border-gold/20";
    return "bg-ink/5 text-ink/60 border-ink/10";
  }

  function deadlineLabel(days: number) {
    if (days < 0) return locale === "pl" ? "Zaległy" : "Прострочено";
    if (days === 0) return locale === "pl" ? "Dziś" : "Сьогодні";
    if (days === 1) return locale === "pl" ? "Jutro" : "Завтра";
    return locale === "pl" ? `${days} dni` : `${days} дн.`;
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold">
          {locale === "pl" ? "Mój postęp" : "Мій прогрес"}
        </h2>
        <p className="text-sm text-ink/60">
          {locale === "pl" ? "Twoja nauka w liczbach" : "Ваше навчання в цифрах"}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-[24px] border border-ink/10 bg-gradient-to-br from-moss/10 to-paper p-6 shadow-soft">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm text-ink/60">{locale === "pl" ? "Klasy" : "Класи"}</span>
            <Books size={20} weight="fill" className="text-moss" />
          </div>
          <div className="text-3xl font-bold text-moss">{stats.totalClasses}</div>
        </div>

        <div className="rounded-[24px] border border-ink/10 bg-gradient-to-br from-gold/10 to-paper p-6 shadow-soft">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm text-ink/60">{locale === "pl" ? "Aktywne" : "Активні завдання"}</span>
            <ClipboardText size={20} weight="fill" className="text-gold" />
          </div>
          <div className="text-3xl font-bold text-gold">{stats.activeAssignments}</div>
        </div>

        <div className="rounded-[24px] border border-ink/10 bg-gradient-to-br from-terracotta/10 to-paper p-6 shadow-soft">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm text-ink/60">{locale === "pl" ? "Terminy" : "Найближчі дедлайни"}</span>
            <Warning size={20} weight="fill" className="text-terracotta" />
          </div>
          <div className="text-3xl font-bold text-terracotta">{stats.upcomingDeadlines}</div>
        </div>

        <div className="rounded-[24px] border border-ink/10 bg-gradient-to-br from-moss/10 to-paper p-6 shadow-soft">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm text-ink/60">{locale === "pl" ? "Średnia" : "Середня оцінка"}</span>
            <Star size={20} weight="fill" className="text-moss" />
          </div>
          <div className={`text-3xl font-bold ${stats.averageGrade !== null ? gradeColor(stats.averageGrade) : "text-ink/30"}`}>
            {stats.averageGrade !== null ? `${stats.averageGrade}%` : "—"}
          </div>
        </div>
      </div>

      {/* Upcoming deadlines */}
      {upcomingDeadlines.length > 0 && (
        <div className="rounded-[24px] border border-ink/10 bg-paper p-6 shadow-soft">
          <h3 className="mb-4 flex items-center gap-2 font-semibold">
            <Clock size={18} weight="fill" className="text-terracotta" />
            {locale === "pl" ? "Nadchodzące terminy" : "Найближчі дедлайни"}
          </h3>
          <div className="space-y-2">
            {upcomingDeadlines.map((d) => (
              <Link
                key={d.assignmentId}
                href={`/classes/${d.classId}/assignments/${d.assignmentId}`}
                className="flex items-center gap-3 rounded-[16px] border border-ink/10 p-3 transition-colors hover:bg-ink/[0.02]"
              >
                <div className="flex-1 min-w-0">
                  <div className="truncate text-sm font-medium">{d.assignmentTitle}</div>
                  <div className="text-xs text-ink/50">{d.className}</div>
                </div>
                <span className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold ${deadlineBadge(d.daysRemaining)}`}>
                  {deadlineLabel(d.daysRemaining)}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Per-class progress */}
      {classes.length > 0 && (
        <div className="rounded-[24px] border border-ink/10 bg-paper p-6 shadow-soft">
          <h3 className="mb-4 flex items-center gap-2 font-semibold">
            <Books size={18} weight="fill" className="text-moss" />
            {locale === "pl" ? "Postęp w klasach" : "Прогрес по класах"}
          </h3>
          <div className="space-y-4">
            {classes.map((cls) => {
              const pct = cls.totalAssignments > 0
                ? Math.round((cls.completedAssignments / cls.totalAssignments) * 100)
                : 0;
              return (
                <div key={cls._id}>
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <span className="text-sm font-medium">{cls.name}</span>
                      <span className="ml-2 text-xs text-ink/40">{cls.teacherName}</span>
                    </div>
                    <div className="flex shrink-0 items-center gap-3 text-xs text-ink/50">
                      <span>{cls.completedAssignments}/{cls.totalAssignments}</span>
                      {cls.myAverageGrade !== null && (
                        <span className={`font-semibold ${gradeColor(cls.myAverageGrade)}`}>
                          {cls.myAverageGrade}%
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-ink/10">
                    <div
                      className="h-full rounded-full bg-moss transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent grades */}
      {recentGrades.length > 0 && (
        <div className="rounded-[24px] border border-ink/10 bg-paper p-6 shadow-soft">
          <h3 className="mb-4 flex items-center gap-2 font-semibold">
            <Star size={18} weight="fill" className="text-gold" />
            {locale === "pl" ? "Ostatnie oceny" : "Останні оцінки"}
          </h3>
          <div className="space-y-2">
            {recentGrades.map((g) => (
              <Link
                key={g.assignmentId}
                href={`/classes/${g.classId}/assignments/${g.assignmentId}`}
                className="flex items-center gap-3 rounded-[16px] border border-ink/10 p-3 transition-colors hover:bg-ink/[0.02]"
              >
                <div className="flex-1 min-w-0">
                  <div className="truncate text-sm font-medium">{g.assignmentTitle}</div>
                  <div className="text-xs text-ink/50">{g.className}</div>
                </div>
                <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${gradeBg(g.percentage)}`}>
                  {g.percentage}%
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {classes.length === 0 && (
        <div className="rounded-[24px] border border-ink/10 bg-ink/5 p-12 text-center">
          <ChartBar size={48} weight="thin" className="mx-auto mb-4 text-ink/40" />
          <p className="text-ink/60">
            {locale === "pl" ? "Dołącz do klasy, aby zobaczyć swój postęp" : "Приєднайтесь до класу, щоб побачити свій прогрес"}
          </p>
        </div>
      )}
    </div>
  );
}
