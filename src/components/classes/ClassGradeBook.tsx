"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowSquareOut } from "@phosphor-icons/react";

interface Props {
  classId: string;
  locale: "uk" | "pl";
}

type GradeStatus = "not_started" | "in_progress" | "submitted" | "graded";

interface GradeCell {
  status: GradeStatus;
  score?: number;
  percentage?: number;
  submittedAt?: Date;
}

interface GradeBook {
  students: { id: string; name: string; username: string }[];
  assignments: { id: string; title: string; maxScore?: number; dueDate?: Date }[];
  grades: Record<string, Record<string, GradeCell>>;
}

function cellBg(cell: GradeCell): string {
  if (cell.status === "not_started") return "bg-ink/5 text-ink/40";
  if (cell.status === "in_progress") return "bg-gold/10 text-gold";
  if (cell.status === "submitted") return "bg-blue-50 text-blue-600";
  if (cell.status === "graded") {
    const p = cell.percentage ?? 0;
    if (p >= 80) return "bg-moss/15 text-moss font-semibold";
    if (p >= 60) return "bg-gold/15 text-gold font-semibold";
    return "bg-terracotta/15 text-terracotta font-semibold";
  }
  return "";
}

function avgForStudent(
  studentId: string,
  assignments: GradeBook["assignments"],
  grades: GradeBook["grades"]
): number | null {
  const graded = assignments.filter(a => grades[studentId]?.[a.id]?.status === "graded");
  if (graded.length === 0) return null;
  return Math.round(
    graded.reduce((sum, a) => sum + (grades[studentId][a.id].percentage ?? 0), 0) / graded.length
  );
}

function avgForAssignment(
  assignmentId: string,
  students: GradeBook["students"],
  grades: GradeBook["grades"]
): number | null {
  const graded = students.filter(s => grades[s.id]?.[assignmentId]?.status === "graded");
  if (graded.length === 0) return null;
  return Math.round(
    graded.reduce((sum, s) => sum + (grades[s.id][assignmentId].percentage ?? 0), 0) / graded.length
  );
}

