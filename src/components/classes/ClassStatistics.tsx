"use client";

import { useState, useEffect } from "react";
import {
  ChartBar,
  TrendUp,
  TrendDown,
  Trophy,
  Warning,
  Target,
  Users,
  CheckCircle
} from "@phosphor-icons/react";
import Loader from "@/components/ui/Loader";

type ClassStatisticsProps = {
  classId: string;
  locale: "uk" | "pl";
};

type Statistics = {
  classAverageScore: number;
  completionRate: number;
  totalStudents: number;
  totalAssignments: number;
  totalSubmissions: number;
  gradedSubmissions: number;
  topStudents: {
    studentId: string;
    studentName: string;
    averageScore: number;
    completedAssignments: number;
  }[];
  studentsNeedingHelp: {
    studentId: string;
    studentName: string;
    averageScore: number;
    completedAssignments: number;
  }[];
  difficultAssignments: {
    assignmentId: string;
    title: string;
    averageScore: number;
    gradedSubmissions: number;
  }[];
  scoreDistribution: {
    '0-20': number;
    '21-40': number;
    '41-60': number;
    '61-80': number;
    '81-100': number;
  };
  allStudentStats: {
    studentId: string;
    studentName: string;
    completedAssignments: number;
    totalAssignments: number;
    averageScore: number;
  }[];
};

