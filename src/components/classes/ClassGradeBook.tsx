"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  ArrowSquareOut,
  DownloadSimple,
  Check,
  X,
  PencilSimple,
} from "@phosphor-icons/react";
import { csrfFetch } from "@/lib/csrf-client";

interface Props {
  classId: string;
  locale: "uk" | "pl";
}

type GradeStatus = "not_started" | "in_progress" | "submitted" | "graded";
type SortKey = "name_asc" | "name_desc" | "avg_asc" | "avg_desc";
type FilterKey = "all" | "submitted" | "needs_grading";

interface GradeCell {
  status: GradeStatus;
  score?: number;
  percentage?: number;
  submittedAt?: string;
  submissionId?: string;
}

interface GradeBook {
  students: { id: string; name: string; username: string }[];
  assignments: { id: string; title: string; maxScore?: number; dueDate?: string }[];
  grades: Record<string, Record<string, GradeCell>>;
}

interface EditState {
  studentId: string;
  assignmentId: string;
  submissionId: string;
  maxScore: number;
  currentScore: string;
}

function avgForStudent(
  studentId: string,
  assignments: GradeBook["assignments"],
  grades: GradeBook["grades"]
): number | null {
  const graded = assignments.filter(a => grades[studentId]?.[a.id]?.status === "graded");
  if (!graded.length) return null;
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
  if (!graded.length) return null;
  return Math.round(
    graded.reduce((sum, s) => sum + (grades[s.id][assignmentId].percentage ?? 0), 0) / graded.length
  );
}

function scoreColor(pct: number | null | undefined): string {
  if (pct === null || pct === undefined) return "text-ink/30";
  if (pct >= 80) return "text-moss";
  if (pct >= 60) return "text-gold";
  return "text-terracotta";
}

function scoreBg(pct: number | null | undefined): string {
  if (pct === null || pct === undefined) return "bg-ink/5 text-ink/40";
  if (pct >= 80) return "bg-moss/15 text-moss font-semibold";
  if (pct >= 60) return "bg-gold/15 text-gold font-semibold";
  return "bg-terracotta/15 text-terracotta font-semibold";
}

