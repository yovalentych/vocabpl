"use client";

import { useState, useEffect } from "react";
import { useLocale } from "@/components/LocaleProvider";
import Link from "next/link";
import {
  Books,
  Users,
  ClipboardText,
  ChartBar,
  Calendar,
  Plus,
  ArrowRight,
  Warning,
  CheckCircle
} from "@phosphor-icons/react";

interface Props {
  isTeacher: boolean;
  isStudent: boolean;
  teacherProfile: any;
  studentStats: any;
}

export default function AcademyOverview({ isTeacher, isStudent, teacherProfile, studentStats }: Props) {
  const basePath = isTeacher ? "/school/teacher" : "/school/student";
  const { t, locale } = useLocale();
  const [teacherClasses, setTeacherClasses] = useState<any[]>([]);
  const [studentClasses, setStudentClasses] = useState<any[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [urgentAssignments, setUrgentAssignments] = useState<any[]>([]);
  const [loadedStudentStats, setLoadedStudentStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOverviewData();
  }, [isTeacher]);

  async function loadOverviewData() {
    setLoading(true);
    try {
      if (isTeacher) {
        // Load teacher classes
        const classesRes = await fetch("/api/classes");
        if (classesRes.ok) {
          const data = await classesRes.json();
          setTeacherClasses(data.classes || []);
        }
      }

      if (isStudent) {
        // Load student classes
        const studentRes = await fetch("/api/student/dashboard");
        if (studentRes.ok) {
          const data = await studentRes.json();
          setStudentClasses(data.classes || []);
          setUrgentAssignments(data.upcomingDeadlines?.slice(0, 5) || []);
          setLoadedStudentStats(data.stats || null);
        }
      }

      // Load upcoming events
      const scheduleRes = await fetch("/api/schedule/my");
      if (scheduleRes.ok) {
        const data = await scheduleRes.json();
        // Get next 5 events
        const now = new Date();
        const upcoming = (data.events || [])
          .filter((e: any) => new Date(e.startTime) > now)
          .slice(0, 5);
        setUpcomingEvents(upcoming);
      }
    } catch (error) {
      console.error("Failed to load overview:", error);
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

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isTeacher && (
          <>
            <div className="relative overflow-hidden rounded-[24px] border border-ink/10 bg-gradient-to-br from-moss/10 to-paper p-6 shadow-soft">
              <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-moss/20 blur-2xl" />
              <div className="relative">
                <div className="mb-2 text-xs uppercase tracking-wider text-ink/60">
                  {locale === "pl" ? "Klasy" : "Класи"}
                </div>
                <div className="text-3xl font-semibold text-moss">
                  {teacherProfile?.stats?.totalClasses || teacherClasses.length}
                </div>
              </div>
            </div>
            <div className="relative overflow-hidden rounded-[24px] border border-ink/10 bg-gradient-to-br from-terracotta/10 to-paper p-6 shadow-soft">
              <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-terracotta/20 blur-2xl" />
              <div className="relative">
                <div className="mb-2 text-xs uppercase tracking-wider text-ink/60">
                  {locale === "pl" ? "Studenci" : "Студенти"}
                </div>
                <div className="text-3xl font-semibold text-terracotta">
                  {teacherProfile?.stats?.totalStudents || 0}
                </div>
              </div>
            </div>
          </>
        )}
        {isStudent && (
          <>
            <div className="relative overflow-hidden rounded-[24px] border border-ink/10 bg-gradient-to-br from-moss/10 to-paper p-6 shadow-soft">
              <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-moss/20 blur-2xl" />
              <div className="relative">
                <div className="mb-2 text-xs uppercase tracking-wider text-ink/60">
                  {locale === "pl" ? "Moje klasy" : "Мої класи"}
                </div>
                <div className="text-3xl font-semibold text-moss">
                  {loadedStudentStats?.totalClasses ?? studentStats?.totalClasses ?? 0}
                </div>
              </div>
            </div>
            <div className="relative overflow-hidden rounded-[24px] border border-ink/10 bg-gradient-to-br from-gold/10 to-paper p-6 shadow-soft">
              <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-gold/20 blur-2xl" />
              <div className="relative">
                <div className="mb-2 text-xs uppercase tracking-wider text-ink/60">
                  {locale === "pl" ? "Aktywne zadania" : "Активні завдання"}
                </div>
                <div className="text-3xl font-semibold text-gold">
                  {loadedStudentStats?.activeAssignments ?? studentStats?.activeAssignments ?? 0}
                </div>
              </div>
            </div>
          </>
        )}
        <div className="relative overflow-hidden rounded-[24px] border border-ink/10 bg-gradient-to-br from-gold/10 to-paper p-6 shadow-soft">
          <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-gold/20 blur-2xl" />
          <div className="relative">
            <div className="mb-2 text-xs uppercase tracking-wider text-ink/60">
              {locale === "pl" ? "Nadchodzące" : "Найближчі"}
            </div>
            <div className="text-3xl font-semibold text-gold">
              {upcomingEvents.length}
            </div>
          </div>
        </div>
        <div className="relative overflow-hidden rounded-[24px] border border-ink/10 bg-gradient-to-br from-terracotta/10 to-paper p-6 shadow-soft">
          <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-terracotta/20 blur-2xl" />
          <div className="relative">
            <div className="mb-2 text-xs uppercase tracking-wider text-ink/60">
              {locale === "pl" ? "Terminy" : "Дедлайни"}
            </div>
            <div className="text-3xl font-semibold text-terracotta">
              {urgentAssignments.length}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Upcoming Events */}
        <div className="rounded-[24px] border border-ink/10 bg-paper p-6 shadow-soft">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar size={20} weight="fill" className="text-moss" />
              <h3 className="font-semibold">
                {locale === "pl" ? "Nadchodzące wydarzenia" : "Найближчі події"}
              </h3>
            </div>
            <Link href={`${basePath}?tab=schedule`} className="text-sm text-moss hover:underline">
              {locale === "pl" ? "Zobacz wszystkie" : "Всі події"}
            </Link>
          </div>
          {upcomingEvents.length > 0 ? (
            <div className="space-y-2">
              {upcomingEvents.map((event: any) => (
                <div key={event._id} className="rounded-[16px] border border-ink/10 bg-ink/5 p-3">
                  <div className="font-medium">{event.title}</div>
                  <div className="text-sm text-ink/60">
                    {new Date(event.startTime).toLocaleString(locale === "pl" ? "pl-PL" : "uk-UA", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-sm text-ink/60">
              {locale === "pl" ? "Brak nadchodzących wydarzeń" : "Немає найближчих подій"}
            </div>
          )}
        </div>

        {/* Urgent Assignments / Recent Classes */}
        {isStudent && urgentAssignments.length > 0 ? (
          <div className="rounded-[24px] border border-ink/10 bg-paper p-6 shadow-soft">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Warning size={20} weight="fill" className="text-terracotta" />
                <h3 className="font-semibold">
                  {locale === "pl" ? "Pilne terminy" : "Термінові дедлайни"}
                </h3>
              </div>
              <Link href={`${basePath}?tab=assignments`} className="text-sm text-moss hover:underline">
                {locale === "pl" ? "Zobacz wszystkie" : "Всі завдання"}
              </Link>
            </div>
            <div className="space-y-2">
              {urgentAssignments.map((deadline: any) => (
                <Link
                  key={deadline.assignmentId}
                  href={`/classes/${deadline.classId}/assignments/${deadline.assignmentId}`}
                  className="block rounded-[16px] border border-ink/10 bg-ink/5 p-3 transition-all hover:shadow-soft"
                >
                  <div className="font-medium">{deadline.assignmentTitle}</div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-ink/60">{deadline.className}</span>
                    <span className={deadline.daysRemaining < 2 ? "text-terracotta" : "text-ink/60"}>
                      {deadline.daysRemaining === 0
                        ? (locale === "pl" ? "Dziś" : "Сьогодні")
                        : deadline.daysRemaining === 1
                          ? (locale === "pl" ? "Jutro" : "Завтра")
                          : `${deadline.daysRemaining} ${locale === "pl" ? "dni" : "днів"}`}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-[24px] border border-ink/10 bg-paper p-6 shadow-soft">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Books size={20} weight="fill" className="text-moss" />
                <h3 className="font-semibold">
                  {locale === "pl" ? "Moje klasy" : isTeacher ? "Мої класи" : "Мої класи"}
                </h3>
              </div>
              <Link href={`${basePath}?tab=classes`} className="text-sm text-moss hover:underline">
                {locale === "pl" ? "Zobacz wszystkie" : "Всі класи"}
              </Link>
            </div>
            {(isTeacher ? teacherClasses : studentClasses).length > 0 ? (
              <div className="space-y-2">
                {(isTeacher ? teacherClasses : studentClasses).slice(0, 5).map((cls: any) => (
                  <Link
                    key={cls._id}
                    href={`/classes/${cls._id}`}
                    className="block rounded-[16px] border border-ink/10 bg-ink/5 p-3 transition-all hover:shadow-soft"
                  >
                    <div className="font-medium">{cls.name}</div>
                    <div className="text-sm text-ink/60">
                      {isTeacher
                        ? `${cls.studentIds?.length || 0} ${locale === "pl" ? "uczniów" : "студентів"}`
                        : cls.teacherName}
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center">
                <p className="mb-4 text-sm text-ink/60">
                  {isTeacher
                    ? (locale === "pl" ? "Nie masz jeszcze klas" : "У вас ще немає класів")
                    : (locale === "pl" ? "Nie należysz do żadnej klasy" : "Ви не належите до жодного класу")}
                </p>
                <Link href={isTeacher ? "/classes/new" : "/classes/join"}>
                  <button className="rounded-full border border-moss/20 bg-moss px-6 py-2 font-semibold text-paper transition-all hover:bg-moss/90">
                    {isTeacher
                      ? (locale === "pl" ? "Utwórz klasę" : "Створити клас")
                      : (locale === "pl" ? "Dołącz do klasy" : "Приєднатися до класу")}
                  </button>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
