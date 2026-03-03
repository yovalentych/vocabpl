"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Users,
  ClipboardText,
  ChartLine,
  Gear,
  Plus,
  GraduationCap,
  Copy,
  Check,
  Calendar,
  House,
  Books,
  CheckCircle
} from "@phosphor-icons/react";
import type { Class } from "@/lib/classes";
import AssignmentsList from "./AssignmentsList";
import ClassStatistics from "./ClassStatistics";
import ClassSettings from "./ClassSettings";
import SimpleCalendar from "./SimpleCalendar";
import CreateEventModal from "./CreateEventModal";
import StudentOverview from "./StudentOverview";
import StudentProgress from "./StudentProgress";

type Tab = 'overview' | 'students' | 'assignments' | 'schedule' | 'progress' | 'analytics' | 'settings';

type ClassDetailProps = {
  classId: string;
  locale: 'uk' | 'pl';
};

export default function ClassDetailOptimized({ classId, locale }: ClassDetailProps) {
  const [classData, setClassData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(false);
  const [showCreateEvent, setShowCreateEvent] = useState(false);

  const t = locale === 'uk' ? {
    backToAcademy: "Назад до Академії",
    overview: "Огляд",
    students: "Студенти",
    assignments: "Завдання",
    schedule: "Розклад",
    progress: "Мій прогрес",
    analytics: "Аналітика",
    settings: "Налаштування",
    teacher: "Викладач",
    totalStudents: "Всього студентів",
    activeStudents: "Активних",
    totalAssignments: "Завдань",
    completedRate: "Виконано",
    inviteCode: "Код запрошення",
    copyCode: "Скопіювати",
    copied: "Скопійовано!",
    publicClass: "Публічний",
    privateClass: "Приватний",
    addStudent: "Додати студента",
    createAssignment: "Створити завдання",
    noStudents: "У класі ще немає студентів",
    noAssignments: "Ще немає завдань",
    joinedAt: "Приєднався",
    quickActions: "Швидкі дії",
    viewAnalytics: "Переглянути аналітику",
    classInfo: "Інформація про клас",
    description: "Опис",
    recentStudents: "Останні студенти",
    viewAll: "Переглянути всіх",
    loading: "Завантаження...",
    classNotFound: "Клас не знайдено"
  } : {
    backToAcademy: "Powrót do Akademii",
    overview: "Przegląd",
    students: "Uczniowie",
    assignments: "Zadania",
    schedule: "Harmonogram",
    progress: "Mój postęp",
    analytics: "Analityka",
    settings: "Ustawienia",
    teacher: "Nauczyciel",
    totalStudents: "Łącznie uczniów",
    activeStudents: "Aktywnych",
    totalAssignments: "Zadań",
    completedRate: "Ukończono",
    inviteCode: "Kod zaproszenia",
    copyCode: "Kopiuj",
    copied: "Skopiowano!",
    publicClass: "Publiczna",
    privateClass: "Prywatna",
    addStudent: "Dodaj ucznia",
    createAssignment: "Utwórz zadanie",
    noStudents: "W klasie nie ma jeszcze uczniów",
    noAssignments: "Nie ma jeszcze zadań",
    joinedAt: "Dołączył",
    quickActions: "Szybkie akcje",
    viewAnalytics: "Zobacz analitykę",
    classInfo: "Informacje o klasie",
    description: "Opis",
    recentStudents: "Ostatni uczniowie",
    viewAll: "Zobacz wszystkich",
    loading: "Ładowanie...",
    classNotFound: "Klasa nie znaleziona"
  };

  // Check URL params for tab
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab') as Tab;
      if (tab && ['overview', 'students', 'assignments', 'schedule', 'progress', 'analytics', 'settings'].includes(tab)) {
        setActiveTab(tab);
      }
    }
  }, []);

  useEffect(() => {
    loadClass();
  }, [classId]);

  async function loadClass() {
    try {
      setLoading(true);
      const res = await fetch(`/api/classes/${classId}`);
      const data = await res.json();
      if (res.ok) {
        setClassData(data.class);
      }
    } catch (error) {
      console.error("Failed to load class:", error);
    } finally {
      setLoading(false);
    }
  }

  async function copyInviteCode() {
    if (classData?.settings?.inviteCode) {
      await navigator.clipboard.writeText(classData.settings.inviteCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
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

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl space-y-10 p-6 sm:p-8">
        <div className="flex items-center justify-center py-16">
          <div className="text-lg text-ink/60">{t.loading}</div>
        </div>
      </div>
    );
  }

  if (!classData) {
    return (
      <div className="mx-auto max-w-7xl space-y-10 p-6 sm:p-8">
        <div className="flex items-center justify-center py-16">
          <div className="text-lg text-ink/60">{t.classNotFound}</div>
        </div>
      </div>
    );
  }

  const isTeacher = classData.myRole === 'teacher';

  const tabs: { id: Tab; icon: any; teacherOnly?: boolean; studentOnly?: boolean }[] = [
    { id: 'overview', icon: House },
    { id: 'students', icon: Users },
    { id: 'assignments', icon: ClipboardText },
    { id: 'schedule', icon: Calendar },
    { id: 'progress', icon: ChartLine, studentOnly: true },
    { id: 'analytics', icon: ChartLine, teacherOnly: true },
    { id: 'settings', icon: Gear, teacherOnly: true }
  ];

  const visibleTabs = tabs.filter(tab =>
    (!tab.teacherOnly && !tab.studentOnly) ||
    (tab.teacherOnly && isTeacher) ||
    (tab.studentOnly && !isTeacher)
  );

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-6 sm:p-8">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm">
        <Link href="/school/teacher" className="flex items-center gap-1 text-ink/60 transition-colors hover:text-moss">
          <House size={16} weight="fill" />
          <span>{locale === 'uk' ? 'Школа' : 'Szkoła'}</span>
        </Link>
        <span className="text-ink/30">/</span>
        <Link href="/school/teacher?tab=classes" className="flex items-center gap-1 text-ink/60 transition-colors hover:text-moss">
          <Books size={16} weight="fill" />
          <span>{locale === 'uk' ? 'Класи' : 'Klasy'}</span>
        </Link>
        <span className="text-ink/30">/</span>
        <span className="font-medium text-ink">{classData.name}</span>
      </nav>

      {/* Header */}
      <div className="relative overflow-hidden rounded-[32px] border border-ink/10 bg-gradient-to-br from-moss/10 to-terracotta/10 p-8 shadow-soft">
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gold/20 blur-3xl" />
        <div className="relative">
          <div className="flex items-start justify-between gap-6">
            <div className="flex-1">
              <div className="mb-2 flex items-center gap-2">
                <Books size={24} weight="fill" className="text-ink/60" />
                <p className="text-xs uppercase tracking-[0.3em] text-ink/60">
                  {locale === 'uk' ? 'КЛАС' : 'KLASA'}
                </p>
              </div>
              <h1 className="text-4xl font-semibold">{classData.name}</h1>
              {classData.description && (
                <p className="mt-2 text-ink/60">{classData.description}</p>
              )}
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 text-sm text-ink/60">
                  <GraduationCap size={18} weight="fill" />
                  <span>{classData.teacherName}</span>
                </div>
                <div className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                  classData.settings?.isPublic
                    ? 'border-moss/20 bg-moss/10 text-moss'
                    : 'border-ink/10 bg-ink/5 text-ink/60'
                }`}>
                  {classData.settings?.isPublic ? t.publicClass : t.privateClass}
                </div>
              </div>
            </div>

            {/* Invite Code */}
            {isTeacher && classData.settings?.inviteCode && (
              <div className="rounded-[20px] border border-moss/20 bg-moss/5 p-5">
                <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-moss/70">
                  {t.inviteCode}
                </div>
                <div className="flex items-center gap-2">
                  <code className="rounded-lg bg-moss/10 px-4 py-2 font-mono text-2xl font-bold text-moss">
                    {classData.settings.inviteCode}
                  </code>
                  <button
                    onClick={copyInviteCode}
                    className="rounded-full border border-moss/20 bg-paper p-2.5 transition-all hover:bg-moss/10 hover:shadow-sm"
                    title={t.copyCode}
                  >
                    {copiedCode ? (
                      <Check size={20} className="text-moss" weight="bold" />
                    ) : (
                      <Copy size={20} className="text-moss" />
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative overflow-hidden rounded-[24px] border border-ink/10 bg-gradient-to-br from-moss/10 to-paper p-6 shadow-soft">
          <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-moss/20 blur-2xl" />
          <div className="relative">
            <div className="mb-2 text-xs uppercase tracking-wider text-ink/60">
              {t.totalStudents}
            </div>
            <div className="text-3xl font-semibold text-moss">
              {classData.stats?.totalStudents || 0}
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[24px] border border-ink/10 bg-gradient-to-br from-terracotta/10 to-paper p-6 shadow-soft">
          <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-terracotta/20 blur-2xl" />
          <div className="relative">
            <div className="mb-2 text-xs uppercase tracking-wider text-ink/60">
              {t.activeStudents}
            </div>
            <div className="text-3xl font-semibold text-terracotta">
              {classData.students?.filter((s: any) => {
                const lastActive = s.lastActiveAt ? new Date(s.lastActiveAt) : null;
                const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                return lastActive && lastActive > weekAgo;
              }).length || 0}
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[24px] border border-ink/10 bg-gradient-to-br from-gold/10 to-paper p-6 shadow-soft">
          <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-gold/20 blur-2xl" />
          <div className="relative">
            <div className="mb-2 text-xs uppercase tracking-wider text-ink/60">
              {t.totalAssignments}
            </div>
            <div className="text-3xl font-semibold text-gold">
              {classData.stats?.totalAssignments || 0}
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[24px] border border-ink/10 bg-gradient-to-br from-moss/10 to-paper p-6 shadow-soft">
          <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-moss/20 blur-2xl" />
          <div className="relative">
            <div className="mb-2 text-xs uppercase tracking-wider text-ink/60">
              {t.completedRate}
            </div>
            <div className="text-3xl font-semibold text-moss">
              {classData.stats?.totalAssignments > 0
                ? Math.round((classData.stats.completedAssignments / classData.stats.totalAssignments) * 100)
                : 0}%
            </div>
          </div>
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
              <span>{t[tab.id]}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'overview' && (
          isTeacher ? (
            <div className="space-y-6">
              {/* Quick Actions */}
              <div className="flex flex-wrap gap-3">
                <Link
                  href={`/classes/${classId}/assignments/new`}
                  className="inline-flex items-center gap-2 rounded-full border border-moss/20 bg-moss px-6 py-3 font-semibold text-paper transition-all hover:bg-moss/90 hover:shadow-md"
                >
                  <Plus size={20} weight="bold" />
                  {t.createAssignment}
                </Link>
                <Link
                  href={`/classes/${classId}/students/add`}
                  className="inline-flex items-center gap-2 rounded-full border border-ink/10 bg-paper px-6 py-3 font-semibold text-ink transition-all hover:bg-ink/5 hover:shadow-sm"
                >
                  <Plus size={20} weight="bold" />
                  {t.addStudent}
                </Link>
                <button
                  onClick={() => handleTabChange('analytics')}
                  className="inline-flex items-center gap-2 rounded-full border border-ink/10 bg-paper px-6 py-3 font-semibold text-ink transition-all hover:bg-ink/5 hover:shadow-sm"
                >
                  <ChartLine size={20} weight="bold" />
                  {t.viewAnalytics}
                </button>
              </div>

              {/* Recent Students */}
              {classData.students && classData.students.length > 0 && (
                <div className="rounded-[24px] border border-ink/10 bg-paper p-6 shadow-soft">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="font-semibold">{t.recentStudents}</h3>
                    <button
                      onClick={() => handleTabChange('students')}
                      className="text-sm font-medium text-moss transition-colors hover:text-moss/80"
                    >
                      {t.viewAll} →
                    </button>
                  </div>
                  <div className="space-y-2">
                    {classData.students.slice(0, 5).map((student: any) => (
                      <div
                        key={student.id}
                        className="flex items-center gap-3 rounded-[16px] border border-ink/10 bg-ink/5 p-3 transition-all hover:bg-moss/5"
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-moss/20 bg-moss/10">
                          <Users size={18} className="text-moss" weight="fill" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{student.name || student.username}</p>
                          <p className="text-xs text-ink/60">
                            {t.joinedAt}: {new Date(student.joinedAt).toLocaleDateString(locale === 'uk' ? 'uk-UA' : 'pl-PL')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <StudentOverview classId={classId} classData={classData} locale={locale} />
          )
        )}

        {activeTab === 'students' && (
          <div className="space-y-4">
            {isTeacher && (
              <div className="flex gap-3">
                <Link
                  href={`/classes/${classId}/students/add`}
                  className="inline-flex items-center gap-2 rounded-full border border-moss/20 bg-moss px-6 py-3 font-semibold text-paper transition-all hover:bg-moss/90 hover:shadow-md"
                >
                  <Plus size={20} weight="bold" />
                  {t.addStudent}
                </Link>
              </div>
            )}

            {classData.students?.length === 0 ? (
              <div className="rounded-[24px] border border-ink/10 bg-ink/5 p-12 text-center">
                <Users size={48} weight="thin" className="mx-auto mb-4 text-ink/40" />
                <p className="text-ink/60">{t.noStudents}</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {classData.students?.map((student: any) => (
                  <div
                    key={student.id}
                    className="rounded-[24px] border border-ink/10 bg-paper p-6 shadow-soft"
                  >
                    <div className="mb-3 flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold">{student.name || student.username}</h3>
                        <p className="text-sm text-ink/60">@{student.username}</p>
                      </div>
                      <div className="flex h-10 w-10 items-center justify-center rounded-full border border-moss/20 bg-moss/10">
                        <Users size={20} weight="fill" className="text-moss" />
                      </div>
                    </div>
                    <div className="text-xs text-ink/60">
                      {t.joinedAt}: {new Date(student.joinedAt).toLocaleDateString(locale === 'uk' ? 'uk-UA' : 'pl-PL')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'assignments' && (
          <div className="space-y-4">
            {isTeacher && (
              <Link
                href={`/classes/${classId}/assignments/new`}
                className="inline-flex items-center gap-2 rounded-full border border-moss/20 bg-moss px-6 py-3 font-semibold text-paper transition-all hover:bg-moss/90 hover:shadow-md"
              >
                <Plus size={20} weight="bold" />
                {t.createAssignment}
              </Link>
            )}
            <AssignmentsList classId={classId} isTeacher={isTeacher} locale={locale} />
          </div>
        )}

        {activeTab === 'schedule' && (
          <SimpleCalendar
            classId={classId}
            locale={locale}
            isTeacher={isTeacher}
            onCreateEvent={() => setShowCreateEvent(true)}
            onEventClick={(event) => console.log("Event clicked:", event)}
          />
        )}

        {activeTab === 'progress' && !isTeacher && (
          <StudentProgress classId={classId} locale={locale} />
        )}

        {activeTab === 'analytics' && isTeacher && (
          <ClassStatistics classId={classId} locale={locale} />
        )}

        {activeTab === 'settings' && isTeacher && (
          <ClassSettings
            classId={classId}
            classData={{
              name: classData.name,
              description: classData.description,
              settings: classData.settings,
              stats: {
                totalAssignments: classData.stats.totalAssignments,
                completedAssignments: classData.stats.completedAssignments
              }
            }}
            locale={locale}
            onUpdate={loadClass}
          />
        )}
      </div>

      {/* Create Event Modal */}
      {showCreateEvent && (
        <CreateEventModal
          classId={classId}
          locale={locale}
          onClose={() => setShowCreateEvent(false)}
          onSuccess={() => {
            setShowCreateEvent(false);
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}
