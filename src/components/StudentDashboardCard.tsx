"use client";

import Link from "next/link";
import { useLocale } from "@/components/LocaleProvider";

interface StudentStats {
  totalClasses: number;
  activeAssignments: number;
  upcomingDeadlines: number;
  averageGrade: number | null;
}

interface ClassSummary {
  _id: string;
  name: string;
  teacherName: string;
  totalAssignments: number;
  completedAssignments: number;
  myAverageGrade: number | null;
  upcomingDeadlines: number;
}

interface UpcomingDeadline {
  assignmentId: string;
  assignmentTitle: string;
  className: string;
  classId: string;
  dueAt: string;
  status: "not_started" | "in_progress" | "submitted";
  daysRemaining: number;
}

interface RecentGrade {
  assignmentId: string;
  assignmentTitle: string;
  className: string;
  classId: string;
  score: number;
  percentage: number;
  gradedAt: string;
}

interface Props {
  stats: StudentStats;
  classes: ClassSummary[];
  upcomingDeadlines?: UpcomingDeadline[];
  recentGrades?: RecentGrade[];
}

export default function StudentDashboardCard({
  stats,
  classes,
  upcomingDeadlines = [],
  recentGrades = [],
}: Props) {
  const { t, locale } = useLocale();

  const formatDaysRemaining = (days: number) => {
    if (days < 0) return t("cabinet.overdue");
    if (days === 0) return t("cabinet.today");
    if (days === 1) return t("cabinet.tomorrow");
    return t("cabinet.daysRemaining", { n: days });
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "not_started":
        return t("cabinet.notStarted");
      case "in_progress":
        return t("cabinet.inProgress");
      case "submitted":
        return t("cabinet.submitted");
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "not_started":
        return "text-red-600";
      case "in_progress":
        return "text-amber-600";
      case "submitted":
        return "text-green-600";
      default:
        return "text-stone-600";
    }
  };

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
      {/* Stats Cards */}
      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border border-stone-200 bg-gradient-to-br from-blue-50 to-white p-4">
          <div className="text-sm text-stone-600">{t("cabinet.totalClasses")}</div>
          <div className="text-3xl font-bold text-blue-600">{stats.totalClasses}</div>
        </div>
        <div className="rounded-lg border border-stone-200 bg-gradient-to-br from-amber-50 to-white p-4">
          <div className="text-sm text-stone-600">{t("cabinet.activeAssignments")}</div>
          <div className="text-3xl font-bold text-amber-600">{stats.activeAssignments}</div>
        </div>
        <div className="rounded-lg border border-stone-200 bg-gradient-to-br from-orange-50 to-white p-4">
          <div className="text-sm text-stone-600">{t("cabinet.upcomingDeadlines")}</div>
          <div className="text-3xl font-bold text-orange-600">{stats.upcomingDeadlines}</div>
        </div>
        <div className="rounded-lg border border-stone-200 bg-gradient-to-br from-green-50 to-white p-4">
          <div className="text-sm text-stone-600">{t("cabinet.averageGrade")}</div>
          <div className="text-3xl font-bold text-green-600">
            {stats.averageGrade !== null ? `${stats.averageGrade}%` : "—"}
          </div>
        </div>
      </div>

      {/* Upcoming Deadlines */}
      {upcomingDeadlines.length > 0 && (
        <div className="mb-6">
          <h3 className="mb-3 text-lg font-semibold text-stone-900">
            {t("cabinet.upcomingDeadlinesTitle")}
          </h3>
          <div className="space-y-2">
            {upcomingDeadlines.slice(0, 5).map((deadline) => (
              <Link
                key={deadline.assignmentId}
                href={`/classes/${deadline.classId}`}
                className="block rounded-lg border border-stone-200 bg-stone-50 p-3 transition-colors hover:bg-stone-100"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-stone-900">{deadline.assignmentTitle}</div>
                    <div className="text-sm text-stone-600">{deadline.className}</div>
                  </div>
                  <div className="text-right">
                    <div
                      className={`text-sm font-medium ${
                        deadline.daysRemaining < 0
                          ? "text-red-600"
                          : deadline.daysRemaining <= 1
                            ? "text-orange-600"
                            : "text-stone-600"
                      }`}
                    >
                      {formatDaysRemaining(deadline.daysRemaining)}
                    </div>
                    <div className={`text-xs ${getStatusColor(deadline.status)}`}>
                      {getStatusLabel(deadline.status)}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Recent Grades */}
      {recentGrades.length > 0 && (
        <div className="mb-6">
          <h3 className="mb-3 text-lg font-semibold text-stone-900">
            {t("cabinet.recentGradesTitle")}
          </h3>
          <div className="space-y-2">
            {recentGrades.map((grade) => (
              <Link
                key={`${grade.assignmentId}-${grade.gradedAt}`}
                href={`/classes/${grade.classId}`}
                className="block rounded-lg border border-stone-200 bg-stone-50 p-3 transition-colors hover:bg-stone-100"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-stone-900">{grade.assignmentTitle}</div>
                    <div className="text-sm text-stone-600">{grade.className}</div>
                  </div>
                  <div className="text-right">
                    <div
                      className={`text-lg font-bold ${
                        grade.percentage >= 80
                          ? "text-green-600"
                          : grade.percentage >= 60
                            ? "text-amber-600"
                            : "text-red-600"
                      }`}
                    >
                      {grade.percentage}%
                    </div>
                    <div className="text-xs text-stone-500">
                      {new Date(grade.gradedAt).toLocaleDateString(
                        locale === "pl" ? "pl-PL" : "uk-UA"
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* My Classes List */}
      <div className="mb-6">
        <h3 className="mb-3 text-lg font-semibold text-stone-900">
          {t("cabinet.myClassesList")}
        </h3>
        <div className="space-y-3">
          {classes.map((cls) => (
            <div
              key={cls._id}
              className="rounded-lg border border-stone-200 bg-gradient-to-r from-stone-50 to-white p-4"
            >
              <div className="mb-2 flex items-start justify-between">
                <div>
                  <h4 className="text-lg font-semibold text-stone-900">{cls.name}</h4>
                  <p className="text-sm text-stone-600">
                    {locale === "pl" ? "Nauczyciel" : "Вчитель"}: {cls.teacherName}
                  </p>
                </div>
                {cls.myAverageGrade !== null && (
                  <div
                    className={`rounded-full px-3 py-1 text-sm font-bold ${
                      cls.myAverageGrade >= 80
                        ? "bg-green-100 text-green-700"
                        : cls.myAverageGrade >= 60
                          ? "bg-amber-100 text-amber-700"
                          : "bg-red-100 text-red-700"
                    }`}
                  >
                    {cls.myAverageGrade}%
                  </div>
                )}
              </div>
              <div className="mb-3 flex items-center gap-4 text-sm text-stone-600">
                <span>
                  {t("cabinet.assignmentsCompleted", {
                    completed: cls.completedAssignments,
                    total: cls.totalAssignments,
                  })}
                </span>
                {cls.upcomingDeadlines > 0 && (
                  <span className="text-orange-600">
                    {cls.upcomingDeadlines} {locale === "pl" ? "terminów" : "дедлайнів"}
                  </span>
                )}
              </div>
              <Link href={`/classes/${cls._id}`}>
                <button className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700">
                  {t("cabinet.viewClass")}
                </button>
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Link href="/classes/join">
          <button className="rounded-lg border-2 border-blue-600 bg-white px-6 py-2 font-semibold text-blue-600 transition-colors hover:bg-blue-50">
            + {t("cabinet.joinClass")}
          </button>
        </Link>
        <Link href="/classes">
          <button className="rounded-lg bg-stone-200 px-6 py-2 font-semibold text-stone-700 transition-colors hover:bg-stone-300">
            {t("cabinet.allClasses")}
          </button>
        </Link>
      </div>
    </div>
  );
}
