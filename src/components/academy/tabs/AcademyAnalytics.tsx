"use client";

import { useState, useEffect } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { ChartBar, TrendUp, CheckCircle, Clock } from "@phosphor-icons/react";

interface Props {
  isTeacher: boolean;
}

export default function AcademyAnalytics({ isTeacher }: Props) {
  const { t, locale } = useLocale();
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, [isTeacher]);

  async function loadAnalytics() {
    setLoading(true);
    try {
      if (isTeacher) {
        // Load teacher analytics
        const classesRes = await fetch("/api/classes");
        if (classesRes.ok) {
          const data = await classesRes.json();
          const classes = data.classes || [];

          const totalStudents = classes.reduce((sum: number, cls: any) => sum + (cls.studentIds?.length || 0), 0);
          const totalAssignments = classes.reduce((sum: number, cls: any) => sum + (cls.stats?.totalAssignments || 0), 0);

          setAnalytics({
            totalClasses: classes.length,
            totalStudents,
            totalAssignments,
            activeStudents: Math.round(totalStudents * 0.7), // Placeholder
            completionRate: 65 // Placeholder
          });
        }
      } else {
        // Load student analytics
        const studentRes = await fetch("/api/student/dashboard");
        if (studentRes.ok) {
          const data = await studentRes.json();
          setAnalytics(data.stats);
        }
      }
    } catch (error) {
      console.error("Failed to load analytics:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-ink/60">{locale === "pl" ? "Ładowanie..." : "Завантаження..."}</div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="rounded-[24px] border border-ink/10 bg-ink/5 p-12 text-center">
        <ChartBar size={48} weight="thin" className="mx-auto mb-4 text-ink/40" />
        <p className="text-ink/60">
          {locale === "pl" ? "Brak danych do wyświetlenia" : "Немає даних для відображення"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold">
          {locale === "pl" ? "Statystyki i analiza" : "Статистика та аналіз"}
        </h2>
        <p className="text-sm text-ink/60">
          {isTeacher
            ? (locale === "pl" ? "Przegląd wydajności wszystkich klas" : "Огляд ефективності всіх класів")
            : (locale === "pl" ? "Twój postęp w nauce" : "Ваш прогрес у навчанні")}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isTeacher ? (
          <>
            <div className="rounded-[24px] border border-ink/10 bg-gradient-to-br from-moss/10 to-paper p-6 shadow-soft">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm text-ink/60">{locale === "pl" ? "Klasy" : "Класи"}</span>
                <ChartBar size={20} weight="fill" className="text-moss" />
              </div>
              <div className="text-3xl font-semibold text-moss">{analytics.totalClasses}</div>
              <div className="mt-1 flex items-center gap-1 text-xs text-moss">
                <TrendUp size={14} weight="bold" />
                <span>{locale === "pl" ? "Aktywne" : "Активні"}</span>
              </div>
            </div>

            <div className="rounded-[24px] border border-ink/10 bg-gradient-to-br from-terracotta/10 to-paper p-6 shadow-soft">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm text-ink/60">{locale === "pl" ? "Studenci" : "Студенти"}</span>
                <ChartBar size={20} weight="fill" className="text-terracotta" />
              </div>
              <div className="text-3xl font-semibold text-terracotta">{analytics.totalStudents}</div>
              <div className="mt-1 text-xs text-ink/60">
                {analytics.activeStudents} {locale === "pl" ? "aktywnych" : "активних"}
              </div>
            </div>

            <div className="rounded-[24px] border border-ink/10 bg-gradient-to-br from-gold/10 to-paper p-6 shadow-soft">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm text-ink/60">{locale === "pl" ? "Zadania" : "Завдання"}</span>
                <ChartBar size={20} weight="fill" className="text-gold" />
              </div>
              <div className="text-3xl font-semibold text-gold">{analytics.totalAssignments}</div>
              <div className="mt-1 text-xs text-ink/60">
                {locale === "pl" ? "Łącznie utworzono" : "Всього створено"}
              </div>
            </div>

            <div className="rounded-[24px] border border-ink/10 bg-gradient-to-br from-moss/10 to-paper p-6 shadow-soft">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm text-ink/60">{locale === "pl" ? "Ukończenie" : "Виконання"}</span>
                <CheckCircle size={20} weight="fill" className="text-moss" />
              </div>
              <div className="text-3xl font-semibold text-moss">{analytics.completionRate}%</div>
              <div className="mt-1 text-xs text-ink/60">
                {locale === "pl" ? "Średnia" : "Середнє"}
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="rounded-[24px] border border-ink/10 bg-gradient-to-br from-moss/10 to-paper p-6 shadow-soft">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm text-ink/60">{locale === "pl" ? "Klasy" : "Класи"}</span>
                <ChartBar size={20} weight="fill" className="text-moss" />
              </div>
              <div className="text-3xl font-semibold text-moss">{analytics.totalClasses}</div>
            </div>

            <div className="rounded-[24px] border border-ink/10 bg-gradient-to-br from-gold/10 to-paper p-6 shadow-soft">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm text-ink/60">{locale === "pl" ? "Aktywne" : "Активні"}</span>
                <Clock size={20} weight="fill" className="text-gold" />
              </div>
              <div className="text-3xl font-semibold text-gold">{analytics.activeAssignments}</div>
            </div>

            <div className="rounded-[24px] border border-ink/10 bg-gradient-to-br from-terracotta/10 to-paper p-6 shadow-soft">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm text-ink/60">{locale === "pl" ? "Terminy" : "Дедлайни"}</span>
                <ChartBar size={20} weight="fill" className="text-terracotta" />
              </div>
              <div className="text-3xl font-semibold text-terracotta">{analytics.upcomingDeadlines}</div>
            </div>

            <div className="rounded-[24px] border border-ink/10 bg-gradient-to-br from-moss/10 to-paper p-6 shadow-soft">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm text-ink/60">{locale === "pl" ? "Średnia" : "Середня"}</span>
                <CheckCircle size={20} weight="fill" className="text-moss" />
              </div>
              <div className="text-3xl font-semibold text-moss">
                {analytics.averageGrade !== null ? `${analytics.averageGrade}%` : "—"}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Placeholder for charts */}
      <div className="rounded-[24px] border border-ink/10 bg-paper p-8 shadow-soft">
        <h3 className="mb-4 font-semibold">
          {locale === "pl" ? "Wykres wydajności" : "Графік ефективності"}
        </h3>
        <div className="flex h-64 items-center justify-center rounded-[16px] border border-dashed border-ink/20 bg-ink/5">
          <div className="text-center text-ink/40">
            <ChartBar size={48} weight="thin" className="mx-auto mb-2" />
            <p className="text-sm">
              {locale === "pl" ? "Wykres będzie dostępny wkrótce" : "Графік буде доступний незабаром"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
