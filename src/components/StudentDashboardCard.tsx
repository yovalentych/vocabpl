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
    if (days < 0) return t.cabinet.overdue;
    if (days === 0) return t.cabinet.today;
    if (days === 1) return t.cabinet.tomorrow;
    return t.cabinet.daysRemaining.replace("{n}", days.toString());
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "not_started":
        return t.cabinet.notStarted;
      case "in_progress":
        return t.cabinet.inProgress;
      case "submitted":
        return t.cabinet.submitted;
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "not_started":
        return "text-terracotta";
      case "in_progress":
        return "text-gold";
      case "submitted":
        return "text-moss";
      default:
        return "text-ink/60";
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative overflow-hidden rounded-[24px] border border-ink/10 bg-gradient-to-br from-moss/10 to-paper p-6 shadow-soft">
          <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-moss/20 blur-2xl" />
          <div className="relative">
            <div className="mb-2 text-xs uppercase tracking-wider text-ink/60">{t.cabinet.totalClasses}</div>
            <div className="text-3xl font-semibold text-moss">{stats.totalClasses}</div>
          </div>
        </div>
        <div className="relative overflow-hidden rounded-[24px] border border-ink/10 bg-gradient-to-br from-gold/10 to-paper p-6 shadow-soft">
          <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-gold/20 blur-2xl" />
          <div className="relative">
            <div className="mb-2 text-xs uppercase tracking-wider text-ink/60">{t.cabinet.activeAssignments}</div>
            <div className="text-3xl font-semibold text-gold">{stats.activeAssignments}</div>
          </div>
        </div>
        <div className="relative overflow-hidden rounded-[24px] border border-ink/10 bg-gradient-to-br from-terracotta/10 to-paper p-6 shadow-soft">
          <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-terracotta/20 blur-2xl" />
          <div className="relative">
            <div className="mb-2 text-xs uppercase tracking-wider text-ink/60">{t.cabinet.upcomingDeadlines}</div>
            <div className="text-3xl font-semibold text-terracotta">{stats.upcomingDeadlines}</div>
          </div>
        </div>
        <div className="relative overflow-hidden rounded-[24px] border border-ink/10 bg-gradient-to-br from-moss/10 to-paper p-6 shadow-soft">
          <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-moss/20 blur-2xl" />
          <div className="relative">
            <div className="mb-2 text-xs uppercase tracking-wider text-ink/60">{t.cabinet.averageGrade}</div>
            <div className="text-3xl font-semibold text-moss">
              {stats.averageGrade !== null ? `${stats.averageGrade}%` : "—"}
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Deadlines */}
      {upcomingDeadlines.length > 0 && (
        <div>
          <h3 className="mb-4 text-xl font-semibold">
            {t.cabinet.upcomingDeadlinesTitle}
          </h3>
          <div className="space-y-3">
            {upcomingDeadlines.slice(0, 5).map((deadline) => (
              <Link
                key={deadline.assignmentId}
                href={`/classes/${deadline.classId}`}
                className="block rounded-[20px] border border-ink/10 bg-paper p-4 transition-all hover:shadow-soft"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="font-semibold">{deadline.assignmentTitle}</div>
                    <div className="text-sm text-ink/60">{deadline.className}</div>
                  </div>
                  <div className="text-right">
                    <div
                      className={`text-sm font-semibold ${
                        deadline.daysRemaining < 0
                          ? "text-terracotta"
                          : deadline.daysRemaining <= 1
                            ? "text-gold"
                            : "text-ink/60"
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
        <div>
          <h3 className="mb-4 text-xl font-semibold">
            {t.cabinet.recentGradesTitle}
          </h3>
          <div className="space-y-3">
            {recentGrades.map((grade) => (
              <Link
                key={`${grade.assignmentId}-${grade.gradedAt}`}
                href={`/classes/${grade.classId}`}
                className="block rounded-[20px] border border-ink/10 bg-paper p-4 transition-all hover:shadow-soft"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="font-semibold">{grade.assignmentTitle}</div>
                    <div className="text-sm text-ink/60">{grade.className}</div>
                  </div>
                  <div className="text-right">
                    <div
                      className={`text-2xl font-semibold ${
                        grade.percentage >= 80
                          ? "text-moss"
                          : grade.percentage >= 60
                            ? "text-gold"
                            : "text-terracotta"
                      }`}
                    >
                      {grade.percentage}%
                    </div>
                    <div className="text-xs text-ink/40">
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
      <div>
        <h3 className="mb-4 text-xl font-semibold">
          {t.cabinet.myClassesList}
        </h3>
        <div className="space-y-4">
          {classes.map((cls) => (
            <div
              key={cls._id}
              className="rounded-[24px] border border-ink/10 bg-gradient-to-br from-ink/5 to-paper p-6"
            >
              <div className="mb-3 flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h4 className="text-lg font-semibold">{cls.name}</h4>
                  <p className="text-sm text-ink/60">
                    {locale === "pl" ? "Nauczyciel" : "Вчитель"}: {cls.teacherName}
                  </p>
                </div>
                {cls.myAverageGrade !== null && (
                  <div
                    className={`rounded-full px-4 py-1.5 text-sm font-semibold ${
                      cls.myAverageGrade >= 80
                        ? "border border-moss/20 bg-moss/10 text-moss"
                        : cls.myAverageGrade >= 60
                          ? "border border-gold/20 bg-gold/10 text-gold"
                          : "border border-terracotta/20 bg-terracotta/10 text-terracotta"
                    }`}
                  >
                    {cls.myAverageGrade}%
                  </div>
                )}
              </div>
              <div className="mb-4 flex items-center gap-4 text-sm text-ink/60">
                <span>
                  {t.cabinet.assignmentsCompleted
                    .replace("{completed}", cls.completedAssignments.toString())
                    .replace("{total}", cls.totalAssignments.toString())}
                </span>
                {cls.upcomingDeadlines > 0 && (
                  <>
                    <span>·</span>
                    <span className="text-terracotta">
                      {cls.upcomingDeadlines} {locale === "pl" ? "terminów" : "дедлайнів"}
                    </span>
                  </>
                )}
              </div>
              <Link href={`/classes/${cls._id}`}>
                <button className="w-full rounded-full border border-moss/20 bg-moss px-4 py-2.5 text-sm font-semibold text-paper transition-all hover:bg-moss/90 hover:shadow-md">
                  {t.cabinet.viewClass}
                </button>
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Link href="/classes/join">
          <button className="rounded-full border border-moss/20 bg-moss px-6 py-3 font-semibold text-paper transition-all hover:bg-moss/90 hover:shadow-md">
            + {t.cabinet.joinClass}
          </button>
        </Link>
        <Link href="/classes">
          <button className="rounded-full border border-ink/10 bg-paper px-6 py-3 font-semibold text-ink transition-all hover:bg-ink/5 hover:shadow-sm">
            {t.cabinet.allClasses}
          </button>
        </Link>
      </div>
    </div>
  );
}
