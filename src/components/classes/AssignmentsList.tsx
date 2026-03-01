"use client";

import { useState, useEffect } from "react";
import { Clock, Users, CheckCircle, XCircle, Calendar } from "@phosphor-icons/react";

type Assignment = {
  _id: string;
  type: string;
  title: string;
  description?: string;
  exerciseType?: string;
  dueAt?: string;
  pointsTotal?: number;
  assignedAt: string;
  settings: {
    allowLateSubmission: boolean;
    showResultsImmediately: boolean;
  };
};

type AssignmentsListProps = {
  classId: string;
  isTeacher: boolean;
  locale: 'uk' | 'pl';
};

export default function AssignmentsList({ classId, isTeacher, locale }: AssignmentsListProps) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  const t = locale === 'uk' ? {
    loading: "Завантаження...",
    noAssignments: "Завдань ще немає",
    noAssignmentsDesc: "Створіть перше завдання для класу",
    exercise: "Вправа",
    test: "Тест",
    reading: "Читання",
    custom: "Власне",
    dueDate: "Дедлайн",
    points: "балів",
    assignedOn: "Призначено",
    students: "студентів",
    completed: "виконали",
    pending: "в очікуванні",
    overdue: "прострочено",
    sentences: "Речення",
    cloze: "Пропуски",
    match: "Співставлення",
    translate: "Переклад",
    paraphrase: "Перефразування",
    dialogue: "Діалог",
    describe: "Опис",
    story: "Історія"
  } : {
    loading: "Ładowanie...",
    noAssignments: "Nie ma jeszcze zadań",
    noAssignmentsDesc: "Utwórz pierwsze zadanie dla klasy",
    exercise: "Ćwiczenie",
    test: "Test",
    reading: "Czytanie",
    custom: "Własne",
    dueDate: "Termin",
    points: "punktów",
    assignedOn: "Przypisano",
    students: "uczniów",
    completed: "ukończyli",
    pending: "oczekujące",
    overdue: "zaległe",
    sentences: "Zdania",
    cloze: "Luki",
    match: "Dopasowanie",
    translate: "Tłumaczenie",
    paraphrase: "Parafraza",
    dialogue: "Dialog",
    describe: "Opis",
    story: "Historia"
  };

  const exerciseTypeLabels: Record<string, string> = {
    sentences: t.sentences,
    cloze: t.cloze,
    match: t.match,
    translate: t.translate,
    paraphrase: t.paraphrase,
    dialogue: t.dialogue,
    describe: t.describe,
    story: t.story
  };

  useEffect(() => {
    loadAssignments();
  }, [classId]);

  async function loadAssignments() {
    try {
      setLoading(true);
      const res = await fetch(`/api/classes/${classId}/assignments`);
      const data = await res.json();
      if (res.ok) {
        setAssignments(data.assignments || []);
      }
    } catch (error) {
      console.error("Failed to load assignments:", error);
    } finally {
      setLoading(false);
    }
  }

  function getTypeLabel(assignment: Assignment) {
    if (assignment.type === 'exercise' && assignment.exerciseType) {
      return exerciseTypeLabels[assignment.exerciseType] || assignment.exerciseType;
    }
    const typeLabels: Record<string, string> = {
      exercise: t.exercise,
      test: t.test,
      reading: t.reading,
      custom: t.custom
    };
    return typeLabels[assignment.type] || assignment.type;
  }

  function getTypeIcon(assignment: Assignment) {
    if (assignment.type === 'exercise' && assignment.exerciseType) {
      const icons: Record<string, string> = {
        sentences: '📝',
        cloze: '🔤',
        match: '🔗',
        translate: '🌐',
        paraphrase: '💬',
        dialogue: '🗣️',
        describe: '🖼️',
        story: '📖'
      };
      return icons[assignment.exerciseType] || '📝';
    }
    const typeIcons: Record<string, string> = {
      exercise: '📝',
      test: '✅',
      reading: '📚',
      custom: '✏️'
    };
    return typeIcons[assignment.type] || '📝';
  }

  function isOverdue(dueAt?: string) {
    if (!dueAt) return false;
    return new Date(dueAt) < new Date();
  }

  function formatDate(dateStr: string) {
    const date = new Date(dateStr);
    return date.toLocaleDateString(locale === 'uk' ? 'uk-UA' : 'pl-PL', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  if (loading) {
    return (
      <div className="text-center py-12 text-ink/50">
        {t.loading}
      </div>
    );
  }

  if (assignments.length === 0) {
    return (
      <div className="rounded-2xl border border-ink/10 bg-paper p-12 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-ink/5 mb-4">
          <span className="text-3xl">📝</span>
        </div>
        <h3 className="font-bold text-ink mb-2">{t.noAssignments}</h3>
        <p className="text-sm text-ink/60">{t.noAssignmentsDesc}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {assignments.map((assignment) => {
        const isDue = isOverdue(assignment.dueAt);

        return (
          <a
            key={assignment._id}
            href={`/classes/${classId}/assignments/${assignment._id}`}
            className="block rounded-2xl border border-ink/10 bg-paper p-6 hover:border-moss/30 hover:shadow-lg transition-all"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-3 flex-1">
                {/* Icon */}
                <div className="text-3xl">{getTypeIcon(assignment)}</div>

                {/* Title & Type */}
                <div className="flex-1">
                  <h3 className="font-bold text-ink mb-1 group-hover:text-moss transition-colors">
                    {assignment.title}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-ink/50">
                    <span className="inline-flex items-center gap-1 rounded-full bg-moss/10 px-2 py-0.5 text-moss font-semibold">
                      {getTypeLabel(assignment)}
                    </span>
                    {assignment.pointsTotal && (
                      <span>• {assignment.pointsTotal} {t.points}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Due Date Badge */}
              {assignment.dueAt && (
                <div className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${
                  isDue
                    ? 'bg-terracotta/10 text-terracotta border border-terracotta/30'
                    : 'bg-gold/10 text-gold border border-gold/30'
                }`}>
                  <Clock size={12} weight="fill" />
                  {formatDate(assignment.dueAt)}
                  {isDue && <span className="ml-1">⚠️</span>}
                </div>
              )}
            </div>

            {/* Description */}
            {assignment.description && (
              <p className="text-sm text-ink/70 mb-4 line-clamp-2">
                {assignment.description}
              </p>
            )}

            {/* Footer Stats */}
            <div className="flex items-center gap-4 text-xs text-ink/50 pt-3 border-t border-ink/5">
              <div className="flex items-center gap-1">
                <Calendar size={12} />
                {t.assignedOn}: {formatDate(assignment.assignedAt)}
              </div>

              {/* TODO: Додати статистику submissions */}
              {isTeacher && (
                <div className="flex items-center gap-1 ml-auto">
                  <Users size={12} />
                  <span>0/0 {t.completed}</span>
                </div>
              )}
            </div>
          </a>
        );
      })}
    </div>
  );
}