export default function ClassGradeBook({ classId, locale }: Props) {
  const [data, setData] = useState<GradeBook | null>(null);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<SortKey>("name_asc");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [editState, setEditState] = useState<EditState | null>(null);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const t = locale === "uk"
    ? {
        title: "Журнал оцінок",
        student: "Студент",
        average: "Середня",
        notStarted: "—",
        inProgress: "В роботі",
        submitted: "Здано",
        noData: "Немає завдань або студентів у класі",
        report: "Профіль",
        export: "CSV",
        sortName: "За іменем",
        sortAvg: "За оцінкою",
        filterAll: "Всі студенти",
        filterSubmitted: "Є здані",
        filterNeeds: "Потрібна оцінка",
        statsStudents: "Студентів",
        statsAvg: "Середня оцінка",
        statsSubmitted: "Здано (очікують)",
        statsGraded: "Оцінено",
        of: "з",
        clickToGrade: "Натисніть для оцінки",
      }
    : {
        title: "Dziennik ocen",
        student: "Uczeń",
        average: "Średnia",
        notStarted: "—",
        inProgress: "W toku",
        submitted: "Oddano",
        noData: "Brak zadań lub uczniów w klasie",
        report: "Profil",
        export: "CSV",
        sortName: "Po nazwie",
        sortAvg: "Po ocenie",
        filterAll: "Wszyscy",
        filterSubmitted: "Oddano",
        filterNeeds: "Do oceny",
        statsStudents: "Uczniów",
        statsAvg: "Średnia ocena",
        statsSubmitted: "Oddano (czeka)",
        statsGraded: "Oceniono",
        of: "z",
        clickToGrade: "Kliknij, aby ocenić",
      };

  useEffect(() => {
    fetch(`/api/classes/${classId}/gradebook`)
      .then(r => r.json())
      .then(d => setData(d))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [classId]);

  useEffect(() => {
    if (editState) inputRef.current?.focus();
  }, [editState?.studentId, editState?.assignmentId]);

  async function saveGrade() {
    if (!editState || !data) return;
    const score = parseFloat(editState.currentScore);
    if (isNaN(score) || score < 0) return;
    setSaving(true);
    try {
      const res = await csrfFetch(`/api/classes/${classId}/gradebook`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionId: editState.submissionId, score }),
      });
      if (!res.ok) return;
      const result = await res.json();
      setData(prev => {
        if (!prev) return prev;
        const newGrades = { ...prev.grades };
        newGrades[editState.studentId] = { ...newGrades[editState.studentId] };
        newGrades[editState.studentId][editState.assignmentId] = {
          ...newGrades[editState.studentId][editState.assignmentId],
          status: "graded",
          score: result.score,
          percentage: result.percentage,
        };
        return { ...prev, grades: newGrades };
      });
      setEditState(null);
    } finally {
      setSaving(false);
    }
  }

  function startEdit(studentId: string, assignment: GradeBook["assignments"][0], cell: GradeCell) {
    if (!cell.submissionId) return;
    setEditState({
      studentId,
      assignmentId: assignment.id,
      submissionId: cell.submissionId,
      maxScore: assignment.maxScore ?? 100,
      currentScore: cell.score !== undefined ? String(cell.score) : "",
    });
  }

  function exportCsv() {
    if (!data) return;
    const headers = [t.student, ...data.assignments.map(a => a.title), t.average];
    const rows = data.students.map(s => {
      const avg = avgForStudent(s.id, data.assignments, data.grades);
      const scores = data.assignments.map(a => {
        const cell = data.grades[s.id]?.[a.id];
        if (!cell || cell.status === "not_started") return "";
        if (cell.status === "graded") {
          return cell.percentage !== undefined ? `${cell.percentage}%` : (cell.score !== undefined ? String(cell.score) : "");
        }
        return cell.status;
      });
      return [s.name, ...scores, avg !== null ? `${avg}%` : ""];
    });
    const csv = [headers, ...rows]
      .map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `gradebook_${classId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-moss border-t-transparent" />
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

  // Stats
  let totalSubmittedCells = 0;
  let totalGradedCells = 0;
  let percentageSum = 0;
  for (const s of data.students) {
    for (const a of data.assignments) {
      const cell = data.grades[s.id]?.[a.id];
      if (!cell) continue;
      if (cell.status === "submitted") totalSubmittedCells++;
      if (cell.status === "graded") {
        totalGradedCells++;
        percentageSum += cell.percentage ?? 0;
      }
    }
  }
  const classAvg = totalGradedCells > 0 ? Math.round(percentageSum / totalGradedCells) : null;

  // Sort
  const sortedStudents = [...data.students].sort((a, b) => {
    if (sort === "name_asc") return a.name.localeCompare(b.name);
    if (sort === "name_desc") return b.name.localeCompare(a.name);
    const avgA = avgForStudent(a.id, data.assignments, data.grades) ?? -1;
    const avgB = avgForStudent(b.id, data.assignments, data.grades) ?? -1;
    if (sort === "avg_asc") return avgA - avgB;
    return avgB - avgA;
  });

  // Filter
  const filteredStudents = sortedStudents.filter(s => {
    if (filter === "all") return true;
    if (filter === "submitted") return data.assignments.some(a =>
      ["submitted", "graded"].includes(data.grades[s.id]?.[a.id]?.status ?? "")
    );
    if (filter === "needs_grading") return data.assignments.some(a =>
      data.grades[s.id]?.[a.id]?.status === "submitted"
    );
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">{t.title}</h2>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={sort}
            onChange={e => setSort(e.target.value as SortKey)}
            className="rounded-xl border border-ink/15 bg-paper px-3 py-1.5 text-sm text-ink/70 focus:outline-none"
          >
            <option value="name_asc">{t.sortName} ↑</option>
            <option value="name_desc">{t.sortName} ↓</option>
            <option value="avg_desc">{t.sortAvg} ↓</option>
            <option value="avg_asc">{t.sortAvg} ↑</option>
          </select>
          <select
            value={filter}
            onChange={e => setFilter(e.target.value as FilterKey)}
            className="rounded-xl border border-ink/15 bg-paper px-3 py-1.5 text-sm text-ink/70 focus:outline-none"
          >
            <option value="all">{t.filterAll}</option>
            <option value="submitted">{t.filterSubmitted}</option>
            <option value="needs_grading">{t.filterNeeds}</option>
          </select>
          <button
            onClick={exportCsv}
            className="inline-flex items-center gap-1.5 rounded-xl border border-ink/15 px-3 py-1.5 text-sm text-ink/70 transition-colors hover:bg-ink/5"
          >
            <DownloadSimple size={15} weight="bold" />
            {t.export}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: t.statsStudents, value: data.students.length, color: "text-ink" },
          { label: t.statsAvg, value: classAvg !== null ? `${classAvg}%` : "—", color: scoreColor(classAvg) },
          { label: t.statsSubmitted, value: totalSubmittedCells, color: "text-sky-500" },
          { label: t.statsGraded, value: totalGradedCells, color: "text-moss" },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-2xl border border-ink/10 bg-paper p-4 shadow-soft">
            <div className={`text-2xl font-bold ${color}`}>{value}</div>
            <div className="mt-0.5 text-xs text-ink/50">{label}</div>
          </div>
        ))}
      </div>

      {/* Legend + hint */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink/50">
        <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-moss/30" /> ≥80%</span>
        <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-gold/30" /> 60–79%</span>
        <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-terracotta/30" /> &lt;60%</span>
        <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-sky-100" /> {t.submitted}</span>
        <span className="ml-auto italic text-ink/35">{t.clickToGrade}</span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-[24px] border border-ink/10 shadow-soft">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-ink/10 bg-ink/[0.03]">
              <th className="sticky left-0 z-10 bg-ink/[0.03] px-4 py-3 text-left font-semibold min-w-[160px]">
                {t.student}
              </th>
              {data.assignments.map(a => (
                <th key={a.id} className="px-3 py-3 text-center font-medium min-w-[90px] max-w-[120px]">
                  <div className="truncate text-xs font-semibold" title={a.title}>{a.title}</div>
                  {a.maxScore && (
                    <div className="text-[10px] font-normal text-ink/40 mt-0.5">{t.of} {a.maxScore}</div>
                  )}
                  {a.dueDate && (
                    <div className="text-[10px] font-normal text-ink/35 mt-0.5">
                      {new Date(a.dueDate).toLocaleDateString(locale === "uk" ? "uk-UA" : "pl-PL", { day: "numeric", month: "short" })}
                    </div>
                  )}
                </th>
              ))}
              <th className="px-4 py-3 text-center font-semibold bg-moss/[0.05] min-w-[80px]">
                {t.average}
              </th>
              <th className="px-3 py-3 min-w-[70px]" />
            </tr>
          </thead>

          <tbody>
            {filteredStudents.map((student, idx) => {
              const avg = avgForStudent(student.id, data.assignments, data.grades);
              return (
                <tr
                  key={student.id}
                  className={`border-b border-ink/10 transition-colors hover:bg-ink/[0.02] ${
                    idx % 2 === 0 ? "bg-paper" : "bg-ink/[0.015]"
                  }`}
                >
                  {/* Student */}
                  <td className="sticky left-0 z-10 bg-inherit px-4 py-3">
                    <div className="font-medium truncate max-w-[150px]" title={student.name}>
                      {student.name}
                    </div>
                    <div className="text-xs text-ink/40">@{student.username}</div>
                  </td>

                  {/* Grade cells */}
                  {data.assignments.map(a => {
                    const cell = data.grades[student.id]?.[a.id] || { status: "not_started" as GradeStatus };
                    const isEditing = editState?.studentId === student.id && editState?.assignmentId === a.id;
                    const canEdit = (cell.status === "submitted" || cell.status === "graded") && !!cell.submissionId;

                    if (isEditing) {
                      return (
                        <td key={a.id} className="px-2 py-2 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <input
                              ref={inputRef}
                              type="number"
                              min={0}
                              max={editState.maxScore}
                              value={editState.currentScore}
                              onChange={e => setEditState(prev => prev ? { ...prev, currentScore: e.target.value } : null)}
                              onKeyDown={e => {
                                if (e.key === "Enter") saveGrade();
                                if (e.key === "Escape") setEditState(null);
                              }}
                              className="w-14 rounded-lg border border-moss/40 bg-moss/5 px-2 py-1 text-center text-xs font-semibold text-moss focus:outline-none focus:ring-1 focus:ring-moss/40"
                              placeholder="0"
                            />
                            {editState.maxScore !== 100 && (
                              <span className="text-xs text-ink/40">/{editState.maxScore}</span>
                            )}
                            <button
                              onClick={saveGrade}
                              disabled={saving}
                              className="rounded-lg bg-moss p-1 text-paper transition-colors hover:bg-moss/90 disabled:opacity-50"
                            >
                              <Check size={11} weight="bold" />
                            </button>
                            <button
                              onClick={() => setEditState(null)}
                              className="rounded-lg border border-ink/10 p-1 text-ink/50 transition-colors hover:bg-ink/5"
                            >
                              <X size={11} weight="bold" />
                            </button>
                          </div>
                        </td>
                      );
                    }

                    return (
                      <td key={a.id} className="px-2 py-2 text-center">
                        {canEdit ? (
                          <button
                            onClick={() => startEdit(student.id, a, cell)}
                            className={`group inline-flex items-center gap-1 rounded-[8px] px-2 py-1 text-xs transition-all ${
                              cell.status === "graded"
                                ? scoreBg(cell.percentage)
                                : "bg-sky-50 text-sky-600 hover:bg-sky-100"
                            }`}
                            title={t.clickToGrade}
                          >
                            {cell.status === "graded" && cell.percentage !== undefined
                              ? `${cell.percentage}%`
                              : t.submitted}
                            <PencilSimple size={9} className="opacity-0 group-hover:opacity-60" weight="bold" />
                          </button>
                        ) : (
                          <span className={`inline-block rounded-[8px] px-2 py-1 text-xs ${
                            cell.status === "in_progress"
                              ? "bg-gold/10 text-gold"
                              : "bg-ink/5 text-ink/30"
                          }`}>
                            {cell.status === "in_progress" ? t.inProgress : t.notStarted}
                          </span>
                        )}
                      </td>
                    );
                  })}

                  {/* Average */}
                  <td className="px-4 py-3 text-center bg-moss/[0.02]">
                    <span className={`font-semibold ${scoreColor(avg)}`}>
                      {avg !== null ? `${avg}%` : "—"}
                    </span>
                  </td>

                  {/* Profile link */}
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

            {/* Column averages row */}
            <tr className="border-t-2 border-ink/10 bg-ink/[0.04] font-semibold">
              <td className="sticky left-0 z-10 bg-ink/[0.04] px-4 py-3 text-xs uppercase tracking-wider text-ink/50">
                {t.average}
              </td>
              {data.assignments.map(a => {
                const avg = avgForAssignment(a.id, data.students, data.grades);
                return (
                  <td key={a.id} className="px-2 py-3 text-center">
                    <span className={scoreColor(avg)}>
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
