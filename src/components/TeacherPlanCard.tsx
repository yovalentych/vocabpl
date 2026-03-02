"use client";

import type { Plan } from "@/lib/plans";

type TeacherPlanCardProps = {
  plan: Plan;
  selected?: boolean;
  recommended?: boolean;
  onSelect?: () => void;
  locale: "pl" | "uk";
};

export default function TeacherPlanCard({
  plan,
  selected = false,
  recommended = false,
  onSelect,
  locale,
}: TeacherPlanCardProps) {
  const t = {
    pl: {
      select: "Wybrać plan",
      selected: "Wybrane",
      aiCredits: "AI kredyty/miesiąc",
      classes: "Klas",
      studentsPerClass: "Uczniów/klasę",
      assignmentsPerMonth: "Zadań/miesiąc",
      unlimited: "Nieograniczone",
      recommended: "Polecane",
      perMonth: "/miesiąc",
      perYear: "/rok",
    },
    uk: {
      select: "Обрати план",
      selected: "Обрано",
      aiCredits: "AI кредити/місяць",
      classes: "Класів",
      studentsPerClass: "Студентів/клас",
      assignmentsPerMonth: "Завдань/місяць",
      unlimited: "Необмежено",
      recommended: "Рекомендовано",
      perMonth: "/місяць",
      perYear: "/рік",
    },
  };

  const text = t[locale];
  const limits = plan.teacherLimits;

  if (!limits) return null;

  const formatLimit = (value: number) => {
    return value === -1 ? text.unlimited : value.toString();
  };

  const periodLabel = plan.periodDays >= 365 ? text.perYear : text.perMonth;

  return (
    <div
      className={`relative rounded-2xl border-2 p-6 transition-all ${
        selected
          ? "border-amber-600 bg-amber-50/30 shadow-lg"
          : "border-stone-300 bg-white hover:border-amber-400 hover:shadow-md"
      }`}
    >
      {recommended && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-amber-600 px-4 py-1 text-xs font-semibold text-white">
          {text.recommended}
        </div>
      )}

      <div className="mb-4">
        <h3 className="text-xl font-bold text-stone-900">{plan.tier}</h3>
        <div className="mt-1 flex items-baseline gap-1">
          <span className="text-3xl font-bold text-stone-900">{plan.priceUah}₴</span>
          <span className="text-sm text-stone-600">{periodLabel}</span>
        </div>
      </div>

      <div className="space-y-3 border-t border-stone-200 pt-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-stone-600">{text.classes}:</span>
          <span className="font-semibold text-stone-900">
            {formatLimit(limits.maxClasses)}
          </span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-stone-600">{text.studentsPerClass}:</span>
          <span className="font-semibold text-stone-900">
            {formatLimit(limits.maxStudentsPerClass)}
          </span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-stone-600">{text.assignmentsPerMonth}:</span>
          <span className="font-semibold text-stone-900">
            {formatLimit(limits.maxAssignmentsPerMonth)}
          </span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-stone-600">{text.aiCredits}:</span>
          <span className="font-semibold text-stone-900">{limits.aiCreditsMonthly}</span>
        </div>
      </div>

      {onSelect && (
        <button
          onClick={onSelect}
          className={`mt-6 w-full rounded-xl py-3 font-semibold transition-colors ${
            selected
              ? "bg-amber-600 text-white hover:bg-amber-700"
              : "bg-stone-900 text-white hover:bg-stone-800"
          }`}
        >
          {selected ? text.selected : text.select}
        </button>
      )}
    </div>
  );
}
