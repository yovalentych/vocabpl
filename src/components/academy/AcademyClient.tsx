"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/components/LocaleProvider";
import StudentDashboardCard from "@/components/StudentDashboardCard";
import Link from "next/link";
import {
  Chalkboard,
  GraduationCap,
  Books,
  Calendar,
  ChartBar,
  Plus,
} from "@phosphor-icons/react";

type UserRole = "admin" | "tutor" | "user";

interface TeacherProfile {
  status: string;
  planId: string;
  fullName: string;
  stats: {
    totalClasses: number;
    totalStudents: number;
    totalAssignments: number;
  };
}

interface StudentStats {
  totalClasses: number;
  activeAssignments: number;
  upcomingDeadlines: number;
  averageGrade: number | null;
}

export default function AcademyClient() {
  const { t, locale } = useLocale();
  const [role, setRole] = useState<UserRole>("user");
  const [activeTab, setActiveTab] = useState<"teacher" | "student">("student");

  // Teacher data
  const [teacherProfile, setTeacherProfile] = useState<TeacherProfile | null>(null);
  const [teacherClasses, setTeacherClasses] = useState<any[]>([]);

  // Student data
  const [studentStats, setStudentStats] = useState<StudentStats | null>(null);
  const [studentClasses, setStudentClasses] = useState<any[]>([]);
  const [studentDeadlines, setStudentDeadlines] = useState<any[]>([]);
  const [studentGrades, setStudentGrades] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      // Load user role
      let userData: any = null;
      const userRes = await fetch("/api/user/me");
      if (userRes.ok) {
        userData = await userRes.json();
        setRole(userData.user?.role || "user");
      }

      // Load teacher data
      const teacherRes = await fetch("/api/teacher/status");
      if (teacherRes.ok) {
        const teacherData = await teacherRes.json();
        if (teacherData.teacherProfile) {
          setTeacherProfile(teacherData.teacherProfile);
          // Set default tab to teacher if user is a teacher
          if (userData?.user?.role === "tutor") {
            setActiveTab("teacher");
          }
        }
      }

      // Load teacher classes if tutor
      if (role === "tutor" || role === "admin") {
        const classesRes = await fetch("/api/classes");
        if (classesRes.ok) {
          const classesData = await classesRes.json();
          setTeacherClasses(classesData.classes || []);
        }
      }

      // Load student data
      const studentRes = await fetch("/api/student/dashboard");
      if (studentRes.ok) {
        const studentData = await studentRes.json();
        setStudentStats(studentData.stats);
        setStudentClasses(studentData.classes || []);
        setStudentDeadlines(studentData.upcomingDeadlines || []);
        setStudentGrades(studentData.recentGrades || []);
      }
    } catch (error) {
      console.error("Failed to load academy data:", error);
    } finally {
      setLoading(false);
    }
  }

  const isTeacher = role === "tutor" || role === "admin" || teacherProfile?.status === "active";
  const isStudent = studentStats && studentClasses.length > 0;
  const hasBothRoles = isTeacher && isStudent;

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl p-6 sm:p-8">
        <div className="flex items-center justify-center py-16">
          <div className="text-lg text-ink/60">
            {locale === "pl" ? "Ładowanie..." : "Завантаження..."}
          </div>
        </div>
      </div>
    );
  }

  // If user is neither teacher nor student
  if (!isTeacher && !isStudent) {
    return (
      <div className="mx-auto max-w-7xl space-y-10 p-6 sm:p-8">
        {/* Header */}
        <div className="relative overflow-hidden rounded-[32px] border border-ink/10 bg-gradient-to-br from-moss/10 to-terracotta/10 p-8 shadow-soft">
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gold/20 blur-3xl" />
          <div className="relative">
            <div className="flex items-center gap-2">
              <GraduationCap size={24} weight="fill" className="text-ink/60" />
              <p className="text-xs uppercase tracking-[0.3em] text-ink/60">
                {locale === "pl" ? "AKADEMIA" : "АКАДЕМІЯ"}
              </p>
            </div>
            <h1 className="mt-2 text-4xl font-semibold">
              {locale === "pl" ? "Akademia" : "Академія"}
            </h1>
            <p className="mt-2 text-ink/60">
              {locale === "pl"
                ? "Centrum edukacyjne dla nauczycieli i uczniów"
                : "Освітній центр для вчителів та учнів"}
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Become a Teacher */}
          <div className="group relative overflow-hidden rounded-[32px] border border-ink/10 bg-gradient-to-br from-moss/10 via-paper to-moss/5 p-8 shadow-soft transition-all hover:shadow-lg">
            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-moss/20 blur-2xl transition-all group-hover:bg-moss/30" />
            <div className="relative">
              <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-[20px] border border-moss/20 bg-moss/10">
                <Chalkboard size={32} weight="fill" className="text-moss" />
              </div>
              <h2 className="mb-3 text-2xl font-semibold">
                {locale === "pl" ? "Для вчителів" : "Для вчителів"}
              </h2>
              <p className="mb-6 text-ink/60">
                {locale === "pl"
                  ? "Twórz klasy, zadania i śledź postępy uczniów"
                  : "Створюйте класи, завдання та відстежуйте прогрес студентів"}
              </p>
              <Link href="/cabinet">
                <button className="w-full rounded-full border border-moss/20 bg-moss px-6 py-3 font-semibold text-paper transition-all hover:bg-moss/90 hover:shadow-md">
                  {locale === "pl" ? "Zostań nauczycielem" : "Стати вчителем"}
                </button>
              </Link>
            </div>
          </div>

          {/* Join a Class */}
          <div className="group relative overflow-hidden rounded-[32px] border border-ink/10 bg-gradient-to-br from-terracotta/10 via-paper to-terracotta/5 p-8 shadow-soft transition-all hover:shadow-lg">
            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-terracotta/20 blur-2xl transition-all group-hover:bg-terracotta/30" />
            <div className="relative">
              <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-[20px] border border-terracotta/20 bg-terracotta/10">
                <GraduationCap size={32} weight="fill" className="text-terracotta" />
              </div>
              <h2 className="mb-3 text-2xl font-semibold">
                {locale === "pl" ? "Dla uczniów" : "Для учнів"}
              </h2>
              <p className="mb-6 text-ink/60">
                {locale === "pl"
                  ? "Dołącz do klasy i rozpocznij naukę"
                  : "Приєднуйтесь до класу та почніть навчання"}
              </p>
              <Link href="/classes/join">
                <button className="w-full rounded-full border border-terracotta/20 bg-terracotta px-6 py-3 font-semibold text-paper transition-all hover:bg-terracotta/90 hover:shadow-md">
                  {locale === "pl" ? "Dołącz do klasy" : "Приєднатися до класу"}
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-10 p-6 sm:p-8">
      {/* Header */}
      <div className="relative overflow-hidden rounded-[32px] border border-ink/10 bg-gradient-to-br from-moss/10 to-terracotta/10 p-8 shadow-soft">
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gold/20 blur-3xl" />
        <div className="relative">
          <div className="flex items-center gap-2">
            <GraduationCap size={24} weight="fill" className="text-ink/60" />
            <p className="text-xs uppercase tracking-[0.3em] text-ink/60">
              {locale === "pl" ? "AKADEMIA" : "АКАДЕМІЯ"}
            </p>
          </div>
          <h1 className="mt-2 text-4xl font-semibold">
            {locale === "pl" ? "Akademia" : "Академія"}
          </h1>
          <p className="mt-2 text-ink/60">
            {locale === "pl"
              ? "Twoje centrum edukacyjne"
              : "Ваш освітній центр"}
          </p>
        </div>
      </div>

      {/* Tabs (if both roles) */}
      {hasBothRoles && (
        <div className="flex gap-3">
          <button
            onClick={() => setActiveTab("teacher")}
            className={`flex items-center gap-2 rounded-full px-6 py-3 font-semibold transition-all ${
              activeTab === "teacher"
                ? "border border-moss/20 bg-moss/10 text-moss shadow-sm"
                : "border border-ink/10 bg-paper text-ink/60 hover:bg-ink/5"
            }`}
          >
            <Chalkboard size={20} weight="fill" />
            {locale === "pl" ? "Викладач" : "Вчитель"}
          </button>
          <button
            onClick={() => setActiveTab("student")}
            className={`flex items-center gap-2 rounded-full px-6 py-3 font-semibold transition-all ${
              activeTab === "student"
                ? "border border-terracotta/20 bg-terracotta/10 text-terracotta shadow-sm"
                : "border border-ink/10 bg-paper text-ink/60 hover:bg-ink/5"
            }`}
          >
            <GraduationCap size={20} weight="fill" />
            {locale === "pl" ? "Студент" : "Учень"}
          </button>
        </div>
      )}

      {/* Teacher Dashboard */}
      {((activeTab === "teacher" && hasBothRoles) || (isTeacher && !hasBothRoles)) && (
        <section className="space-y-6">
          {/* Teacher Stats */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="relative overflow-hidden rounded-[24px] border border-ink/10 bg-gradient-to-br from-moss/10 to-paper p-6 shadow-soft">
              <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-moss/20 blur-2xl" />
              <div className="relative">
                <div className="mb-2 text-xs uppercase tracking-wider text-ink/60">
                  {locale === "pl" ? "Класи" : "Класи"}
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
                  {locale === "pl" ? "Студенти" : "Студенти"}
                </div>
                <div className="text-3xl font-semibold text-terracotta">
                  {teacherProfile?.stats?.totalStudents || 0}
                </div>
              </div>
            </div>
            <div className="relative overflow-hidden rounded-[24px] border border-ink/10 bg-gradient-to-br from-gold/10 to-paper p-6 shadow-soft">
              <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-gold/20 blur-2xl" />
              <div className="relative">
                <div className="mb-2 text-xs uppercase tracking-wider text-ink/60">
                  {locale === "pl" ? "Завдання" : "Завдання"}
                </div>
                <div className="text-3xl font-semibold text-gold">
                  {teacherProfile?.stats?.totalAssignments || 0}
                </div>
              </div>
            </div>
            <div className="relative overflow-hidden rounded-[24px] border border-ink/10 bg-gradient-to-br from-ink/5 to-paper p-6 shadow-soft">
              <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-ink/10 blur-2xl" />
              <div className="relative">
                <div className="mb-2 text-xs uppercase tracking-wider text-ink/60">
                  {locale === "pl" ? "План" : "План"}
                </div>
                <div className="text-sm font-semibold text-ink">
                  {teacherProfile?.planId || "—"}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-3">
            <Link href="/classes/new">
              <button className="flex items-center gap-2 rounded-full border border-moss/20 bg-moss px-6 py-3 font-semibold text-paper transition-all hover:bg-moss/90 hover:shadow-md">
                <Plus size={20} weight="bold" />
                {locale === "pl" ? "Utwórz klasę" : "Створити клас"}
              </button>
            </Link>
            <Link href="/classes">
              <button className="flex items-center gap-2 rounded-full border border-ink/10 bg-paper px-6 py-3 font-semibold text-ink transition-all hover:bg-ink/5 hover:shadow-sm">
                <Books size={20} weight="fill" />
                {locale === "pl" ? "Wszystkie klasy" : "Всі класи"}
              </button>
            </Link>
            <Link href="/schedule">
              <button className="flex items-center gap-2 rounded-full border border-ink/10 bg-paper px-6 py-3 font-semibold text-ink transition-all hover:bg-ink/5 hover:shadow-sm">
                <Calendar size={20} weight="fill" />
                {locale === "pl" ? "Harmonogram" : "Розклад"}
              </button>
            </Link>
          </div>

          {/* Teacher Classes List */}
          <div>
            <div className="mb-6 flex items-center gap-3">
              <Books size={24} weight="fill" className="text-moss" />
              <h2 className="text-2xl font-semibold">
                {locale === "pl" ? "Moje klasy" : "Мої класи"}
              </h2>
            </div>
            {teacherClasses.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {teacherClasses.slice(0, 6).map((cls: any) => (
                  <Link key={cls._id} href={`/classes/${cls._id}`}>
                    <div className="group relative overflow-hidden rounded-[24px] border border-ink/10 bg-paper p-6 shadow-soft transition-all hover:shadow-lg">
                      <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-moss/10 blur-xl transition-all group-hover:bg-moss/20" />
                      <div className="relative">
                        <h3 className="mb-3 text-lg font-semibold">{cls.name}</h3>
                        <div className="flex items-center gap-4 text-sm text-ink/60">
                          <span>{cls.studentIds?.length || 0} {locale === "pl" ? "uczniów" : "студентів"}</span>
                          <span>·</span>
                          <span>{cls.stats?.totalAssignments || 0} {locale === "pl" ? "zadań" : "завдань"}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="rounded-[24px] border border-ink/10 bg-ink/5 p-12 text-center">
                <p className="mb-6 text-ink/60">
                  {locale === "pl" ? "Nie masz jeszcze żadnych klas" : "У вас ще немає класів"}
                </p>
                <Link href="/classes/new">
                  <button className="rounded-full border border-moss/20 bg-moss px-8 py-3 font-semibold text-paper transition-all hover:bg-moss/90 hover:shadow-md">
                    {locale === "pl" ? "Utwórz pierwszą klasę" : "Створити перший клас"}
                  </button>
                </Link>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Student Dashboard */}
      {((activeTab === "student" && hasBothRoles) || (isStudent && !hasBothRoles)) && (
        <div>
          <StudentDashboardCard
            stats={studentStats!}
            classes={studentClasses}
            upcomingDeadlines={studentDeadlines}
            recentGrades={studentGrades}
          />
        </div>
      )}
    </div>
  );
}