export default function ClassStatistics({ classId, locale }: ClassStatisticsProps) {
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);

  const t = locale === "uk" ? {
    title: "Статистика класу",
    classAverage: "Середній бал класу",
    completionRate: "Відсоток виконання",
    topPerformers: "Найкращі студенти",
    needingHelp: "Потребують допомоги",
    difficultAssignments: "Складні завдання",
    scoreDistribution: "Розподіл оцінок",
    allStudents: "Всі студенти",
    studentName: "Студент",
    avgScore: "Сер. бал",
    completed: "Виконано",
    noData: "Недостатньо даних для статистики",
    noDataDesc: "Створіть завдання та дочекайтесь, поки студенти їх виконають",
    loading: "Завантаження статистики..."
  } : {
    title: "Statystyki klasy",
    classAverage: "Średnia klasy",
    completionRate: "Wskaźnik ukończenia",
    topPerformers: "Najlepsi uczniowie",
    needingHelp: "Potrzebują pomocy",
    difficultAssignments: "Trudne zadania",
    scoreDistribution: "Rozkład ocen",
    allStudents: "Wszyscy uczniowie",
    studentName: "Uczeń",
    avgScore: "Śr. wynik",
    completed: "Ukończono",
    noData: "Brak danych do statystyk",
    noDataDesc: "Utwórz zadania i poczekaj, aż uczniowie je wykonają",
    loading: "Ładowanie statystyk..."
  };

  useEffect(() => {
    loadStatistics();
  }, [classId]);

  async function loadStatistics() {
    try {
      setLoading(true);
      const res = await fetch(`/api/classes/${classId}/statistics`);
      if (res.ok) {
        const data = await res.json();
        setStatistics(data.statistics);
      }
    } catch (error) {
      console.error("Failed to load statistics:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader label={t.loading} />
      </div>
    );
  }

  if (!statistics || statistics.gradedSubmissions === 0) {
    return (
      <div className="rounded-2xl border border-ink/10 bg-paper p-12 text-center">
        <ChartBar size={64} className="mx-auto mb-4 text-ink/20" />
        <h3 className="text-lg font-bold text-ink mb-2">{t.noData}</h3>
        <p className="text-sm text-ink/60">{t.noDataDesc}</p>
      </div>
    );
  }

  const maxDistribution = Math.max(...Object.values(statistics.scoreDistribution));

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-ink/10 bg-paper p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gold/10">
              <Trophy size={22} weight="fill" className="text-gold" />
            </div>
            <div>
              <p className="text-xs text-ink/50">{t.classAverage}</p>
              <p className="text-3xl font-bold text-gold">{statistics.classAverageScore}%</p>
            </div>
          </div>
          <div className="h-2 rounded-full bg-ink/5 overflow-hidden">
            <div
              className="h-full bg-gold transition-all"
              style={{ width: `${statistics.classAverageScore}%` }}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-ink/10 bg-paper p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-moss/10">
              <CheckCircle size={22} weight="fill" className="text-moss" />
            </div>
            <div>
              <p className="text-xs text-ink/50">{t.completionRate}</p>
              <p className="text-3xl font-bold text-moss">{statistics.completionRate}%</p>
            </div>
          </div>
          <div className="h-2 rounded-full bg-ink/5 overflow-hidden">
            <div
              className="h-full bg-moss transition-all"
              style={{ width: `${statistics.completionRate}%` }}
            />
          </div>
        </div>
      </div>

      {/* Top Performers & Needing Help */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Top Performers */}
        <div className="rounded-2xl border border-ink/10 bg-paper p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendUp size={20} weight="bold" className="text-moss" />
            <h3 className="font-bold text-ink">{t.topPerformers}</h3>
          </div>
          {statistics.topStudents.length > 0 ? (
            <div className="space-y-2">
              {statistics.topStudents.map((student, index) => (
                <div
                  key={student.studentId}
                  className="flex items-center justify-between rounded-xl border border-ink/10 bg-paper/60 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                      index === 0 ? 'bg-gold/20 text-gold' :
                      index === 1 ? 'bg-ink/10 text-ink' :
                      index === 2 ? 'bg-terracotta/20 text-terracotta' :
                      'bg-ink/5 text-ink/50'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-ink">{student.studentName}</p>
                      <p className="text-xs text-ink/50">
                        {student.completedAssignments} {t.completed}
                      </p>
                    </div>
                  </div>
                  <div className="text-lg font-bold text-moss">{student.averageScore}%</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-ink/50">{t.noData}</p>
          )}
        </div>

        {/* Students Needing Help */}
        <div className="rounded-2xl border border-ink/10 bg-paper p-6">
          <div className="flex items-center gap-2 mb-4">
            <Warning size={20} weight="fill" className="text-terracotta" />
            <h3 className="font-bold text-ink">{t.needingHelp}</h3>
          </div>
          {statistics.studentsNeedingHelp.length > 0 ? (
            <div className="space-y-2">
              {statistics.studentsNeedingHelp.map((student) => (
                <div
                  key={student.studentId}
                  className="flex items-center justify-between rounded-xl border border-terracotta/20 bg-terracotta/5 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-ink">{student.studentName}</p>
                    <p className="text-xs text-ink/50">
                      {student.completedAssignments} {t.completed}
                    </p>
                  </div>
                  <div className="text-lg font-bold text-terracotta">{student.averageScore}%</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-moss">✓ Всі студенти працюють добре!</p>
          )}
        </div>
      </div>

      {/* Difficult Assignments */}
      {statistics.difficultAssignments.length > 0 && (
        <div className="rounded-2xl border border-ink/10 bg-paper p-6">
          <div className="flex items-center gap-2 mb-4">
            <Target size={20} weight="fill" className="text-gold" />
            <h3 className="font-bold text-ink">{t.difficultAssignments}</h3>
          </div>
          <div className="space-y-2">
            {statistics.difficultAssignments.map((assignment) => (
              <div
                key={assignment.assignmentId}
                className="flex items-center justify-between rounded-xl border border-ink/10 bg-paper/60 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-semibold text-ink">{assignment.title}</p>
                  <p className="text-xs text-ink/50">
                    {assignment.gradedSubmissions} {t.completed}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-gold">{assignment.averageScore}%</div>
                  <p className="text-xs text-ink/50">{t.avgScore}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Score Distribution */}
      <div className="rounded-2xl border border-ink/10 bg-paper p-6">
        <div className="flex items-center gap-2 mb-4">
          <ChartBar size={20} weight="fill" className="text-ink" />
          <h3 className="font-bold text-ink">{t.scoreDistribution}</h3>
        </div>
        <div className="space-y-3">
          {Object.entries(statistics.scoreDistribution).map(([range, count]) => (
            <div key={range}>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="font-semibold text-ink">{range}%</span>
                <span className="text-ink/50">{count} {locale === "uk" ? "робіт" : "prac"}</span>
              </div>
              <div className="h-3 rounded-full bg-ink/5 overflow-hidden">
                <div
                  className="h-full bg-moss transition-all"
                  style={{
                    width: maxDistribution > 0 ? `${(count / maxDistribution) * 100}%` : '0%'
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* All Students Table */}
      <div className="rounded-2xl border border-ink/10 bg-paper overflow-hidden">
        <div className="px-6 py-4 border-b border-ink/10 bg-ink/[0.02]">
          <div className="flex items-center gap-2">
            <Users size={20} className="text-ink" />
            <h3 className="font-bold text-ink">{t.allStudents}</h3>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-ink/5">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-ink/50 uppercase tracking-wide">
                  {t.studentName}
                </th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-ink/50 uppercase tracking-wide">
                  {t.completed}
                </th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-ink/50 uppercase tracking-wide">
                  {t.avgScore}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/5">
              {statistics.allStudentStats.map((student) => (
                <tr key={student.studentId} className="hover:bg-ink/[0.02] transition-colors">
                  <td className="px-6 py-4 text-sm font-semibold text-ink">
                    {student.studentName}
                  </td>
                  <td className="px-6 py-4 text-center text-sm text-ink/70">
                    {student.completedAssignments} / {student.totalAssignments}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {student.completedAssignments > 0 ? (
                      <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-bold ${
                        student.averageScore >= 80 ? 'bg-moss/10 text-moss' :
                        student.averageScore >= 60 ? 'bg-gold/10 text-gold' :
                        'bg-terracotta/10 text-terracotta'
                      }`}>
                        {student.averageScore}%
                      </span>
                    ) : (
                      <span className="text-ink/30">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
