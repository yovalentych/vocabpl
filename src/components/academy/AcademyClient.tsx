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
      const userRes = await fetch("/api/user/me");
      if (userRes.ok) {
        const userData = await userRes.json();
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
      <div className="mx-auto max-w-7xl p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-lg text-stone-600">
            {locale === "pl" ? "Ładowanie..." : "Завантаження..."}
          </div>
        </div>
      </div>
    );
  }

  // If user is neither teacher nor student
  if (!isTeacher && !isStudent) {
    return (
      <div className="mx-auto max-w-7xl p-6">
        <div className="mb-8">
          <h1 className="mb-2 text-4xl font-bold text-stone-900">
            {t.academy?.title || (locale === "pl" ? "Akademia" : "Академія")}
          </h1>
          <p className="text-lg text-stone-600">
            {locale === "pl"
              ? "Centrum edukacyjne dla nauczycieli i uczniów"
              : "Освітній центр для вчителів та учнів"}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Become a Teacher */}
          <div className="rounded-2xl border border-stone-200 bg-gradient-to-br from-amber-50 to-white p-8 shadow-sm">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-600 text-white">
              <Chalkboard size={32} weight="fill" />
            </div>
            <h2 className="mb-2 text-2xl font-bold text-stone-900">
              {locale === "pl" ? "Dla nauczycieli" : "Для вчителів"}
            </h2>
            <p className="mb-4 text-stone-600">
              {locale === "pl"
                ? "Twórz klasy, zadania i śledź postępy uczniów"
                : "Створюйте класи, завдання та відстежуйте прогрес студентів"}
            </p>
            <Link href="/cabinet">
              <button className="w-full rounded-xl bg-amber-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-amber-700">
                {locale === "pl" ? "Zostań nauczycielem" : "Стати вчителем"}
              </button>
            </Link>
          </div>

          {/* Join a Class */}
          <div className="rounded-2xl border border-stone-200 bg-gradient-to-br from-blue-50 to-white p-8 shadow-sm">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-white">
              <GraduationCap size={32} weight="fill" />
            </div>
            <h2 className="mb-2 text-2xl font-bold text-stone-900">
              {locale === "pl" ? "Dla uczniów" : "Для учнів"}
            </h2>
            <p className="mb-4 text-stone-600">
              {locale === "pl"
                ? "Dołącz do klasy i rozpocznij naukę"
                : "Приєднуйтесь до класу та почніть навчання"}
            </p>
            <Link href="/classes/join">
              <button className="w-full rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700">
                {locale === "pl" ? "Dołącz do klasy" : "Приєднатися до класу"}
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="mb-2 text-4xl font-bold text-stone-900">
          {t.academy?.title || (locale === "pl" ? "Akademia" : "Академія")}
        </h1>
        <p className="text-lg text-stone-600">
          {locale === "pl"
            ? "Twoje centrum edukacyjne"
            : "Ваш освітній центр"}
        </p>
      </div>

      {/* Tabs (if both roles) */}
      {hasBothRoles && (
        <div className="mb-6 flex gap-2 border-b border-stone-200">
          <button
            onClick={() => setActiveTab("teacher")}
            className={`px-6 py-3 font-semibold transition-colors ${
              activeTab === "teacher"
                ? "border-b-2 border-amber-600 text-amber-600"
                : "text-stone-600 hover:text-stone-900"
            }`}
          >
            <div className="flex items-center gap-2">
              <Chalkboard size={20} weight="fill" />
              {locale === "pl" ? "Panel nauczyciela" : "Панель вчителя"}
            </div>
          </button>
          <button
            onClick={() => setActiveTab("student")}
            className={`px-6 py-3 font-semibold transition-colors ${
              activeTab === "student"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-stone-600 hover:text-stone-900"
            }`}
          >
            <div className="flex items-center gap-2">
              <GraduationCap size={20} weight="fill" />
              {locale === "pl" ? "Panel ucznia" : "Панель учня"}
            </div>
          </button>
        </div>
      )}

      {/* Teacher Dashboard */}
      {((activeTab === "teacher" && hasBothRoles) || (isTeacher && !hasBothRoles)) && (
        <div>
          {/* Teacher Stats */}
          <div className="mb-6 grid gap-4 md:grid-cols-4">
            <div className="rounded-xl border border-stone-200 bg-gradient-to-br from-amber-50 to-white p-4 shadow-sm">
              <div className="mb-2 text-sm font-medium text-stone-600">
                {locale === "pl" ? "Klasy" : "Класи"}
              </div>
              <div className="text-3xl font-bold text-amber-600">
                {teacherProfile?.stats?.totalClasses || teacherClasses.length}
              </div>
            </div>
            <div className="rounded-xl border border-stone-200 bg-gradient-to-br from-blue-50 to-white p-4 shadow-sm">
              <div className="mb-2 text-sm font-medium text-stone-600">
                {locale === "pl" ? "Uczniowie" : "Студенти"}
              </div>
              <div className="text-3xl font-bold text-blue-600">
                {teacherProfile?.stats?.totalStudents || 0}
              </div>
            </div>
            <div className="rounded-xl border border-stone-200 bg-gradient-to-br from-green-50 to-white p-4 shadow-sm">
              <div className="mb-2 text-sm font-medium text-stone-600">
                {locale === "pl" ? "Zadania" : "Завдання"}
              </div>
              <div className="text-3xl font-bold text-green-600">
                {teacherProfile?.stats?.totalAssignments || 0}
              </div>
            </div>
            <div className="rounded-xl border border-stone-200 bg-gradient-to-br from-purple-50 to-white p-4 shadow-sm">
              <div className="mb-2 text-sm font-medium text-stone-600">
                {locale === "pl" ? "Plan" : "План"}
              </div>
              <div className="text-sm font-bold text-purple-600">
                {teacherProfile?.planId || "—"}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mb-6 flex flex-wrap gap-3">
            <Link href="/classes/new">
              <button className="flex items-center gap-2 rounded-xl bg-amber-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-amber-700">
                <Plus size={20} weight="bold" />
                {locale === "pl" ? "Utwórz klasę" : "Створити клас"}
              </button>
            </Link>
            <Link href="/classes">
              <button className="flex items-center gap-2 rounded-xl border-2 border-stone-300 bg-white px-6 py-3 font-semibold text-stone-700 transition-colors hover:bg-stone-50">
                <Books size={20} weight="fill" />
                {locale === "pl" ? "Wszystkie klasy" : "Всі класи"}
              </button>
            </Link>
            <Link href="/schedule">
              <button className="flex items-center gap-2 rounded-xl border-2 border-stone-300 bg-white px-6 py-3 font-semibold text-stone-700 transition-colors hover:bg-stone-50">
                <Calendar size={20} weight="fill" />
                {locale === "pl" ? "Harmonogram" : "Розклад"}
              </button>
            </Link>
          </div>

          {/* Teacher Classes List */}
          <div>
            <h2 className="mb-4 text-2xl font-bold text-stone-900">
              {locale === "pl" ? "Moje klasy" : "Мої класи"}
            </h2>
            {teacherClasses.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {teacherClasses.slice(0, 6).map((cls: any) => (
                  <Link key={cls._id} href={`/classes/${cls._id}`}>
                    <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
                      <h3 className="mb-2 text-lg font-semibold text-stone-900">{cls.name}</h3>
                      <div className="flex items-center gap-4 text-sm text-stone-600">
                        <span>{cls.studentIds?.length || 0} {locale === "pl" ? "uczniów" : "студентів"}</span>
                        <span>{cls.stats?.totalAssignments || 0} {locale === "pl" ? "zadań" : "завдань"}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-stone-200 bg-stone-50 p-8 text-center">
                <p className="mb-4 text-stone-600">
                  {locale === "pl" ? "Nie masz jeszcze żadnych klas" : "У вас ще немає класів"}
                </p>
                <Link href="/classes/new">
                  <button className="rounded-xl bg-amber-600 px-6 py-2 font-semibold text-white hover:bg-amber-700">
                    {locale === "pl" ? "Utwórz pierwszą klasę" : "Створити перший клас"}
                  </button>
                </Link>
              </div>
            )}
          </div>
        </div>
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
