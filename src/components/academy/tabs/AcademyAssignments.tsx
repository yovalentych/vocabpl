"use client";

import { useState, useEffect } from "react";
import { useLocale } from "@/components/LocaleProvider";
import Link from "next/link";
import { ClipboardText, Funnel, MagnifyingGlass } from "@phosphor-icons/react";

interface Props {
  isTeacher: boolean;
}

export default function AcademyAssignments({ isTeacher }: Props) {
  const { t, locale } = useLocale();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "submitted" | "graded">("all");

  useEffect(() => {
    loadAssignments();
  }, []);

  async function loadAssignments() {
    setLoading(true);
    try {
      if (isTeacher) {
        const res = await fetch("/api/teacher/assignments");
        if (res.ok) {
          const data = await res.json();
          setAssignments(data.assignments || []);
        }
      } else {
        // Load all student assignments
        const studentRes = await fetch("/api/student/assignments");
        if (studentRes.ok) {
          const data = await studentRes.json();
          setAssignments(data.assignments || []);
        }
      }
    } catch (error) {
      console.error("Failed to load assignments:", error);
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

  const filteredAssignments = assignments.filter(a => {
    if (filter === "all") return true;
    if (filter === "pending") return a.status === "not_started" || a.status === "in_progress";
    if (filter === "submitted") return a.status === "submitted";
    if (filter === "graded") return a.status === "graded";
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">
            {locale === "pl" ? "Wszystkie zadania" : "Всі завдання"}
          </h2>
          <p className="text-sm text-ink/60">
            {isTeacher
              ? (locale === "pl" ? "Zarządzaj zadaniami ze wszystkich klas" : "Керуйте завданнями з усіх класів")
              : (locale === "pl" ? "Twoje zadania ze wszystkich klas" : "Ваші завдання з усіх класів")}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {["all", "pending", "submitted", "graded"].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f as any)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
              filter === f
                ? "border border-moss/20 bg-moss/10 text-moss"
                : "border border-ink/10 bg-paper text-ink/60 hover:bg-ink/5"
            }`}
          >
            {f === "all"
              ? (locale === "pl" ? "Wszystkie" : "Всі")
              : f === "pending"
                ? (locale === "pl" ? "Oczekujące" : "Очікують")
                : f === "submitted"
                  ? (locale === "pl" ? "Wysłane" : "Надіслані")
                  : (locale === "pl" ? "Ocenione" : "Оцінені")}
          </button>
        ))}
      </div>

      {/* Assignments List */}
      {filteredAssignments.length > 0 ? (
        <div className="space-y-3">
          {filteredAssignments.map((assignment: any) => (
            <Link
              key={assignment._id || assignment.assignmentId}
              href={`/classes/${assignment.classId}/assignments/${assignment._id || assignment.assignmentId}`}
              className="block rounded-[24px] border border-ink/10 bg-paper p-6 shadow-soft transition-all hover:shadow-lg"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <ClipboardText size={20} weight="fill" className="text-moss" />
                    <h3 className="font-semibold">{assignment.title || assignment.assignmentTitle}</h3>
                  </div>
                  <p className="mt-2 text-sm text-ink/60">{assignment.className}</p>
                  {assignment.dueAt && (
                    <p className="mt-1 text-sm text-ink/60">
                      {locale === "pl" ? "Termin:" : "Дедлайн:"}{" "}
                      {new Date(assignment.dueAt).toLocaleDateString(locale === "pl" ? "pl-PL" : "uk-UA")}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1">
                  {assignment.status && (
                    <div
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        assignment.status === "graded"
                          ? "border border-moss/20 bg-moss/10 text-moss"
                          : assignment.status === "submitted"
                            ? "border border-gold/20 bg-gold/10 text-gold"
                            : "border border-ink/10 bg-ink/5 text-ink/60"
                      }`}
                    >
                      {assignment.status === "not_started"
                        ? (locale === "pl" ? "Nie rozpoczęto" : "Не розпочато")
                        : assignment.status === "in_progress"
                          ? (locale === "pl" ? "W trakcie" : "В процесі")
                          : assignment.status === "submitted"
                            ? (locale === "pl" ? "Wysłano" : "Надіслано")
                            : (locale === "pl" ? "Oceniono" : "Оцінено")}
                    </div>
                  )}
                  {assignment.status === "graded" && assignment.percentage != null && (
                    <span className={`text-sm font-bold ${
                      assignment.percentage >= 80 ? "text-moss" :
                      assignment.percentage >= 60 ? "text-gold" :
                      "text-terracotta"
                    }`}>
                      {assignment.percentage}%
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-[24px] border border-ink/10 bg-ink/5 p-12 text-center">
          <ClipboardText size={48} weight="thin" className="mx-auto mb-4 text-ink/40" />
          <p className="text-ink/60">
            {locale === "pl" ? "Brak zadań do wyświetlenia" : "Немає завдань для відображення"}
          </p>
        </div>
      )}
    </div>
  );
}
