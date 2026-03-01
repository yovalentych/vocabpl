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
            <div className="rounded-2xl border border-ink/10 bg-paper p-6">
              <h3 className="font-bold text-ink mb-4">Recent Activity</h3>
              <p className="text-sm text-ink/60">Coming soon...</p>
            </div>
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
          <div className="rounded-2xl border border-ink/10 bg-paper p-6">
            <h3 className="font-bold text-ink mb-4">{t.settings}</h3>
            <p className="text-sm text-ink/60">Coming soon...</p>
          </div>
        )}
      </div>
    </div>
  );
}
