"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  CalendarCheck,
  Warning,
  CheckCircle,
  XCircle,
  Clock,
  MinusCircle,
  Question,
} from "@phosphor-icons/react";

interface Student {
  id: string;
  name: string;
  username: string;
}

interface Lesson {
  recordId: string;
  eventId: string;
  eventTitle: string;
  date: string;
  conducted: boolean;
  notes: string;
  studentStatuses: Record<string, { status: string; note?: string }>;
  presentCount: number;
  totalStudents: number;
}

interface StudentStat {
  studentId: string;
  name: string;
  username: string;
  present: number;
  absent: number;
  late: number;
  excused: number;
  noRecord: number;
  total: number;
  rate: number | null;
}

interface Props {
  classId: string;
  locale: "uk" | "pl";
}

const STATUS_ICONS: Record<string, { icon: React.ReactNode; label: { uk: string; pl: string }; color: string }> = {
  present: {
    icon: <CheckCircle size={16} weight="fill" />,
    label: { uk: "Присутній", pl: "Obecny" },
    color: "text-moss",
  },
  absent: {
    icon: <XCircle size={16} weight="fill" />,
    label: { uk: "Відсутній", pl: "Nieobecny" },
    color: "text-terracotta",
  },
  late: {
    icon: <Clock size={16} weight="fill" />,
    label: { uk: "Запізнився", pl: "Spóźniony" },
    color: "text-gold",
  },
  excused: {
    icon: <MinusCircle size={16} weight="fill" />,
    label: { uk: "З причиною", pl: "Usprawiedliwiony" },
    color: "text-ink/50",
  },
};

