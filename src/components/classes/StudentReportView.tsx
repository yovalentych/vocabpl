"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  ClipboardText,
  Calendar,
  ChartBar,
  Warning,
} from "@phosphor-icons/react";

interface Props {
  classId: string;
  studentId: string;
  locale: "uk" | "pl";
}

export default function StudentReportView({ classId, studentId, locale }: Props) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const t = locale === "uk" ? {
    back: "Назад до класу",
    report: "Звіт студента",
    stats: "Загальна статистика",
    assignments: "Завдання",
    attendance: "Відвідуваність",
    totalAssignments: "Всього завдань",
    submitted: "Здано",
    graded: "Оцінено",
    avgScore: "Середній бал",
    totalLessons: "Занять",
    attended: "Відвідано",
    attendanceRate: "Відвідуваність",
    joinedAt: "У класі з",
    noAssignments: "Немає завдань",
    noAttendance: "Немає записів відвідуваності",
    statuses: {
      not_started: "Не розпочато",
      in_progress: "В роботі",
      submitted: "Здано",
      graded: "Оцінено",
      present: "Присутній",
      absent: "Відсутній",
      late: "Запізнився",
      excused: "З причиною",
    },
  } : {
    back: "Powrót do klasy",
    report: "Raport ucznia",
    stats: "Ogólne statystyki",
    assignments: "Zadania",
    attendance: "Frekwencja",
    totalAssignments: "Wszystkich zadań",
    submitted: "Oddano",
    graded: "Oceniono",
    avgScore: "Średnia ocena",
    totalLessons: "Zajęć",
    attended: "Obecny",
    attendanceRate: "Frekwencja",
    joinedAt: "W klasie od",
    noAssignments: "Brak zadań",
    noAttendance: "Brak zapisów frekwencji",
    statuses: {
      not_started: "Nie rozpoczęto",
      in_progress: "W toku",
      submitted: "Oddano",
      graded: "Oceniono",
      present: "Obecny",
      absent: "Nieobecny",
      late: "Spóźniony",
      excused: "Usprawiedliwiony",
    },
  };

  useEffect(() => {
    fetch(`/api/classes/${classId}/students/${studentId}/report`)
      .then(r => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [classId, studentId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-ink/60">{locale === "uk" ? "Завантаження..." : "Ładowanie..."}</div>
      </div>
    );
  }

  if (!data || data.error) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-ink/60">{locale === "uk" ? "Дані не знайдено" : "Dane nie znalezione"}</div>
      </div>
    );
  }

  const { student, className, stats, assignments, attendance } = data;

  function assignmentStatusColor(status: string) {
    switch (status) {
      case "graded": return "bg-moss/10 text-moss border-moss/20";
      case "submitted": return "bg-blue-50 text-blue-600 border-blue-200";
      case "in_progress": return "bg-gold/10 text-gold border-gold/20";
      default: return "bg-ink/5 text-ink/40 border-ink/10";
    }
  }

  function attendanceStatusColor(status: string) {
    switch (status) {
      case "present": return "bg-moss/10 text-moss";
      case "absent": return "bg-terracotta/10 text-terracotta";
      case "late": return "bg-gold/10 text-gold";
      case "excused": return "bg-ink/10 text-ink/60";
      default: return "bg-ink/5 text-ink/40";
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-6 sm:p-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm">
        <Link
          href={`/classes/${classId}?tab=students`}
          className="flex items-center gap-1.5 text-ink/60 transition-colors hover:text-moss"
        >
          <ArrowLeft size={16} />
          <span>{t.back}</span>
        </Link>
        <span className="text-ink/30">/</span>
        <span className="font-medium">{student.name}</span>
      </nav>

      {/* Header */}
      <div className="relative overflow-hidden rounded-[32px] border border-ink/10 bg-gradient-to-br from-moss/10 to-terracotta/10 p-8 shadow-soft">
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gold/20 blur-3xl" />
        <div className="relative">
          <p className="text-xs uppercase tracking-[0.3em] text-ink/60">{t.report}</p>
          <h1 className="mt-2 text-3xl font-semibold">{student.name}</h1>
          <p className="mt-1 text-ink/60">@{student.username} · {className}</p>
          {student.joinedAt && (
            <p className="mt-1 text-sm text-ink/50">
              {t.joinedAt} {new Date(student.joinedAt).toLocaleDateString(locale === "uk" ? "uk-UA" : "pl-PL", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-[24px] border border-ink/10 bg-gradient-to-br from-moss/10 to-paper p-6 shadow-soft">
          <div className="mb-1 text-xs uppercase tracking-wider text-ink/60">{t.avgScore}</div>
          <div className={`text-3xl font-semibold ${
            stats.averageScore === null ? "text-ink/30" :
            stats.averageScore >= 80 ? "text-moss" :
            stats.averageScore >= 60 ? "text-gold" : "text-terracotta"
          }`}>
            {stats.averageScore !== null ? `${stats.averageScore}%` : "—"}
          </div>
          <div className="mt-1 text-xs text-ink/50">
            {stats.graded}/{stats.totalAssignments} {t.graded.toLowerCase()}
          </div>
        </div>

        <div className="rounded-[24px] border border-ink/10 bg-gradient-to-br from-terracotta/10 to-paper p-6 shadow-soft">
          <div className="mb-1 text-xs uppercase tracking-wider text-ink/60">{t.submitted}</div>
          <div className="text-3xl font-semibold text-terracotta">{stats.submitted}</div>
          <div className="mt-1 text-xs text-ink/50">{locale === "uk" ? "із" : "z"} {stats.totalAssignments}</div>
        </div>

        <div className="rounded-[24px] border border-ink/10 bg-gradient-to-br from-gold/10 to-paper p-6 shadow-soft">
          <div className="mb-1 text-xs uppercase tracking-wider text-ink/60">{t.attendanceRate}</div>
          <div className={`text-3xl font-semibold ${
            stats.attendanceRate === null ? "text-ink/30" :
            stats.attendanceRate >= 80 ? "text-moss" :
            stats.attendanceRate >= 60 ? "text-gold" : "text-terracotta"
          }`}>
            {stats.attendanceRate !== null ? `${stats.attendanceRate}%` : "—"}
          </div>
          <div className="mt-1 text-xs text-ink/50">
            {stats.attendedLessons}/{stats.totalLessons} {t.attended.toLowerCase()}
          </div>
        </div>

        <div className="rounded-[24px] border border-ink/10 bg-gradient-to-br from-moss/10 to-paper p-6 shadow-soft">
          <div className="mb-1 text-xs uppercase tracking-wider text-ink/60">{t.totalAssignments}</div>
          <div className="text-3xl font-semibold text-moss">{stats.totalAssignments}</div>
          <div className="mt-1 text-xs text-ink/50">{t.graded}: {stats.graded}</div>
        </div>
      </div>

      {/* Assignments */}
      <div className="rounded-[24px] border border-ink/10 bg-paper p-6 shadow-soft">
        <div className="mb-4 flex items-center gap-2">
          <ClipboardText size={20} weight="fill" className="text-moss" />
          <h2 className="font-semibold">{t.assignments}</h2>
        </div>

        {assignments.length === 0 ? (
          <p className="text-sm text-ink/50">{t.noAssignments}</p>
        ) : (
          <div className="space-y-2">
            {assignments.map((a: any) => (
              <div
                key={a.id}
                className="flex items-center justify-between rounded-[16px] border border-ink/10 bg-ink/5 px-4 py-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="truncate font-medium text-sm">{a.title}</div>
                  {a.dueDate && (
                    <div className="text-xs text-ink/50 mt-0.5">
                      {locale === "uk" ? "Дедлайн:" : "Termin:"} {new Date(a.dueDate).toLocaleDateString(locale === "uk" ? "uk-UA" : "pl-PL")}
                    </div>
                  )}
                </div>
                <div className="ml-3 flex items-center gap-2 shrink-0">
                  {a.status === "graded" && a.percentage !== undefined && (
                    <span className={`text-sm font-semibold ${
                      a.percentage >= 80 ? "text-moss" :
                      a.percentage >= 60 ? "text-gold" : "text-terracotta"
                    }`}>
                      {a.percentage}%
                    </span>
                  )}
                  <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${assignmentStatusColor(a.status)}`}>
                    {t.statuses[a.status as keyof typeof t.statuses] || a.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Attendance */}
      <div className="rounded-[24px] border border-ink/10 bg-paper p-6 shadow-soft">
        <div className="mb-4 flex items-center gap-2">
          <Calendar size={20} weight="fill" className="text-moss" />
          <h2 className="font-semibold">{t.attendance}</h2>
        </div>

        {attendance.length === 0 ? (
          <p className="text-sm text-ink/50">{t.noAttendance}</p>
        ) : (
          <div className="space-y-2">
            {attendance.map((a: any, idx: number) => (
              <div
                key={idx}
                className="flex items-center justify-between rounded-[16px] border border-ink/10 bg-ink/5 px-4 py-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="truncate font-medium text-sm">{a.eventTitle}</div>
                  <div className="text-xs text-ink/50 mt-0.5">
                    {new Date(a.date).toLocaleDateString(locale === "uk" ? "uk-UA" : "pl-PL", {
                      weekday: "short", day: "numeric", month: "long"
                    })}
                  </div>
                </div>
                <div className="ml-3 flex items-center gap-2 shrink-0">
                  {a.note && (
                    <span className="text-xs text-ink/50 italic max-w-[120px] truncate">{a.note}</span>
                  )}
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${attendanceStatusColor(a.status)}`}>
                    {t.statuses[a.status as keyof typeof t.statuses] || a.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
