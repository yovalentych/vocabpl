"use client";

import { useState, useEffect } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { useAuthStatus } from "@/components/useAuthStatus";
import Link from "next/link";
import {
  GraduationCap,
  ChartBar,
  Books,
  Calendar,
  ClipboardText,
  Users,
  Chalkboard,
  House,
  Lightning,
} from "@phosphor-icons/react";

// Tab components
import AcademyOverview from "./tabs/AcademyOverview";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import AcademyClasses from "./tabs/AcademyClasses";
import AcademySchedule from "./tabs/AcademySchedule";
import AcademyAssignments from "./tabs/AcademyAssignments";
import AcademyStudents from "./tabs/AcademyStudents";
import AcademyAnalytics from "./tabs/AcademyAnalytics";
import AcademyPractice from "./tabs/AcademyPractice";

type Tab = "overview" | "classes" | "schedule" | "assignments" | "students" | "analytics" | "practice";

export default function AcademyLayout() {
  const { t, locale } = useLocale();
  const auth = useAuthStatus();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [role, setRole] = useState<"admin" | "tutor" | "user">("user");
  const [teacherProfile, setTeacherProfile] = useState<any>(null);
  const [studentStats, setStudentStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const isTeacher = role === "tutor" || role === "admin" || teacherProfile?.status === "active";
  const isStudent = studentStats && studentStats.totalClasses > 0;

  // Check URL params for tab
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get("tab") as Tab;
      if (tab && ["overview", "classes", "schedule", "assignments", "students", "analytics", "practice"].includes(tab)) {
        setActiveTab(tab);
      }
    }
  }, []);

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
        }
      }

      // Load student data
      const studentRes = await fetch("/api/student/dashboard");
      if (studentRes.ok) {
        const studentData = await studentRes.json();
        setStudentStats(studentData.stats);
      }
    } catch (error) {
      console.error("Failed to load academy data:", error);
    } finally {
      setLoading(false);
    }
  }

  // Update URL when tab changes
  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", tab);
      window.history.pushState({}, "", url);
    }
  };

  const tabs: {
    id: Tab;
    icon: any;
    labelUk: string;
    labelPl: string;
    teacherOnly?: boolean;
    badge?: number;
  }[] = [
    { id: "overview", icon: House, labelUk: "Огляд", labelPl: "Przegląd" },
    { id: "classes", icon: Books, labelUk: "Класи", labelPl: "Klasy" },
    { id: "schedule", icon: Calendar, labelUk: "Розклад", labelPl: "Harmonogram" },
    { id: "assignments", icon: ClipboardText, labelUk: "Завдання", labelPl: "Zadania" },
    { id: "students", icon: Users, labelUk: "Студенти", labelPl: "Uczniowie", teacherOnly: true },
    { id: "analytics", icon: ChartBar, labelUk: "Аналітика", labelPl: "Analityka" },
    { id: "practice", icon: Lightning, labelUk: "Практика", labelPl: "Praktyka" },
  ];

  const visibleTabs = tabs.filter(tab => !tab.teacherOnly || isTeacher);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl space-y-10 p-6 sm:p-8">
        <div className="flex items-center justify-center py-16">
          <div className="text-lg text-ink/60">
            {locale === "pl" ? "Ładowanie..." : "Завантаження..."}
          </div>
        </div>
      </div>
    );
  }

  // If user is neither teacher nor student - show onboarding
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
                {locale === "pl" ? "SZKOŁA" : "ШКОЛА"}
              </p>
            </div>
            <h1 className="mt-2 text-4xl font-semibold">
              {locale === "pl" ? "Szkoła" : "Школа"}
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
                {locale === "pl" ? "Для вчителів" : "Dla nauczycieli"}
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
    <div className="mx-auto max-w-7xl space-y-8 p-6 sm:p-8">
      {/* Breadcrumbs */}
      <Breadcrumbs items={[
        { label: locale === "pl" ? "Szkoła" : "Школа", href: "/school" },
        { label: isTeacher && !isStudent
            ? (locale === "pl" ? "Panel nauczyciela" : "Панель вчителя")
            : (locale === "pl" ? "Panel ucznia" : "Панель учня") },
      ]} />

      {/* Header */}
      <div className="relative overflow-hidden rounded-[32px] border border-ink/10 bg-gradient-to-br from-moss/10 to-terracotta/10 p-8 shadow-soft">
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gold/20 blur-3xl" />
        <div className="relative">
          <h1 className="text-4xl font-semibold">
            {isTeacher && !isStudent
              ? (locale === "pl" ? "Panel nauczyciela" : "Панель вчителя")
              : !isTeacher && isStudent
                ? (locale === "pl" ? "Panel ucznia" : "Панель учня")
                : (locale === "pl" ? "Szkoła" : "Школа")}
          </h1>
          <p className="mt-2 text-ink/60">
            {isTeacher && !isStudent
              ? (locale === "pl" ? "Zarządzaj klasami i zadaniami" : "Керуйте класами та завданнями")
              : !isTeacher && isStudent
                ? (locale === "pl" ? "Twoja nauka i postępy" : "Ваше навчання та прогрес")
                : (locale === "pl" ? "Twoje centrum edukacyjne" : "Ваш освітній центр")}
          </p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {visibleTabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex items-center gap-2 whitespace-nowrap rounded-full px-6 py-3 font-semibold transition-all ${
                isActive
                  ? "border border-moss/20 bg-moss/10 text-moss shadow-sm"
                  : "border border-ink/10 bg-paper text-ink/60 hover:bg-ink/5"
              }`}
            >
              <Icon size={20} weight={isActive ? "fill" : "regular"} />
              <span>{locale === "pl" ? tab.labelPl : tab.labelUk}</span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className="ml-1 rounded-full bg-terracotta px-2 py-0.5 text-xs font-semibold text-paper">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === "overview" && <AcademyOverview isTeacher={isTeacher} isStudent={isStudent} teacherProfile={teacherProfile} studentStats={studentStats} />}
        {activeTab === "classes" && <AcademyClasses isTeacher={isTeacher} />}
        {activeTab === "schedule" && <AcademySchedule isTeacher={isTeacher} />}
        {activeTab === "assignments" && <AcademyAssignments isTeacher={isTeacher} />}
        {activeTab === "students" && isTeacher && <AcademyStudents />}
        {activeTab === "analytics" && <AcademyAnalytics isTeacher={isTeacher} />}
        {activeTab === "practice" && <AcademyPractice />}
      </div>
    </div>
  );
}