export default function AttendanceReport({ classId, locale }: Props) {
  const [data, setData] = useState<{ students: Student[]; lessons: Lesson[]; studentStats: StudentStat[] } | null>(null);
  const [loading, setLoading] = useState(true);

  const t = {
    title: locale === "uk" ? "Звіт відвідуваності" : "Raport frekwencji",
    noRecords: locale === "uk" ? "Записів відвідуваності ще немає" : "Brak zapisów frekwencji",
    noRecordsSub: locale === "uk"
      ? "Відмічайте присутність під час занять у розкладі"
      : "Oznaczaj obecność podczas zajęć w harmonogramie",
    student: locale === "uk" ? "Студент" : "Uczeń",
    total: locale === "uk" ? "Разом" : "Razem",
    rate: locale === "uk" ? "%" : "%",
    summaryTitle: locale === "uk" ? "Підсумок по студентах" : "Podsumowanie uczniów",
    matrixTitle: locale === "uk" ? "Матриця занять" : "Macierz zajęć",
    conducted: locale === "uk" ? "Проведено" : "Przeprowadzono",
    notConducted: locale === "uk" ? "Не проведено" : "Nie przeprowadzono",
  };

  useEffect(() => {
    fetch(`/api/classes/${classId}/attendance-report`)
      .then((r) => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [classId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-moss border-t-transparent" />
      </div>
    );
  }

  if (!data || data.lessons.length === 0) {
    return (
      <div className="rounded-[24px] border border-ink/10 bg-ink/5 p-12 text-center">
        <CalendarCheck size={48} weight="thin" className="mx-auto mb-4 text-ink/40" />
        <p className="font-medium text-ink/60">{t.noRecords}</p>
        <p className="mt-1 text-sm text-ink/40">{t.noRecordsSub}</p>
      </div>
    );
  }

  const { students, lessons, studentStats } = data;

  function rateColor(rate: number | null) {
    if (rate === null) return "text-ink/30";
    if (rate >= 80) return "text-moss";
    if (rate >= 60) return "text-gold";
    return "text-terracotta";
  }

  function rateBg(rate: number | null) {
    if (rate === null) return "bg-ink/5 text-ink/30";
    if (rate >= 80) return "bg-moss/10 text-moss border-moss/20";
    if (rate >= 60) return "bg-gold/10 text-gold border-gold/20";
    return "bg-terracotta/10 text-terracotta border-terracotta/20";
  }

  function cellColor(status: string | undefined) {
    if (!status) return "bg-ink/5";
    switch (status) {
      case "present": return "bg-moss/15";
      case "absent": return "bg-terracotta/15";
      case "late": return "bg-gold/15";
      case "excused": return "bg-ink/10";
      default: return "bg-ink/5";
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <CalendarCheck size={24} weight="fill" className="text-moss" />
        <div>
          <h2 className="text-xl font-semibold">{t.title}</h2>
          <p className="text-sm text-ink/60">
            {locale === "uk"
              ? `${lessons.length} занять · ${students.length} студентів`
              : `${lessons.length} zajęć · ${students.length} uczniów`}
          </p>
        </div>
      </div>

      {/* Student summary cards */}
      <div>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-ink/50">{t.summaryTitle}</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {studentStats.map((s) => (
            <Link
              key={s.studentId}
              href={`/classes/${classId}/students/${s.studentId}` as any}
              className="flex items-center justify-between rounded-[20px] border border-ink/10 bg-paper p-4 shadow-soft transition-all hover:shadow-md hover:border-ink/20"
            >
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{s.name}</div>
                <div className="mt-1 flex items-center gap-3 text-xs text-ink/50">
                  <span className="flex items-center gap-1 text-moss">
                    <CheckCircle size={12} weight="fill" />
                    {s.present + s.late}
                  </span>
                  <span className="flex items-center gap-1 text-terracotta">
                    <XCircle size={12} weight="fill" />
                    {s.absent}
                  </span>
                  {s.late > 0 && (
                    <span className="flex items-center gap-1 text-gold">
                      <Clock size={12} weight="fill" />
                      {s.late}
                    </span>
                  )}
                </div>
              </div>
              <div className={`ml-3 shrink-0 rounded-full border px-3 py-1 text-sm font-bold ${rateBg(s.rate)}`}>
                {s.rate !== null ? `${s.rate}%` : "—"}
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Attendance matrix */}
      <div>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-ink/50">{t.matrixTitle}</h3>
        <div className="overflow-x-auto rounded-[24px] border border-ink/10 bg-paper shadow-soft">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink/10">
                <th className="sticky left-0 z-10 min-w-[160px] bg-paper px-4 py-3 text-left font-semibold text-ink/70">
                  {t.student}
                </th>
                {lessons.map((lesson) => (
                  <th
                    key={lesson.recordId}
                    className="min-w-[90px] px-2 py-3 text-center font-medium text-ink/60"
                    title={lesson.eventTitle}
                  >
                    <div className="truncate text-xs font-semibold max-w-[80px] mx-auto">
                      {new Date(lesson.date).toLocaleDateString(
                        locale === "uk" ? "uk-UA" : "pl-PL",
                        { day: "numeric", month: "short" }
                      )}
                    </div>
                    <div className="mt-0.5 truncate text-[10px] text-ink/40 max-w-[80px] mx-auto">
                      {lesson.eventTitle}
                    </div>
                    <div className="mt-1 text-[10px] text-ink/40">
                      {lesson.presentCount}/{lesson.totalStudents}
                    </div>
                  </th>
                ))}
                <th className="min-w-[70px] px-3 py-3 text-center font-semibold text-ink/70">
                  {t.rate}
                </th>
              </tr>
            </thead>
            <tbody>
              {students.map((student, idx) => {
                const stat = studentStats.find((s) => s.studentId === student.id);
                return (
                  <tr
                    key={student.id}
                    className={`border-b border-ink/5 last:border-0 ${idx % 2 === 0 ? "" : "bg-ink/[0.02]"}`}
                  >
                    <td className="sticky left-0 z-10 bg-paper px-4 py-3">
                      <div className="font-medium">{student.name}</div>
                      <div className="text-xs text-ink/40">@{student.username}</div>
                    </td>
                    {lessons.map((lesson) => {
                      const entry = lesson.studentStatuses[student.id];
                      const statusInfo = entry ? STATUS_ICONS[entry.status] : null;
                      return (
                        <td
                          key={lesson.recordId}
                          className={`px-2 py-3 text-center ${cellColor(entry?.status)}`}
                          title={
                            statusInfo
                              ? `${statusInfo.label[locale]}${entry?.note ? `: ${entry.note}` : ""}`
                              : locale === "uk" ? "Немає даних" : "Brak danych"
                          }
                        >
                          {statusInfo ? (
                            <span className={`flex justify-center ${statusInfo.color}`}>
                              {statusInfo.icon}
                            </span>
                          ) : (
                            <span className="flex justify-center text-ink/20">
                              <Question size={14} />
                            </span>
                          )}
                        </td>
                      );
                    })}
                    <td className="px-3 py-3 text-center">
                      <span className={`text-sm font-bold ${rateColor(stat?.rate ?? null)}`}>
                        {stat?.rate !== null && stat?.rate !== undefined ? `${stat.rate}%` : "—"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="mt-3 flex flex-wrap gap-4 text-xs text-ink/50">
          {Object.entries(STATUS_ICONS).map(([key, val]) => (
            <span key={key} className={`flex items-center gap-1 ${val.color}`}>
              {val.icon}
              {val.label[locale]}
            </span>
          ))}
          <span className="flex items-center gap-1 text-ink/30">
            <Question size={14} />
            {locale === "uk" ? "Не відмічено" : "Brak wpisu"}
          </span>
        </div>
      </div>
    </div>
  );
}
