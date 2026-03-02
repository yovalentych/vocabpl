"use client";

import { useState } from "react";
import type { TeacherProfile } from "@/lib/teacher-types";
import type { Plan } from "@/lib/plans";

type TeacherProfileCardProps = {
  teacherProfile: TeacherProfile;
  plan?: Plan;
  usage?: {
    classes: { current: number; limit: number; unlimited: boolean };
    students: { total: number; limitPerClass: number; unlimited: boolean };
    assignments: { thisMonth: number; total: number; monthlyLimit: number; unlimited: boolean };
    aiCredits: { monthly: number };
  };
  locale: "pl" | "uk";
  onCancelSubscription?: () => void;
  onResumeSubscription?: () => void;
};

export default function TeacherProfileCard({
  teacherProfile,
  plan,
  usage,
  locale,
  onCancelSubscription,
  onResumeSubscription,
}: TeacherProfileCardProps) {
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const t = {
    pl: {
      plan: "Plan",
      usage: "Wykorzystanie",
      classes: "Klas",
      students: "Łącznie uczniów",
      assignments: "Zadań w tym miesiącu",
      aiCredits: "AI kredyty/miesiąc",
      unlimited: "Nieograniczone",
      of: "z",
      subscription: "Subskrypcja",
      expiresAt: "Wygasa",
      autoRenewOn: "Automatyczne odnowienie włączone",
      autoRenewOff: "Automatyczne odnowienie wyłączone",
      cancelSubscription: "Anuluj subskrypcję",
      resumeSubscription: "Wznów subskrypcję",
      createClass: "Utwórz klasę",
      manageSubscription: "Zarządzaj subskrypcją",
      viewStats: "Zobacz statystyki",
      confirmCancel: "Czy na pewno chcesz anulować?",
      confirm: "Tak, anuluj",
      keepSubscription: "Nie, zachowaj",
      gracePeriodDays: "Grace period: {n} dni",
      active: "Aktywny",
    },
    uk: {
      plan: "План",
      usage: "Використання",
      classes: "Класів",
      students: "Всього студентів",
      assignments: "Завдань цього місяця",
      aiCredits: "AI кредити/місяць",
      unlimited: "Необмежено",
      of: "з",
      subscription: "Підписка",
      expiresAt: "Закінчується",
      autoRenewOn: "Автоматичне поновлення увімкнено",
      autoRenewOff: "Автоматичне поновлення вимкнено",
      cancelSubscription: "Скасувати підписку",
      resumeSubscription: "Відновити підписку",
      createClass: "Створити клас",
      manageSubscription: "Керувати підпискою",
      viewStats: "Переглянути статистику",
      confirmCancel: "Ви впевнені що хочете скасувати?",
      confirm: "Так, скасувати",
      keepSubscription: "Ні, залишити",
      gracePeriodDays: "Grace period: {n} днів",
      active: "Активний",
    },
  };

  const text = t[locale];

  const formatLimit = (value: number) => {
    return value === -1 ? text.unlimited : value.toString();
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString(locale === "pl" ? "pl-PL" : "uk-UA");
  };

  const isGracePeriod = teacherProfile.status === "grace_period";

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
      {/* Status Badge */}
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-xl font-bold text-stone-900">{text.active}</h3>
        <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
          {plan?.tier || teacherProfile.planId}
        </span>
      </div>

      {/* Grace Period Warning */}
      {isGracePeriod && teacherProfile.gracePeriodEndsAt && (
        <div className="mb-4 rounded-lg bg-orange-50 p-4 text-sm text-orange-900">
          ⚠️{" "}
          {text.gracePeriodDays.replace(
            "{n}",
            Math.ceil(
              (new Date(teacherProfile.gracePeriodEndsAt).getTime() - Date.now()) /
                (24 * 60 * 60 * 1000)
            ).toString()
          )}
        </div>
      )}

      {/* Usage Stats */}
      {usage && (
        <div className="mb-6 space-y-3 rounded-lg bg-stone-50 p-4">
          <h4 className="text-sm font-semibold text-stone-700">{text.usage}</h4>

          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-stone-600">{text.classes}:</span>
              <span className="font-semibold text-stone-900">
                {usage.classes.current} {text.of} {formatLimit(usage.classes.limit)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-stone-600">{text.students}:</span>
              <span className="font-semibold text-stone-900">{usage.students.total}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-stone-600">{text.assignments}:</span>
              <span className="font-semibold text-stone-900">
                {usage.assignments.thisMonth} {text.of}{" "}
                {formatLimit(usage.assignments.monthlyLimit)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-stone-600">{text.aiCredits}:</span>
              <span className="font-semibold text-stone-900">{usage.aiCredits.monthly}</span>
            </div>
          </div>
        </div>
      )}

      {/* Subscription Info */}
      <div className="mb-6 space-y-2 text-sm">
        <h4 className="font-semibold text-stone-700">{text.subscription}</h4>
        <div className="flex items-center justify-between">
          <span className="text-stone-600">{text.expiresAt}:</span>
          <span className="font-medium text-stone-900">
            {formatDate(teacherProfile.subscription.expiresAt)}
          </span>
        </div>
        <div className="text-stone-600">
          {teacherProfile.subscription.autoRenew ? (
            <span className="text-green-700">✓ {text.autoRenewOn}</span>
          ) : (
            <span className="text-stone-500">○ {text.autoRenewOff}</span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-2">
        <a
          href="/teacher/classes/new"
          className="block w-full rounded-lg bg-stone-900 py-2.5 text-center font-semibold text-white transition-colors hover:bg-stone-800"
        >
          {text.createClass}
        </a>

        {!isGracePeriod && onCancelSubscription && !showCancelConfirm && (
          <button
            onClick={() => setShowCancelConfirm(true)}
            className="w-full rounded-lg border border-red-300 py-2.5 text-center font-semibold text-red-700 transition-colors hover:bg-red-50"
          >
            {text.cancelSubscription}
          </button>
        )}

        {showCancelConfirm && (
          <div className="space-y-2 rounded-lg border border-red-300 bg-red-50 p-3">
            <p className="text-sm font-medium text-red-900">{text.confirmCancel}</p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  onCancelSubscription?.();
                  setShowCancelConfirm(false);
                }}
                className="flex-1 rounded-lg bg-red-600 py-2 text-sm font-semibold text-white hover:bg-red-700"
              >
                {text.confirm}
              </button>
              <button
                onClick={() => setShowCancelConfirm(false)}
                className="flex-1 rounded-lg border border-stone-300 bg-white py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50"
              >
                {text.keepSubscription}
              </button>
            </div>
          </div>
        )}

        {isGracePeriod && onResumeSubscription && (
          <button
            onClick={onResumeSubscription}
            className="w-full rounded-lg bg-green-600 py-2.5 text-center font-semibold text-white transition-colors hover:bg-green-700"
          >
            {text.resumeSubscription}
          </button>
        )}
      </div>
    </div>
  );
}
