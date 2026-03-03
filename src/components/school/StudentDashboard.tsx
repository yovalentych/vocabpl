"use client";

import { useState, useEffect } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  House,
  Books,
  Calendar,
  ClipboardText,
  ChartBar,
  CaretLeft
} from "@phosphor-icons/react";

// Import existing tabs
import AcademyOverview from "@/components/academy/tabs/AcademyOverview";
import AcademyClasses from "@/components/academy/tabs/AcademyClasses";
import AcademySchedule from "@/components/academy/tabs/AcademySchedule";
import AcademyAssignments from "@/components/academy/tabs/AcademyAssignments";
import AcademyAnalytics from "@/components/academy/tabs/AcademyAnalytics";

export default function StudentDashboard() {
  const { locale } = useLocale();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams?.get("tab") || "overview");

  useEffect(() => {
    if (searchParams) {
      const tab = searchParams.get("tab");
      if (tab) setActiveTab(tab);
    }
  }, [searchParams]);

  const tabs = [
    { id: "overview", icon: House, labelUk: "Огляд", labelPl: "Przegląd" },
    { id: "classes", icon: Books, labelUk: "Класи", labelPl: "Klasy" },
    { id: "schedule", icon: Calendar, labelUk: "Розклад", labelPl: "Harmonogram" },
    { id: "assignments", icon: ClipboardText, labelUk: "Завдання", labelPl: "Zadania" },
    { id: "analytics", icon: ChartBar, labelUk: "Мій прогрес", labelPl: "Mój postęp" }
  ];

  function changeTab(tabId: string) {
    setActiveTab(tabId);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", tabId);
    window.history.pushState({}, "", url);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-paper via-terracotta/5 to-gold/5">
      {/* Header */}
      <div className="relative overflow-hidden border-b border-ink/10 bg-paper/80 backdrop-blur-xl">
        <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-terracotta/10 blur-3xl" />
        <div className="absolute -left-32 top-1/2 h-64 w-64 rounded-full bg-gold/10 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-6 py-8">
          {/* Back button */}
          <Link
            href="/school"
            className="mb-6 inline-flex items-center gap-2 text-sm text-ink/60 transition-colors hover:text-ink"
          >
            <CaretLeft size={16} weight="bold" />
            <span>{locale === "pl" ? "Powrót do Szkoły" : "Повернутися до Школи"}</span>
          </Link>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold tracking-tight">
                {locale === "pl" ? "Panel ucznia" : "Панель учня"}
              </h1>
              <p className="mt-2 text-ink/60">
                {locale === "pl"
                  ? "Zarządzaj swoją nauką i śledź swoje postępy"
                  : "Керуйте своїм навчанням та відстежуйте свій прогрес"
                }
              </p>
            </div>
          </div>

          {/* Tabs Navigation */}
          <div className="mt-8 flex gap-2 overflow-x-auto pb-2">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => changeTab(tab.id)}
                  className={`
                    group flex shrink-0 items-center gap-2 rounded-full px-6 py-3 font-medium
                    transition-all duration-200
                    ${isActive
                      ? "bg-gradient-to-r from-terracotta to-terracotta/90 text-paper shadow-soft"
                      : "bg-paper/50 text-ink/60 hover:bg-paper hover:text-ink"
                    }
                  `}
                >
                  <Icon
                    size={20}
                    weight={isActive ? "fill" : "regular"}
                    className="transition-transform group-hover:scale-110"
                  />
                  <span className="text-sm">
                    {locale === "pl" ? tab.labelPl : tab.labelUk}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-7xl px-6 py-8">
        {activeTab === "overview" && (
          <AcademyOverview
            isTeacher={false}
            isStudent={true}
            teacherProfile={null}
            studentStats={null}
          />
        )}
        {activeTab === "classes" && <AcademyClasses isTeacher={false} />}
        {activeTab === "schedule" && <AcademySchedule />}
        {activeTab === "assignments" && <AcademyAssignments isTeacher={false} />}
        {activeTab === "analytics" && <AcademyAnalytics isTeacher={false} />}
      </div>
    </div>
  );
}
