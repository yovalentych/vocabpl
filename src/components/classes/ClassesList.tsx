"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Users, Plus, Archive, GraduationCap, Student, ChartBar, ClipboardText, CheckCircle } from "@phosphor-icons/react";

type ClassWithRole = {
  _id: string;
  name: string;
  description?: string;
  teacherName: string;
  students: any[];
  stats: {
    totalStudents: number;
    activeStudents: number;
    totalAssignments: number;
    completedAssignments: number;
  };
  myRole: 'teacher' | 'student';
  createdAt: string;
  archivedAt?: string;
};

type ClassesListProps = {
  locale: 'uk' | 'pl';
  isTeacher?: boolean;
};

export default function ClassesList({ locale, isTeacher = false }: ClassesListProps) {
  const [classes, setClasses] = useState<ClassWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'teacher' | 'student'>('all');
  const [showArchived, setShowArchived] = useState(false);
  const [sortBy, setSortBy] = useState<'recent' | 'name' | 'students'>('recent');

  const t = locale === 'uk' ? {
    title: "Мої класи",
    createClass: "Створити клас",
    noClasses: "У вас ще немає класів",
    noClassesDesc: "Створіть новий клас або приєднайтеся до існуючого",
    asTeacher: "Як викладач",
    asStudent: "Як студент",
    all: "Всі",
    students: "студентів",
    assignments: "завдань",
    active: "активних",
    archived: "Архівовані",
    joinClass: "Приєднатися до класу",
    teacher: "Викладач",
    overview: "Огляд",
    totalClasses: "Всього класів",
    totalStudents: "Всього студентів",
    totalAssignments: "Всього завдань",
    sortRecent: "Нещодавні",
    sortName: "За назвою",
    sortStudents: "За студентами",
    sortBy: "Сортувати"
  } : {
    title: "Moje klasy",
    createClass: "Utwórz klasę",
    noClasses: "Nie masz jeszcze klas",
    noClassesDesc: "Utwórz nową klasę lub dołącz do istniejącej",
    asTeacher: "Jako nauczyciel",
    asStudent: "Jako uczeń",
    all: "Wszystkie",
    students: "uczniów",
    assignments: "zadań",
    active: "aktywnych",
    archived: "Zarchiwizowane",
    joinClass: "Dołącz do klasy",
    teacher: "Nauczyciel",
    overview: "Przegląd",
    totalClasses: "Wszystkie klasy",
    totalStudents: "Wszyscy uczniowie",
    totalAssignments: "Wszystkie zadania",
    sortRecent: "Najnowsze",
    sortName: "Według nazwy",
    sortStudents: "Według uczniów",
    sortBy: "Sortuj"
  };

  // Calculate stats for teacher
  const stats = useMemo(() => {
    const teacherClasses = classes.filter(c => c.myRole === 'teacher');
    return {
      totalClasses: teacherClasses.length,
      totalStudents: teacherClasses.reduce((sum, c) => sum + c.stats.totalStudents, 0),
      totalAssignments: teacherClasses.reduce((sum, c) => sum + c.stats.totalAssignments, 0),
    };
  }, [classes]);

  // Sort classes
  const sortedClasses = useMemo(() => {
    const sorted = [...classes];
    if (sortBy === 'name') {
      sorted.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'students') {
      sorted.sort((a, b) => b.stats.totalStudents - a.stats.totalStudents);
    } else {
      sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return sorted;
  }, [classes, sortBy]);

  const showStats = filter === 'all' || filter === 'teacher';

  useEffect(() => {
    loadClasses();
  }, [filter, showArchived]);

  async function loadClasses() {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        role: filter,
        archived: showArchived.toString()
      });
      const res = await fetch(`/api/classes?${params}`);
      const data = await res.json();
      if (res.ok) {
        setClasses(data.classes || []);
      }
    } catch (error) {
      console.error("Failed to load classes:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-5 sm:px-6 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-ink">{t.title}</h1>
        <div className="flex gap-3">
          <Link
            href="/classes/join"
            className="inline-flex items-center gap-2 rounded-full border border-moss/30 bg-moss/10 px-5 py-2.5 text-sm font-semibold text-moss hover:bg-moss/20 transition-colors"
          >
            <Users size={18} weight="fill" />
            {t.joinClass}
          </Link>
          {isTeacher && (
            <Link
              href="/classes/new"
              className="inline-flex items-center gap-2 rounded-full border border-moss/30 bg-moss px-5 py-2.5 text-sm font-semibold text-white hover:bg-moss/90 transition-colors"
            >
              <Plus size={18} weight="bold" />
              {t.createClass}
            </Link>
          )}
        </div>
      </div>

      {/* Stats Overview (only for teachers) */}
      {!loading && showStats && stats.totalClasses > 0 && (
        <div className="grid gap-4 sm:grid-cols-3 mb-8">
          <div className="rounded-2xl border border-ink/10 bg-paper p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-moss/10">
                <GraduationCap size={22} weight="fill" className="text-moss" />
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.2em] text-ink/50">{t.totalClasses}</p>
                <p className="text-2xl font-bold text-ink">{stats.totalClasses}</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-ink/10 bg-paper p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gold/10">
                <Users size={22} weight="fill" className="text-gold" />
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.2em] text-ink/50">{t.totalStudents}</p>
                <p className="text-2xl font-bold text-ink">{stats.totalStudents}</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-ink/10 bg-paper p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-terracotta/10">
                <ClipboardText size={22} weight="fill" className="text-terracotta" />
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.2em] text-ink/50">{t.totalAssignments}</p>
                <p className="text-2xl font-bold text-ink">{stats.totalAssignments}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
              filter === 'all'
                ? 'bg-moss text-white'
                : 'bg-paper border border-ink/20 text-ink/70 hover:bg-moss/10'
            }`}
          >
            {t.all}
          </button>
          <button
            onClick={() => setFilter('teacher')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
              filter === 'teacher'
                ? 'bg-moss text-white'
                : 'bg-paper border border-ink/20 text-ink/70 hover:bg-moss/10'
            }`}
          >
            <GraduationCap size={16} weight="fill" />
            {t.asTeacher}
          </button>
          <button
            onClick={() => setFilter('student')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
              filter === 'student'
                ? 'bg-moss text-white'
                : 'bg-paper border border-ink/20 text-ink/70 hover:bg-moss/10'
            }`}
          >
            <Student size={16} weight="fill" />
            {t.asStudent}
          </button>
        </div>

        <label className="flex items-center gap-2 text-sm text-ink/70 cursor-pointer ml-auto">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(e) => setShowArchived(e.target.checked)}
            className="rounded border-ink/30"
          />
          <Archive size={16} />
          {t.archived}
        </label>

        <div className="flex items-center gap-2 text-sm">
          <ChartBar size={16} className="text-ink/50" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="rounded-full border border-ink/20 bg-paper px-3 py-1.5 text-sm text-ink/70 outline-none focus:border-moss/50 transition-colors"
          >
            <option value="recent">{t.sortRecent}</option>
            <option value="name">{t.sortName}</option>
            <option value="students">{t.sortStudents}</option>
          </select>
        </div>
      </div>

      {/* Classes Grid */}
      {loading ? (
        <div className="text-center py-12 text-ink/50">Завантаження...</div>
      ) : sortedClasses.length === 0 ? (
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-moss/10 mb-4">
            <Users size={32} className="text-moss" weight="fill" />
          </div>
          <h3 className="text-xl font-bold text-ink mb-2">{t.noClasses}</h3>
          <p className="text-ink/60 mb-6">{t.noClassesDesc}</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sortedClasses.map((cls) => (
            <a
              key={cls._id}
              href={`/classes/${cls._id}`}
              className="group relative rounded-[24px] border border-ink/10 bg-paper p-6 hover:border-moss/30 hover:shadow-lg transition-all block"
            >
              {/* Role Badge */}
              <div className="absolute top-4 right-4">
                {cls.myRole === 'teacher' ? (
                  <div className="inline-flex items-center gap-1 rounded-full bg-gold/10 px-3 py-1 text-xs font-semibold text-gold">
                    <GraduationCap size={12} weight="fill" />
                    {t.teacher}
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1 rounded-full bg-moss/10 px-3 py-1 text-xs font-semibold text-moss">
                    <Student size={12} weight="fill" />
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="pr-20">
                <h3 className="text-lg font-bold text-ink mb-1 group-hover:text-moss transition-colors">
                  {cls.name}
                </h3>
                {cls.description && (
                  <p className="text-sm text-ink/60 mb-3 line-clamp-2">
                    {cls.description}
                  </p>
                )}
              </div>

              {/* Stats */}
              <div className="flex flex-wrap gap-3 mt-4 text-xs text-ink/50">
                <div className="flex items-center gap-1">
                  <Users size={14} />
                  <span>{cls.stats.totalStudents} {t.students}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span>📝</span>
                  <span>{cls.stats.totalAssignments} {t.assignments}</span>
                </div>
              </div>

              {cls.archivedAt && (
                <div className="mt-3 text-xs text-terracotta font-semibold">
                  <Archive size={12} className="inline mr-1" />
                  {t.archived}
                </div>
              )}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