export default function ClassGradeBook({ classId, locale }: Props) {
  const [data, setData] = useState<GradeBook | null>(null);
  const [loading, setLoading] = useState(true);

  const t = locale === "uk" ? {
    title: "Журнал оцінок",
    student: "Студент",
    average: "Середня",
    notStarted: "—",
    inProgress: "В роботі",
    submitted: "Здано",
    noData: "Немає завдань або студентів у класі",
    report: "Звіт",
  } : {
    title: "Dziennik ocen",
    student: "Uczeń",
    average: "Średnia",
    notStarted: "—",
    inProgress: "W toku",
    submitted: "Oddano",
    noData: "Brak zadań lub uczniów w klasie",
    report: "Raport",
  };

  useEffect(() => {
    fetch(`/api/classes/${classId}/gradebook`)
      .then(r => r.json())
      .then(d => setData(d))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [classId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-ink/60">{locale === "uk" ? "Завантаження..." : "Ładowanie..."}</div>
      </div>
    );
  }

  if (!data || data.students.length === 0 || data.assignments.length === 0) {
    return (
      <div className="rounded-[24px] border border-ink/10 bg-ink/5 p-12 text-center">
        <p className="text-ink/60">{t.noData}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">{t.title}</h2>
        <div className="flex items-center gap-3 text-xs text-ink/50">
          <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-moss/30" /> ≥80%</span>
          <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-gold/30" /> 60–79%</span>
          <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-terracotta/30" /> &lt;60%</span>
        </div>
      </div>

      <div className="overflow-x-auto rounded-[24px] border border-ink/10 shadow-soft">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-ink/10 bg-ink/5">
              {/* Student column */}
              <th className="sticky left-0 z-10 bg-ink/5 px-4 py-3 text-left font-semibold min-w-[160px]">
                {t.student}
              </th>
              {/* Assignment columns */}
              {data.assignments.map(a => (
                <th key={a.id} className="px-3 py-3 text-center font-semibold min-w-[90px] max-w-[120px]">
                  <div className="truncate" title={a.title}>{a.title}</div>
                  {a.dueDate && (
                    <div className="text-xs font-normal text-ink/40 mt-0.5">
                      {new Date(a.dueDate).toLocaleDateString(locale === "uk" ? "uk-UA" : "pl-PL", { day: "numeric", month: "short" })}
                    </div>
                  )}
                </th>
              ))}
              {/* Average column */}
              <th className="px-4 py-3 text-center font-semibold bg-moss/5 min-w-[80px]">
                {t.average}
              </th>
              {/* Report link */}
              <th className="px-3 py-3 text-center font-semibold min-w-[70px]"></th>
            </tr>
          </thead>

          <tbody>
            {data.students.map((student, idx) => {
              const avg = avgForStudent(student.id, data.assignments, data.grades);
              return (
                <tr
                  key={student.id}
                  className={`border-b border-ink/10 transition-colors hover:bg-ink/5 ${
                    idx % 2 === 0 ? "bg-paper" : "bg-ink/[0.02]"
                  }`}
                >
                  {/* Student name */}
                  <td className="sticky left-0 z-10 bg-inherit px-4 py-3">
                    <div className="font-medium truncate max-w-[150px]" title={student.name}>
                      {student.name}
                    </div>
                    <div className="text-xs text-ink/40">@{student.username}</div>
                  </td>

                  {/* Grade cells */}
                  {data.assignments.map(a => {
                    const cell = data.grades[student.id]?.[a.id] || { status: "not_started" };
                    return (
                      <td key={a.id} className="px-2 py-2 text-center">
                        <span className={`inline-block rounded-[8px] px-2 py-1 text-xs ${cellBg(cell)}`}>
                          {cell.status === "graded" && cell.percentage !== undefined
                            ? `${cell.percentage}%`
                            : cell.status === "submitted"
                              ? t.submitted
                              : cell.status === "in_progress"
                                ? t.inProgress
                                : t.notStarted}
                        </span>
                      </td>
                    );
                  })}

                  {/* Average */}
                  <td className="px-4 py-3 text-center bg-moss/[0.03]">
                    <span className={`font-semibold ${
                      avg === null ? "text-ink/30" :
                      avg >= 80 ? "text-moss" :
                      avg >= 60 ? "text-gold" : "text-terracotta"
                    }`}>
                      {avg !== null ? `${avg}%` : "—"}
                    </span>
                  </td>

                  {/* View report */}
                  <td className="px-3 py-3 text-center">
                    <Link
                      href={`/classes/${classId}/students/${student.id}` as any}
                      className="inline-flex items-center gap-1 rounded-full border border-ink/10 px-2.5 py-1 text-xs text-ink/60 transition-all hover:bg-moss/10 hover:text-moss hover:border-moss/20"
                    >
                      <ArrowSquareOut size={12} />
                      {t.report}
                    </Link>
                  </td>
                </tr>
              );
            })}

            {/* Averages row */}
            <tr className="border-t-2 border-ink/10 bg-ink/5 font-semibold">
              <td className="sticky left-0 z-10 bg-ink/5 px-4 py-3 text-ink/60 text-xs uppercase tracking-wider">
                {t.average}
              </td>
              {data.assignments.map(a => {
                const avg = avgForAssignment(a.id, data.students, data.grades);
                return (
                  <td key={a.id} className="px-2 py-3 text-center">
                    <span className={
                      avg === null ? "text-ink/30" :
                      avg >= 80 ? "text-moss" :
                      avg >= 60 ? "text-gold" : "text-terracotta"
                    }>
                      {avg !== null ? `${avg}%` : "—"}
                    </span>
                  </td>
                );
              })}
              <td className="px-4 py-3 bg-moss/[0.03]" />
              <td />
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
