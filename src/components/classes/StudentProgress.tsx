"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ClipboardText,
  CheckCircle,
  Clock,
  XCircle,
  Trophy,
  Calendar,
  Funnel
} from "@phosphor-icons/react";

type StudentProgressProps = {
  classId: string;
  locale: "uk" | "pl";
};

type AssignmentProgress = {
  assignmentId: string;
  title: string;
  type: string;
  dueAt?: string;
  status: 'not_started' | 'in_progress' | 'submitted' | 'graded';
  score?: number;
  percentage?: number;
  maxScore?: number;
  submittedAt?: string;
  gradedAt?: string;
  feedback?: string;
  isLate: boolean;
};

export default function StudentProgress({ classId, locale }: StudentProgressProps) {
  const [assignments, setAssignments] = useState<AssignmentProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'not_started' | 'submitted' | 'graded'>('all');

  const t = locale === "uk" ? {
    title: "Мій прогрес",
    filter: "Фільтр",
    all: "Всі",
    notStarted: "Не розпочато",
    submitted: "Здано",
    graded: "Оцінено",
    assignment: "Завдання",
    type: "Тип",
    status: "Статус",
    score: "Оцінка",
    deadline: "Дедлайн",
    submittedOn: "Здано",
    gradedOn: "Оцінено",
    noAssignments: "Немає завдань",
    late: "Запізно",
    viewDetails: "Деталі",
    feedback: "Відгук",
    types: {
      exercise: "Вправа",
      test: "Тест",
      reading: "Читання",
      custom: "Інше"
    }
  } : {
    title: "Mój postęp",
    filter: "Filtr",
    all: "Wszystkie",
    notStarted: "Nie rozpoczęte",
    submitted: "Przesłane",
    graded: "Ocenione",
    assignment: "Zadanie",
    type: "Typ",
    status: "Status",
    score: "Ocena",
    deadline: "Termin",
    submittedOn: "Przesłano",
    gradedOn: "Oceniono",
    noAssignments: "Brak zadań",
    late: "Spóźnione",
    viewDetails: "Szczegóły",
    feedback: "Opinia",
    types: {
      exercise: "Ćwiczenie",
      test: "Test",
      reading: "Czytanie",
      custom: "Inne"
    }
  };

  useEffect(() => {
    loadProgress();
  }, [classId]);

  async function loadProgress() {
    try {
      setLoading(true);
      const res = await fetch(`/api/classes/${classId}/student/progress`);
      const data = await res.json();

      if (res.ok) {
        setAssignments(data.assignments || []);
      }
    } catch (error) {
      console.error("Failed to load progress:", error);
    } finally {
      setLoading(false);
    }
  }

  const filteredAssignments = assignments.filter(a => {
    if (filter === 'all') return true;
    if (filter === 'not_started') return a.status === 'not_started';
    if (filter === 'submitted') return a.status === 'submitted';
    if (filter === 'graded') return a.status === 'graded';
    return true;
  });

  function getStatusIcon(status: string) {
    switch (status) {
      case 'graded':
        return <CheckCircle size={18} className="text-moss" weight="fill" />;
      case 'submitted':
        return <Clock size={18} className="text-gold" weight="fill" />;
      case 'not_started':
        return <XCircle size={18} className="text-ink/30" weight="fill" />;
      default:
        return <Clock size={18} className="text-ink/30" />;
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'graded':
        return 'bg-moss/10 text-moss';
      case 'submitted':
        return 'bg-gold/10 text-gold';
      case 'not_started':
        return 'bg-ink/10 text-ink/60';
      default:
        return 'bg-ink/10 text-ink/60';
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-ink/50">Завантаження...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-ink">{t.title}</h2>
        <div className="flex items-center gap-2">
          <Funnel size={18} className="text-ink/50" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="px-3 py-2 rounded-lg border border-ink/20 text-sm focus:border-moss focus:outline-none"
          >
            <option value="all">{t.all}</option>
            <option value="not_started">{t.notStarted}</option>
            <option value="submitted">{t.submitted}</option>
            <option value="graded">{t.graded}</option>
          </select>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border border-ink/10 bg-paper p-4">
          <div className="text-sm text-ink/60 mb-1">{t.all}</div>
          <div className="text-2xl font-bold text-ink">{assignments.length}</div>
        </div>
        <div className="rounded-xl border border-ink/10 bg-paper p-4">
          <div className="text-sm text-ink/60 mb-1">{t.notStarted}</div>
          <div className="text-2xl font-bold text-ink/50">
            {assignments.filter(a => a.status === 'not_started').length}
          </div>
        </div>
        <div className="rounded-xl border border-ink/10 bg-paper p-4">
          <div className="text-sm text-ink/60 mb-1">{t.submitted}</div>
          <div className="text-2xl font-bold text-gold">
            {assignments.filter(a => a.status === 'submitted').length}
          </div>
        </div>
        <div className="rounded-xl border border-ink/10 bg-paper p-4">
          <div className="text-sm text-ink/60 mb-1">{t.graded}</div>
          <div className="text-2xl font-bold text-moss">
            {assignments.filter(a => a.status === 'graded').length}
          </div>
        </div>
      </div>

      {/* Assignments list */}
      {filteredAssignments.length === 0 ? (
        <div className="rounded-2xl border border-ink/10 bg-paper p-12 text-center">
          <ClipboardText size={48} className="mx-auto mb-4 text-ink/30" />
          <p className="text-ink/60">{t.noAssignments}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAssignments.map(assignment => {
            const dueDate = assignment.dueAt ? new Date(assignment.dueAt) : null;
            const isOverdue = dueDate && dueDate < new Date() && assignment.status === 'not_started';

            return (
              <Link
                key={assignment.assignmentId}
                href={`/classes/${classId}/assignments/${assignment.assignmentId}`}
                className="block rounded-2xl border border-ink/10 bg-paper p-5 hover:bg-ink/5 transition-colors"
              >
                <div className="flex items-start gap-4">
                  {/* Status icon */}
                  <div className="mt-1">
                    {getStatusIcon(assignment.status)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-ink mb-1">
                          {assignment.title}
                          {assignment.isLate && (
                            <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-600">
                              {t.late}
                            </span>
                          )}
                        </h3>
                        <div className="flex items-center gap-3 text-xs text-ink/50">
                          <span>{t.types[assignment.type as keyof typeof t.types] || assignment.type}</span>
                          {dueDate && (
                            <>
                              <span>•</span>
                              <span className={isOverdue ? 'text-red-600' : ''}>
                                <Calendar size={12} className="inline mr-1" />
                                {dueDate.toLocaleDateString(locale === "uk" ? "uk-UA" : "pl-PL")}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Status badge */}
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${getStatusColor(assignment.status)}`}>
                        {assignment.status === 'not_started' && t.notStarted}
                        {assignment.status === 'submitted' && t.submitted}
                        {assignment.status === 'graded' && t.graded}
                        {assignment.status === 'in_progress' && 'In Progress'}
                      </span>
                    </div>

                    {/* Additional info */}
                    <div className="flex items-center gap-4 text-sm">
                      {assignment.status === 'submitted' && assignment.submittedAt && (
                        <div className="text-ink/60">
                          {t.submittedOn}: {new Date(assignment.submittedAt).toLocaleDateString(locale === "uk" ? "uk-UA" : "pl-PL")}
                        </div>
                      )}

                      {assignment.status === 'graded' && (
                        <>
                          {assignment.score !== undefined && (
                            <div className="flex items-center gap-2">
                              <Trophy size={16} className="text-gold" weight="fill" />
                              <span className="font-semibold text-gold">
                                {assignment.score}/{assignment.maxScore || 100}
                              </span>
                              {assignment.percentage !== undefined && (
                                <span className="text-ink/50">({Math.round(assignment.percentage)}%)</span>
                              )}
                            </div>
                          )}
                          {assignment.gradedAt && (
                            <div className="text-ink/50">
                              • {t.gradedOn}: {new Date(assignment.gradedAt).toLocaleDateString(locale === "uk" ? "uk-UA" : "pl-PL")}
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {/* Feedback */}
                    {assignment.feedback && (
                      <div className="mt-3 p-3 rounded-lg bg-moss/5 border border-moss/20">
                        <div className="text-xs font-semibold text-moss mb-1">{t.feedback}:</div>
                        <div className="text-sm text-ink">{assignment.feedback}</div>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
