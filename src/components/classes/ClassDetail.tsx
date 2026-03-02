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
  Student,
  Copy,
  Check
} from "@phosphor-icons/react";
import type { Class } from "@/lib/classes";
import AssignmentsList from "./AssignmentsList";
import ClassStatistics from "./ClassStatistics";
import ClassSettings from "./ClassSettings";

type Tab = 'overview' | 'students' | 'assignments' | 'analytics' | 'settings';

type ClassDetailProps = {
  classId: string;
  locale: 'uk' | 'pl';
};

export default function ClassDetail({ classId, locale }: ClassDetailProps) {
  const [classData, setClassData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(false);

  // Check URL params for tab
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab') as Tab;
      if (tab && ['overview', 'students', 'assignments', 'analytics', 'settings'].includes(tab)) {
        setActiveTab(tab);
      }
    }
  }, []);

  const t = locale === 'uk' ? {
    backToClasses: "Назад до класів",
    overview: "Огляд",
    students: "Студенти",
    assignments: "Завдання",
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
    publicClass: "Публічний клас",
    privateClass: "Приватний клас",
    addStudent: "Додати студента",
    createAssignment: "Створити завдання",
    noStudents: "У класі ще немає студентів",
    noAssignments: "Ще немає завдань",
    joinedAt: "Приєднався"
  } : {
    backToClasses: "Powrót do klas",
    overview: "Przegląd",
    students: "Uczniowie",
    assignments: "Zadania",
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
    publicClass: "Klasa publiczna",
    privateClass: "Klasa prywatna",
    addStudent: "Dodaj ucznia",
    createAssignment: "Utwórz zadanie",
    noStudents: "W klasie nie ma jeszcze uczniów",
    noAssignments: "Nie ma jeszcze zadań",
    joinedAt: "Dołączył"
  };

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

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-6 py-10">
        <div className="text-center py-12 text-ink/50">Завантаження...</div>
      </div>
    );
  }

  if (!classData) {
    return (
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-6 py-10">
        <div className="text-center py-12 text-ink/50">Клас не знайдено</div>
      </div>
    );
  }

  const isTeacher = classData.myRole === 'teacher';

  return (
    <div className="mx-auto w-full max-w-6xl px-5 sm:px-6 py-10">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/classes"
          className="inline-flex items-center gap-2 text-sm text-ink/60 hover:text-ink transition-colors mb-4"
        >
          <ArrowLeft size={16} />
          {t.backToClasses}
        </Link>

        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-ink mb-2">{classData.name}</h1>
            {classData.description && (
              <p className="text-ink/60">{classData.description}</p>
            )}
            <div className="flex items-center gap-3 mt-3 text-sm">
              <div className="flex items-center gap-1.5 text-ink/50">
                <GraduationCap size={16} weight="fill" />
                {t.teacher}: {classData.teacherName}
              </div>
              {classData.settings.isPublic && (
                <span className="inline-flex items-center gap-1 rounded-full bg-moss/10 px-2.5 py-1 text-xs font-semibold text-moss">
                  {t.publicClass}
                </span>
              )}
            </div>
          </div>

          {/* Invite Code for Teacher */}
          {isTeacher && classData.settings.inviteCode && (
            <div className="rounded-2xl border border-moss/20 bg-moss/5 p-4">
              <div className="text-xs font-semibold text-moss/70 mb-1">
                {t.inviteCode}
              </div>
              <div className="flex items-center gap-2">
                <code className="text-xl font-mono font-bold text-moss">
                  {classData.settings.inviteCode}
                </code>
                <button
                  onClick={copyInviteCode}
                  className="rounded-lg border border-moss/30 bg-paper p-2 hover:bg-moss/10 transition-colors"
                  title={t.copyCode}
                >
                  {copiedCode ? (
                    <Check size={16} className="text-moss" weight="bold" />
                  ) : (
                    <Copy size={16} className="text-moss" />
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-4 mb-8">
        <div className="rounded-2xl border border-ink/10 bg-paper p-5">
          <div className="flex items-center gap-2 text-sm text-ink/60 mb-1">
            <Users size={16} />
            {t.totalStudents}
          </div>
          <div className="text-3xl font-bold text-ink">
            {classData.stats.totalStudents}
          </div>
        </div>
        <div className="rounded-2xl border border-ink/10 bg-paper p-5">
          <div className="flex items-center gap-2 text-sm text-ink/60 mb-1">
            <Student size={16} weight="fill" />
            {t.activeStudents}
          </div>
          <div className="text-3xl font-bold text-moss">
            {classData.stats.activeStudents}
          </div>
        </div>
        <div className="rounded-2xl border border-ink/10 bg-paper p-5">
          <div className="flex items-center gap-2 text-sm text-ink/60 mb-1">
            <ClipboardText size={16} />
            {t.totalAssignments}
          </div>
          <div className="text-3xl font-bold text-ink">
            {classData.stats.totalAssignments}
          </div>
        </div>
        <div className="rounded-2xl border border-ink/10 bg-paper p-5">
          <div className="flex items-center gap-2 text-sm text-ink/60 mb-1">
            <Check size={16} weight="bold" />
            {t.completedRate}
          </div>
          <div className="text-3xl font-bold text-gold">
            {classData.stats.totalAssignments > 0
              ? Math.round((classData.stats.completedAssignments / classData.stats.totalAssignments) * 100)
              : 0}%
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-ink/10 mb-6">
        <div className="flex gap-6">
          <button
            onClick={() => setActiveTab('overview')}
            className={`inline-flex items-center gap-2 px-1 py-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'overview'
                ? 'border-moss text-moss'
                : 'border-transparent text-ink/60 hover:text-ink'
            }`}
          >
            <ChartLine size={18} />
            {t.overview}
          </button>
          <button
            onClick={() => setActiveTab('students')}
            className={`inline-flex items-center gap-2 px-1 py-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'students'
                ? 'border-moss text-moss'
                : 'border-transparent text-ink/60 hover:text-ink'
            }`}
          >
            <Users size={18} />
            {t.students}
          </button>
          <button
            onClick={() => setActiveTab('assignments')}
            className={`inline-flex items-center gap-2 px-1 py-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'assignments'
                ? 'border-moss text-moss'
                : 'border-transparent text-ink/60 hover:text-ink'
            }`}
          >
            <ClipboardText size={18} />
            {t.assignments}
          </button>
          {isTeacher && (
            <>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`inline-flex items-center gap-2 px-1 py-3 text-sm font-semibold border-b-2 transition-colors ${
                  activeTab === 'analytics'
                    ? 'border-moss text-moss'
                    : 'border-transparent text-ink/60 hover:text-ink'
                }`}
              >
                <ChartLine size={18} />
                {t.analytics}
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`inline-flex items-center gap-2 px-1 py-3 text-sm font-semibold border-b-2 transition-colors ${
                  activeTab === 'settings'
                    ? 'border-moss text-moss'
                    : 'border-transparent text-ink/60 hover:text-ink'
                }`}
              >
                <Gear size={18} />
                {t.settings}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Students */}
              <div className="rounded-2xl border border-ink/10 bg-paper p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="rounded-full bg-moss/10 p-2">
                    <Users size={20} className="text-moss" weight="bold" />
                  </div>
                  <h3 className="text-sm font-medium text-ink/60">{t.totalStudents}</h3>
                </div>
                <p className="text-3xl font-bold text-ink">{classData.stats?.totalStudents || 0}</p>
              </div>

              {/* Total Assignments */}
              <div className="rounded-2xl border border-ink/10 bg-paper p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="rounded-full bg-gold/10 p-2">
                    <ClipboardText size={20} className="text-gold" weight="bold" />
                  </div>
                  <h3 className="text-sm font-medium text-ink/60">{t.totalAssignments}</h3>
                </div>
                <p className="text-3xl font-bold text-ink">{classData.stats?.totalAssignments || 0}</p>
              </div>

              {/* Completed Assignments */}
              <div className="rounded-2xl border border-ink/10 bg-paper p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="rounded-full bg-terracotta/10 p-2">
                    <Check size={20} className="text-terracotta" weight="bold" />
                  </div>
                  <h3 className="text-sm font-medium text-ink/60">{t.completedRate}</h3>
                </div>
                <p className="text-3xl font-bold text-ink">
                  {classData.stats?.totalAssignments > 0
                    ? Math.round((classData.stats?.completedAssignments / classData.stats?.totalAssignments) * 100)
                    : 0}%
                </p>
              </div>

              {/* Active Students */}
              <div className="rounded-2xl border border-ink/10 bg-paper p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="rounded-full bg-moss/10 p-2">
                    <GraduationCap size={20} className="text-moss" weight="bold" />
                  </div>
                  <h3 className="text-sm font-medium text-ink/60">{t.activeStudents}</h3>
                </div>
                <p className="text-3xl font-bold text-ink">
                  {classData.students?.filter((s: any) => {
                    const lastActive = s.lastActiveAt ? new Date(s.lastActiveAt) : null;
                    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                    return lastActive && lastActive > weekAgo;
                  }).length || 0}
                </p>
              </div>
            </div>

            {/* Quick Actions (for teachers) */}
            {isTeacher && (
              <div className="rounded-2xl border border-ink/10 bg-paper p-6">
                <h3 className="font-bold text-ink mb-4">
                  {locale === 'uk' ? 'Швидкі дії' : 'Szybkie akcje'}
                </h3>
                <div className="flex flex-wrap gap-3">
                  <Link
                    href={`/classes/${classId}/assignments/new`}
                    className="inline-flex items-center gap-2 rounded-full border border-moss/30 bg-moss px-5 py-2.5 text-sm font-semibold text-white hover:bg-moss/90 transition-colors"
                  >
                    <Plus size={18} weight="bold" />
                    {t.createAssignment}
                  </Link>
                  <Link
                    href={`/classes/${classId}/students/add`}
                    className="inline-flex items-center gap-2 rounded-full border border-ink/20 bg-paper px-5 py-2.5 text-sm font-semibold text-ink hover:bg-ink/5 transition-colors"
                  >
                    <Plus size={18} weight="bold" />
                    {t.addStudent}
                  </Link>
                  <button
                    onClick={() => setActiveTab('analytics')}
                    className="inline-flex items-center gap-2 rounded-full border border-ink/20 bg-paper px-5 py-2.5 text-sm font-semibold text-ink hover:bg-ink/5 transition-colors"
                  >
                    <ChartLine size={18} weight="bold" />
                    {locale === 'uk' ? 'Переглянути аналітику' : 'Zobacz analitykę'}
                  </button>
                </div>
              </div>
            )}

            {/* Class Info */}
            <div className="rounded-2xl border border-ink/10 bg-paper p-6">
              <h3 className="font-bold text-ink mb-4">
                {locale === 'uk' ? 'Інформація про клас' : 'Informacje o klasie'}
              </h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <GraduationCap size={20} className="text-ink/40 mt-0.5" />
                  <div>
                    <p className="text-xs text-ink/50">{t.teacher}</p>
                    <p className="text-sm font-medium text-ink">{classData.teacherName}</p>
                  </div>
                </div>

                {classData.description && (
                  <div className="flex items-start gap-3">
                    <ClipboardText size={20} className="text-ink/40 mt-0.5" />
                    <div>
                      <p className="text-xs text-ink/50">
                        {locale === 'uk' ? 'Опис' : 'Opis'}
                      </p>
                      <p className="text-sm text-ink">{classData.description}</p>
                    </div>
                  </div>
                )}

                {isTeacher && classData.settings?.inviteCode && (
                  <div className="flex items-start gap-3">
                    <Copy size={20} className="text-ink/40 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs text-ink/50 mb-1">{t.inviteCode}</p>
                      <div className="flex items-center gap-2">
                        <code className="text-sm font-mono font-bold text-moss bg-moss/5 px-3 py-1 rounded-lg">
                          {classData.settings.inviteCode}
                        </code>
                        <button
                          onClick={copyInviteCode}
                          className="inline-flex items-center gap-1 text-xs text-ink/60 hover:text-moss transition-colors"
                        >
                          {copiedCode ? (
                            <>
                              <Check size={14} weight="bold" />
                              {t.copied}
                            </>
                          ) : (
                            <>
                              <Copy size={14} />
                              {t.copyCode}
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    classData.settings?.isPublic
                      ? 'bg-moss/10 text-moss'
                      : 'bg-ink/10 text-ink/60'
                  }`}>
                    {classData.settings?.isPublic ? t.publicClass : t.privateClass}
                  </div>
                  {classData.archivedAt && (
                    <div className="px-3 py-1 rounded-full text-xs font-semibold bg-terracotta/10 text-terracotta">
                      {locale === 'uk' ? 'Архівовано' : 'Zarchiwizowano'}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Recent Students */}
            {classData.students && classData.students.length > 0 && (
              <div className="rounded-2xl border border-ink/10 bg-paper p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-ink">
                    {locale === 'uk' ? 'Останні студенти' : 'Ostatni uczniowie'}
                  </h3>
                  <button
                    onClick={() => setActiveTab('students')}
                    className="text-sm text-moss hover:text-moss/80 font-medium"
                  >
                    {locale === 'uk' ? 'Переглянути всіх' : 'Zobacz wszystkich'} →
                  </button>
                </div>
                <div className="space-y-2">
                  {classData.students.slice(0, 5).map((student: any) => (
                    <div
                      key={student.id}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-ink/5 transition-colors"
                    >
                      <div className="rounded-full bg-moss/10 p-2">
                        <Student size={18} className="text-moss" weight="bold" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-ink">{student.name || student.username}</p>
                        <p className="text-xs text-ink/50">
                          {t.joinedAt}: {new Date(student.joinedAt).toLocaleDateString(locale)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'students' && (
          <div>
            {isTeacher && (
              <div className="mb-6">
                <button
                  onClick={() => window.location.href = `/classes/${classId}/students/add`}
                  className="inline-flex items-center gap-2 rounded-full border border-moss/30 bg-moss px-5 py-2.5 text-sm font-semibold text-white hover:bg-moss/90 transition-colors"
                >
                  <Plus size={18} weight="bold" />
                  {t.addStudent}
                </button>
              </div>
            )}

            {classData.students.length === 0 ? (
              <div className="rounded-2xl border border-ink/10 bg-paper p-12 text-center">
                <Users size={48} className="mx-auto mb-4 text-ink/30" />
                <p className="text-ink/60">{t.noStudents}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {classData.students.map((student: any) => (
                  <div
                    key={student.id}
                    className="rounded-2xl border border-ink/10 bg-paper p-4 flex items-center justify-between"
                  >
                    <div>
                      <div className="font-semibold text-ink">{student.name}</div>
                      <div className="text-sm text-ink/50">@{student.username}</div>
                    </div>
                    <div className="text-xs text-ink/40">
                      {t.joinedAt}: {new Date(student.joinedAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'assignments' && (
          <div>
            {isTeacher && (
              <div className="mb-6">
                <button
                  onClick={() => window.location.href = `/classes/${classId}/assignments/new`}
                  className="inline-flex items-center gap-2 rounded-full border border-moss/30 bg-moss px-5 py-2.5 text-sm font-semibold text-white hover:bg-moss/90 transition-colors"
                >
                  <Plus size={18} weight="bold" />
                  {t.createAssignment}
                </button>
              </div>
            )}

            <AssignmentsList classId={classId} isTeacher={isTeacher} locale={locale} />
          </div>
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
    </div>
  );
}
