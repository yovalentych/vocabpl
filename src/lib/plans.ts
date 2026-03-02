import { TeacherLimits, TeacherPlanId } from "./teacher-types";

export type PlanTier = "classik" | "basik" | "pro" | "maxik" | "teacher_basic" | "teacher_pro" | "teacher_unlimited";

export type Plan = {
  id: string;
  tier: PlanTier;
  periodDays: number;
  priceUah: number;
  aiCreditsMonthly: number;
  allowAIGenerate?: boolean;
  allowAICheck?: boolean;
  teacherLimits?: TeacherLimits;
};

export const DEFAULT_PLAN_ID = "basik_m";

export const plans: Plan[] = [
  { id: "classik_m", tier: "classik", periodDays: 30, priceUah: 99, aiCreditsMonthly: 200, allowAIGenerate: false, allowAICheck: true },
  { id: "basik_m", tier: "basik", periodDays: 30, priceUah: 199, aiCreditsMonthly: 800, allowAIGenerate: true, allowAICheck: true },
  { id: "pro_m", tier: "pro", periodDays: 30, priceUah: 439, aiCreditsMonthly: 2500, allowAIGenerate: true, allowAICheck: true },
  { id: "maxik_m", tier: "maxik", periodDays: 30, priceUah: 749, aiCreditsMonthly: 6000, allowAIGenerate: true, allowAICheck: true }
];

// Teacher Plans
export const teacherPlans: Plan[] = [
  {
    id: "teacher_basic_m",
    tier: "teacher_basic",
    periodDays: 30,
    priceUah: 299,
    aiCreditsMonthly: 1500,
    teacherLimits: {
      maxClasses: 3,
      maxStudentsPerClass: 30,
      maxAssignmentsPerMonth: 50,
      aiCreditsMonthly: 1500,
    },
  },
  {
    id: "teacher_pro_m",
    tier: "teacher_pro",
    periodDays: 30,
    priceUah: 599,
    aiCreditsMonthly: 5000,
    teacherLimits: {
      maxClasses: 10,
      maxStudentsPerClass: 50,
      maxAssignmentsPerMonth: 200,
      aiCreditsMonthly: 5000,
    },
  },
  {
    id: "teacher_unlimited_y",
    tier: "teacher_unlimited",
    periodDays: 365,
    priceUah: 5999,
    aiCreditsMonthly: 15000,
    teacherLimits: {
      maxClasses: -1,
      maxStudentsPerClass: -1,
      maxAssignmentsPerMonth: -1,
      aiCreditsMonthly: 15000,
    },
  },
];

// Всі плани разом
export const allPlans: Plan[] = [...plans, ...teacherPlans];

export function getPlanById(id?: string | null) {
  if (!id) return plans.find((plan) => plan.id === DEFAULT_PLAN_ID) || plans[0];
  const legacyMap: Record<string, string> = { basic: "basik_m", pro: "pro_m" };
  const normalized = legacyMap[id] || id;
  const direct = allPlans.find((plan) => plan.id === normalized);
  if (direct) return direct;
  const monthlyFallback = normalized.replace(/_(q|y)$/i, "_m");
  return (
    allPlans.find((plan) => plan.id === monthlyFallback) ||
    plans.find((plan) => plan.id === DEFAULT_PLAN_ID) ||
    plans[0]
  );
}

export function getTeacherPlanById(id: TeacherPlanId): Plan | undefined {
  return teacherPlans.find((plan) => plan.id === id);
}

export function isTeacherPlan(planId: string): planId is TeacherPlanId {
  return planId.startsWith("teacher_");
}
