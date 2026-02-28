export type PlanTier = "classik" | "basik" | "pro" | "maxik";

export type Plan = {
  id: string;
  tier: PlanTier;
  periodDays: number;
  priceUah: number;
  aiCreditsMonthly: number;
  allowAIGenerate: boolean;
  allowAICheck: boolean;
};

export const DEFAULT_PLAN_ID = "basik_m";

export const plans: Plan[] = [
  { id: "classik_m", tier: "classik", periodDays: 30, priceUah: 99, aiCreditsMonthly: 200, allowAIGenerate: false, allowAICheck: true },
  { id: "basik_m", tier: "basik", periodDays: 30, priceUah: 199, aiCreditsMonthly: 800, allowAIGenerate: true, allowAICheck: true },
  { id: "pro_m", tier: "pro", periodDays: 30, priceUah: 439, aiCreditsMonthly: 2500, allowAIGenerate: true, allowAICheck: true },
  { id: "maxik_m", tier: "maxik", periodDays: 30, priceUah: 749, aiCreditsMonthly: 6000, allowAIGenerate: true, allowAICheck: true }
];

export function getPlanById(id?: string | null) {
  if (!id) return plans.find((plan) => plan.id === DEFAULT_PLAN_ID) || plans[0];
  const legacyMap: Record<string, string> = { basic: "basik_m", pro: "pro_m" };
  const normalized = legacyMap[id] || id;
  const direct = plans.find((plan) => plan.id === normalized);
  if (direct) return direct;
  const monthlyFallback = normalized.replace(/_(q|y)$/i, "_m");
  return (
    plans.find((plan) => plan.id === monthlyFallback) ||
    plans.find((plan) => plan.id === DEFAULT_PLAN_ID) ||
    plans[0]
  );
}
