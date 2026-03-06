"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { csrfFetch } from "@/lib/csrf-client";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import {
  ArrowLeft,
  ClipboardText,
  Calendar,
  ChatCircle,
  ArrowRight,
} from "@phosphor-icons/react";

interface Props {
  classId: string;
  studentId: string;
  locale: "uk" | "pl";
}

export default function StudentReportView({ classId, studentId, locale }: Props) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [startingChat, setStartingChat] = useState(false);

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
    message: "Написати повідомлення",
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
    message: "Napisz wiadomość",
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

  async function handleStartChat() {
    setStartingChat(true);
    try {
      const res = await csrfFetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientId: studentId }),
      });
      if (res.ok) {
        const data = await res.json();
        window.location.href = `/messages?conversation=${data.conversationId}`;
      }
    } catch {
      setStartingChat(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-moss border-t-transparent" />
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
      {/* Breadcrumbs */}
      <Breadcrumbs items={[
        { label: locale === "uk" ? "Школа" : "Szkoła", href: "/school" },
        { label: locale === "uk" ? "Класи" : "Klasy", href: "/school?tab=classes" },
        { label: className, href: `/classes/${classId}` },
        { label: locale === "uk" ? "Студенти" : "Uczniowie", href: `/classes/${classId}?tab=students` },
        { label: student.name },
      ]} />

      {/* Header */}
      <div className="relative overflow-hidden rounded-[32px] border border-ink/10 bg-gradient-to-br from-moss/10 to-terracotta/10 p-8 shadow-soft">
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gold/20 blur-3xl" />
        <div className="relative flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-ink/60">{t.report}</p>
            <h1 className="mt-2 text-3xl font-semibold">{student.name}</h1>
            <p className="mt-1 text-ink/60">@{student.username} · {className}</p>
            {student.joinedAt && (
              <p className="mt-1 text-sm text-ink/50">
                {t.joinedAt} {new Date(student.joinedAt).toLocaleDateString(locale === "uk" ? "uk-UA" : "pl-PL", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            )}
          </div>
          <button
            onClick={handleStartChat}
            disabled={startingChat}
            className="shrink-0 flex items-center gap-2 rounded-full border border-moss/20 bg-moss/10 px-4 py-2 text-sm font-medium text-moss transition-all hover:bg-moss/20 disabled:opacity-50"
          >
            <ChatCircle size={18} weight="fill" />
            <span className="hidden sm:inline">{t.message}</span>
          </button>
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

      {/* Progress bar */}
      {stats.totalAssignments > 0 && (
        <div className="rounded-[24px] border border-ink/10 bg-paper p-6 shadow-soft">
          <div className="mb-3 flex items-center justify-between text-sm">
            <span className="text-ink/60">{locale === "uk" ? "Виконання завдань" : "Postęp zadań"}</span>
            <span className="font-semibold">{stats.submitted}/{stats.totalAssignments}</span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-ink/10">
            <div
              className="h-full rounded-full bg-moss transition-all duration-500"
              style={{ width: `${Math.round((stats.submitted / stats.totalAssignments) * 100)}%` }}
            />
          </div>
          {stats.graded > 0 && (
            <div className="mt-2 text-xs text-ink/50">
              {locale === "uk" ? "Оцінено:" : "Oceniono:"} {stats.graded}
            </div>
          )}
        </div>
      )}

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
              <Link
                key={a.id}
                href={`/classes/${classId}/assignments/${a.id}`}
                className="flex items-center justify-between rounded-[16px] border border-ink/10 bg-ink/5 px-4 py-3 transition-all hover:shadow-soft hover:border-ink/20"
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
                  <ArrowRight size={14} className="text-ink/30" />
                </div>
              </Link>
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
