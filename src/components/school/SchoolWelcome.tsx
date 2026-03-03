"use client";

import { useState, useEffect } from "react";
import { useLocale } from "@/components/LocaleProvider";
import Link from "next/link";
import {
  Chalkboard,
  Student,
  Books,
  Users,
  ClipboardText,
  ChartBar,
  ArrowRight,
  GraduationCap
} from "@phosphor-icons/react";

export default function SchoolWelcome() {
  const { locale } = useLocale();
  const [isTeacher, setIsTeacher] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminSettings, setAdminSettings] = useState({
    teacherModeEnabled: false,
    studentModeEnabled: false
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUserStatus();
  }, []);

  async function checkUserStatus() {
    setLoading(true);
    try {
      const response = await fetch("/api/auth/me");
      if (response.ok) {
        const data = await response.json();
        const isAdminUser = data.role === "admin";
        setIsTeacher(data.role === "tutor" || isAdminUser);
        setIsAdmin(isAdminUser);

        // Load admin settings from localStorage if admin
        if (isAdminUser) {
          const saved = localStorage.getItem("adminSettings");
          if (saved) {
            setAdminSettings(JSON.parse(saved));
          }
        }
      }
    } catch (error) {
      console.error("Failed to check user status:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-ink/60">
          {locale === "pl" ? "Ładowanie..." : "Завантаження..."}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-paper via-moss/5 to-terracotta/5">
      {/* Header */}
      <div className="relative overflow-hidden border-b border-ink/10 bg-paper/80 backdrop-blur-xl">
        <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-moss/10 blur-3xl" />
        <div className="absolute -left-32 -bottom-32 h-96 w-96 rounded-full bg-terracotta/10 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-6 py-16 text-center">
          <div className="mb-6 inline-flex items-center justify-center rounded-full bg-gradient-to-br from-moss/20 to-terracotta/20 p-6 shadow-soft">
            <GraduationCap size={48} weight="fill" className="text-moss" />
          </div>

          <h1 className="mb-4 text-5xl font-bold tracking-tight">
            {locale === "pl" ? "Witaj w Szkole" : "Вітаємо у Школі"}
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-ink/70">
            {locale === "pl"
              ? "Platforma edukacyjna dla nauczycieli i uczniów. Wybierz swoją rolę, aby kontynuować."
              : "Освітня платформа для вчителів та учнів. Виберіть свою роль, щоб продовжити."
            }
          </p>
        </div>
      </div>

      {/* Role Selection */}
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className={`grid gap-8 ${(isTeacher || (isAdmin && adminSettings.teacherModeEnabled)) ? "md:grid-cols-2" : "md:grid-cols-1 max-w-2xl mx-auto"}`}>

          {/* Teacher Card */}
          {(isTeacher || (isAdmin && adminSettings.teacherModeEnabled)) && (
            <Link href="/school/teacher">
              <div className="group relative overflow-hidden rounded-[32px] border border-ink/10 bg-gradient-to-br from-moss/5 to-paper p-8 shadow-soft transition-all hover:scale-[1.02] hover:shadow-lg">
                {/* Decorative elements */}
                <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-moss/20 blur-2xl transition-all group-hover:scale-150" />
                <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-terracotta/10 blur-2xl" />

                <div className="relative">
                  {/* Icon */}
                  <div className="mb-6 inline-flex items-center justify-center rounded-[24px] bg-gradient-to-br from-moss to-moss/80 p-4 shadow-soft">
                    <Chalkboard size={40} weight="fill" className="text-paper" />
                  </div>

                  {/* Title */}
                  <h2 className="mb-3 text-3xl font-bold">
                    {locale === "pl" ? "Nauczyciel" : "Вчитель"}
                  </h2>
                  <p className="mb-6 text-ink/70">
                    {locale === "pl"
                      ? "Zarządzaj klasami, twórz zadania i monitoruj postępy uczniów"
                      : "Керуйте класами, створюйте завдання та відстежуйте прогрес учнів"
                    }
                  </p>

                  {/* Features */}
                  <div className="mb-8 space-y-3">
                    <div className="flex items-center gap-3 text-sm text-ink/70">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-moss/10">
                        <Books size={16} weight="fill" className="text-moss" />
                      </div>
                      <span>{locale === "pl" ? "Zarządzanie klasami" : "Керування класами"}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-ink/70">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-moss/10">
                        <ClipboardText size={16} weight="fill" className="text-moss" />
                      </div>
                      <span>{locale === "pl" ? "Tworzenie zadań" : "Створення завдань"}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-ink/70">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-moss/10">
                        <ChartBar size={16} weight="fill" className="text-moss" />
                      </div>
                      <span>{locale === "pl" ? "Analityka i statystyki" : "Аналітика та статистика"}</span>
                    </div>
                  </div>

                  {/* CTA */}
                  <div className="flex items-center gap-2 font-semibold text-moss group-hover:gap-4 transition-all">
                    <span>{locale === "pl" ? "Przejdź do panelu" : "Перейти до панелі"}</span>
                    <ArrowRight size={20} weight="bold" />
                  </div>
                </div>
              </div>
            </Link>
          )}

          {/* Student Card */}
          <Link href="/school/student">
            <div className="group relative overflow-hidden rounded-[32px] border border-ink/10 bg-gradient-to-br from-terracotta/5 to-paper p-8 shadow-soft transition-all hover:scale-[1.02] hover:shadow-lg">
              {/* Decorative elements */}
              <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-terracotta/20 blur-2xl transition-all group-hover:scale-150" />
              <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-gold/10 blur-2xl" />

              <div className="relative">
                {/* Icon */}
                <div className="mb-6 inline-flex items-center justify-center rounded-[24px] bg-gradient-to-br from-terracotta to-terracotta/80 p-4 shadow-soft">
                  <Student size={40} weight="fill" className="text-paper" />
                </div>

                {/* Title */}
                <h2 className="mb-3 text-3xl font-bold">
                  {locale === "pl" ? "Uczeń" : "Учень"}
                </h2>
                <p className="mb-6 text-ink/70">
                  {locale === "pl"
                    ? "Zobacz swoje klasy, zadania i śledź swoje postępy w nauce"
                    : "Переглядайте свої класи, завдання та відстежуйте свій прогрес у навчанні"
                  }
                </p>

                {/* Features */}
                <div className="mb-8 space-y-3">
                  <div className="flex items-center gap-3 text-sm text-ink/70">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-terracotta/10">
                      <Users size={16} weight="fill" className="text-terracotta" />
                    </div>
                    <span>{locale === "pl" ? "Moje klasy" : "Мої класи"}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-ink/70">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-terracotta/10">
                      <ClipboardText size={16} weight="fill" className="text-terracotta" />
                    </div>
                    <span>{locale === "pl" ? "Zadania do wykonania" : "Завдання до виконання"}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-ink/70">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-terracotta/10">
                      <ChartBar size={16} weight="fill" className="text-terracotta" />
                    </div>
                    <span>{locale === "pl" ? "Mój postęp" : "Мій прогрес"}</span>
                  </div>
                </div>

                {/* CTA */}
                <div className="flex items-center gap-2 font-semibold text-terracotta group-hover:gap-4 transition-all">
                  <span>{locale === "pl" ? "Przejdź do panelu" : "Перейти до панелі"}</span>
                  <ArrowRight size={20} weight="bold" />
                </div>
              </div>
            </div>
          </Link>

        </div>
      </div>
    </div>
  );
}
