"use client";

import { useState, useEffect } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { ChartBar, TrendUp, CheckCircle, Clock, Users, ClipboardText } from "@phosphor-icons/react";

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
        const res = await fetch("/api/teacher/analytics");
        if (res.ok) {
          const data = await res.json();
          setAnalytics(data.analytics);
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
              <div className="mt-1 text-xs text-ink/60">
                {analytics.totalStudents} {locale === "pl" ? "uczniów łącznie" : "студентів загалом"}
              </div>
            </div>

            <div className="rounded-[24px] border border-ink/10 bg-gradient-to-br from-terracotta/10 to-paper p-6 shadow-soft">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm text-ink/60">{locale === "pl" ? "Aktywni" : "Активні"}</span>
                <Users size={20} weight="fill" className="text-terracotta" />
              </div>
              <div className="text-3xl font-semibold text-terracotta">{analytics.activeStudents}</div>
              <div className="mt-1 text-xs text-ink/60">
                {locale === "pl" ? "uczniów (30 dni)" : "студентів (30 днів)"}
              </div>
            </div>

            <div className="rounded-[24px] border border-ink/10 bg-gradient-to-br from-gold/10 to-paper p-6 shadow-soft">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm text-ink/60">{locale === "pl" ? "Zadania" : "Завдання"}</span>
                <ClipboardText size={20} weight="fill" className="text-gold" />
              </div>
              <div className="text-3xl font-semibold text-gold">{analytics.totalAssignments}</div>
              <div className="mt-1 text-xs text-ink/60">
                {analytics.gradedSubmissions} {locale === "pl" ? "ocenionych" : "оцінених"}
              </div>
            </div>

            <div className="rounded-[24px] border border-ink/10 bg-gradient-to-br from-moss/10 to-paper p-6 shadow-soft">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm text-ink/60">{locale === "pl" ? "Wynik śr." : "Сер. оцінка"}</span>
                <CheckCircle size={20} weight="fill" className="text-moss" />
              </div>
              <div className="text-3xl font-semibold text-moss">
                {analytics.averageScore > 0 ? `${analytics.averageScore}%` : "—"}
              </div>
              <div className="mt-1 text-xs text-ink/60">
                {analytics.completionRate}% {locale === "pl" ? "ukończenia" : "виконання"}
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

      {/* Recent Activity (teacher only) */}
      {isTeacher && analytics.recentActivity?.length > 0 && (
        <div className="rounded-[24px] border border-ink/10 bg-paper p-6 shadow-soft">
          <h3 className="mb-4 font-semibold">
            {locale === "pl" ? "Ostatnia aktywność" : "Остання активність"}
          </h3>
          <div className="space-y-3">
            {analytics.recentActivity.map((item: any, i: number) => (
              <div key={i} className="flex items-center justify-between rounded-[16px] border border-ink/10 bg-ink/5 px-4 py-3">
                <div>
                  <div className="font-medium text-sm">{item.studentName}</div>
                  <div className="text-xs text-ink/60">{item.assignmentTitle} · {item.className}</div>
                </div>
                <div className={`rounded-full px-3 py-1 text-sm font-semibold ${
                  item.percentage >= 80 ? "bg-moss/10 text-moss" :
                  item.percentage >= 60 ? "bg-gold/10 text-gold" :
                  "bg-terracotta/10 text-terracotta"
                }`}>
                  {item.percentage}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
