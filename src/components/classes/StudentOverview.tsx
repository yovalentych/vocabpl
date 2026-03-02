"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ClipboardText,
  CheckCircle,
  Clock,
  Trophy,
  TrendUp,
  Calendar,
  BookOpen
} from "@phosphor-icons/react";

type StudentOverviewProps = {
  classId: string;
  classData: any;
  locale: "uk" | "pl";
};

type StudentStats = {
  totalAssignments: number;
  completedAssignments: number;
  gradedAssignments: number;
  averageScore: number;
  upcomingDeadlines: Array<{
    id: string;
    title: string;
    dueAt: string;
    status: string;
  }>;
  recentGrades: Array<{
    id: string;
    assignmentTitle: string;
    score: number;
    maxScore: number;
    gradedAt: string;
  }>;
};

export default function StudentOverview({
  classId,
  classData,
  locale
}: StudentOverviewProps) {
  const [stats, setStats] = useState<StudentStats | null>(null);
  const [loading, setLoading] = useState(true);

  const t = locale === "uk" ? {
    myProgress: "Мій прогрес",
    completedAssignments: "Виконано завдань",
    averageScore: "Середня оцінка",
    gradedAssignments: "Оцінено",
    upcomingDeadlines: "Наближаються дедлайни",
    recentGrades: "Останні оцінки",
    noDeadlines: "Немає найближчих дедлайнів",
    noGrades: "Ще немає оцінок",
    viewAssignment: "Переглянути",
    dueDate: "Здати до",
    classInfo: "Інформація про клас",
    teacher: "Викладач",
    totalStudents: "Студентів у класі",
    score: "Оцінка",
    notStarted: "Не розпочато",
    submitted: "Здано",
    graded: "Оцінено"
  } : {
    myProgress: "Mój postęp",
    completedAssignments: "Ukończone zadania",
    averageScore: "Średnia ocena",
    gradedAssignments: "Ocenione",
    upcomingDeadlines: "Zbliżające się terminy",
    recentGrades: "Ostatnie oceny",
    noDeadlines: "Brak zbliżających się terminów",
    noGrades: "Brak ocen",
    viewAssignment: "Zobacz",
    dueDate: "Termin",
    classInfo: "Informacje o klasie",
    teacher: "Nauczyciel",
    totalStudents: "Uczniów w klasie",
    score: "Ocena",
    notStarted: "Nie rozpoczęto",
    submitted: "Przesłane",
    graded: "Ocenione"
  };

  useEffect(() => {
    loadStudentStats();
  }, [classId]);

  async function loadStudentStats() {
    try {
      setLoading(true);
      const res = await fetch(`/api/classes/${classId}/student/stats`);
      const data = await res.json();

      if (res.ok) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Failed to load student stats:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-ink/50">Завантаження...</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12 text-ink/50">
        Не вдалося завантажити статистику
      </div>
    );
  }

  const completionRate = stats.totalAssignments > 0
    ? Math.round((stats.completedAssignments / stats.totalAssignments) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Completed Assignments */}
        <div className="rounded-2xl border border-ink/10 bg-paper p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="rounded-full bg-moss/10 p-2">
              <CheckCircle size={20} className="text-moss" weight="fill" />
            </div>
            <div className="text-sm text-ink/60">{t.completedAssignments}</div>
          </div>
          <div className="text-3xl font-bold text-ink">
            {stats.completedAssignments} / {stats.totalAssignments}
          </div>
          <div className="mt-2 text-sm text-ink/50">
            {completionRate}% завершено
          </div>
        </div>

        {/* Average Score */}
        <div className="rounded-2xl border border-ink/10 bg-paper p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="rounded-full bg-gold/10 p-2">
              <Trophy size={20} className="text-gold" weight="fill" />
            </div>
            <div className="text-sm text-ink/60">{t.averageScore}</div>
          </div>
          <div className="text-3xl font-bold text-gold">
            {stats.averageScore > 0 ? stats.averageScore.toFixed(1) : "—"}
          </div>
          <div className="mt-2 text-sm text-ink/50">
            {stats.gradedAssignments} {t.gradedAssignments.toLowerCase()}
          </div>
        </div>

        {/* Total Assignments */}
        <div className="rounded-2xl border border-ink/10 bg-paper p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="rounded-full bg-terracotta/10 p-2">
              <ClipboardText size={20} className="text-terracotta" weight="fill" />
            </div>
            <div className="text-sm text-ink/60">Всього завдань</div>
          </div>
          <div className="text-3xl font-bold text-ink">
            {stats.totalAssignments}
          </div>
          <div className="mt-2 text-sm text-ink/50">
            {stats.totalAssignments - stats.completedAssignments} активних
          </div>
        </div>

        {/* Progress Trend */}
        <div className="rounded-2xl border border-ink/10 bg-paper p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="rounded-full bg-moss/10 p-2">
              <TrendUp size={20} className="text-moss" weight="bold" />
            </div>
            <div className="text-sm text-ink/60">Прогрес</div>
          </div>
          <div className="text-3xl font-bold text-moss">
            {completionRate}%
          </div>
          <div className="mt-2 text-sm text-ink/50">
            Виконання завдань
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Deadlines */}
        <div className="rounded-2xl border border-ink/10 bg-paper p-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock size={20} className="text-terracotta" weight="fill" />
            <h3 className="font-bold text-ink">{t.upcomingDeadlines}</h3>
          </div>

          {stats.upcomingDeadlines.length === 0 ? (
            <div className="text-center py-8 text-ink/50 text-sm">
              {t.noDeadlines}
            </div>
          ) : (
            <div className="space-y-3">
              {stats.upcomingDeadlines.slice(0, 5).map(assignment => {
                const dueDate = new Date(assignment.dueAt);
                const isOverdue = dueDate < new Date();

                return (
                  <Link
                    key={assignment.id}
                    href={`/classes/${classId}/assignments/${assignment.id}`}
                    className="block p-3 rounded-lg border border-ink/10 hover:bg-ink/5 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h4 className="font-semibold text-ink text-sm">
                          {assignment.title}
                        </h4>
                        <div className={`text-xs mt-1 ${isOverdue ? 'text-red-600' : 'text-ink/50'}`}>
                          <Calendar size={12} className="inline mr-1" />
                          {dueDate.toLocaleDateString(locale === "uk" ? "uk-UA" : "pl-PL")}
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        assignment.status === 'not_started'
                          ? 'bg-ink/10 text-ink/60'
                          : assignment.status === 'submitted'
                          ? 'bg-moss/10 text-moss'
                          : 'bg-gold/10 text-gold'
                      }`}>
                        {assignment.status === 'not_started' && t.notStarted}
                        {assignment.status === 'submitted' && t.submitted}
                        {assignment.status === 'graded' && t.graded}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Grades */}
        <div className="rounded-2xl border border-ink/10 bg-paper p-6">
          <div className="flex items-center gap-2 mb-4">
            <Trophy size={20} className="text-gold" weight="fill" />
            <h3 className="font-bold text-ink">{t.recentGrades}</h3>
          </div>

          {stats.recentGrades.length === 0 ? (
            <div className="text-center py-8 text-ink/50 text-sm">
              {t.noGrades}
            </div>
          ) : (
            <div className="space-y-3">
              {stats.recentGrades.slice(0, 5).map(grade => {
                const percentage = (grade.score / grade.maxScore) * 100;
                const gradedDate = new Date(grade.gradedAt);

                return (
                  <div
                    key={grade.id}
                    className="p-3 rounded-lg border border-ink/10 bg-paper"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h4 className="font-semibold text-ink text-sm">
                          {grade.assignmentTitle}
                        </h4>
                        <div className="text-xs text-ink/50 mt-1">
                          {gradedDate.toLocaleDateString(locale === "uk" ? "uk-UA" : "pl-PL")}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-gold">
                          {grade.score}/{grade.maxScore}
                        </div>
                        <div className="text-xs text-ink/50">
                          {Math.round(percentage)}%
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Class Info */}
      <div className="rounded-2xl border border-ink/10 bg-paper p-6">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen size={20} className="text-moss" weight="fill" />
          <h3 className="font-bold text-ink">{t.classInfo}</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <div className="text-sm text-ink/60 mb-1">{t.teacher}</div>
            <div className="font-semibold text-ink">{classData.teacherName}</div>
          </div>
          <div>
            <div className="text-sm text-ink/60 mb-1">{t.totalStudents}</div>
            <div className="font-semibold text-ink">{classData.stats.totalStudents}</div>
          </div>
          {classData.description && (
            <div className="sm:col-span-3">
              <div className="text-sm text-ink/60 mb-1">Опис</div>
              <div className="text-ink">{classData.description}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
