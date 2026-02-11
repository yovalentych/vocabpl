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
  { id: "classik_q", tier: "classik", periodDays: 90, priceUah: 269, aiCreditsMonthly: 200, allowAIGenerate: false, allowAICheck: true },
  { id: "classik_y", tier: "classik", periodDays: 365, priceUah: 999, aiCreditsMonthly: 200, allowAIGenerate: false, allowAICheck: true },

  { id: "basik_m", tier: "basik", periodDays: 30, priceUah: 199, aiCreditsMonthly: 800, allowAIGenerate: true, allowAICheck: true },
  { id: "basik_q", tier: "basik", periodDays: 90, priceUah: 549, aiCreditsMonthly: 800, allowAIGenerate: true, allowAICheck: true },
  { id: "basik_y", tier: "basik", periodDays: 365, priceUah: 1999, aiCreditsMonthly: 800, allowAIGenerate: true, allowAICheck: true },

  { id: "pro_m", tier: "pro", periodDays: 30, priceUah: 439, aiCreditsMonthly: 2500, allowAIGenerate: true, allowAICheck: true },
  { id: "pro_q", tier: "pro", periodDays: 90, priceUah: 1199, aiCreditsMonthly: 2500, allowAIGenerate: true, allowAICheck: true },
  { id: "pro_y", tier: "pro", periodDays: 365, priceUah: 3999, aiCreditsMonthly: 2500, allowAIGenerate: true, allowAICheck: true },

  { id: "maxik_m", tier: "maxik", periodDays: 30, priceUah: 749, aiCreditsMonthly: 6000, allowAIGenerate: true, allowAICheck: true },
  { id: "maxik_q", tier: "maxik", periodDays: 90, priceUah: 1999, aiCreditsMonthly: 6000, allowAIGenerate: true, allowAICheck: true },
  { id: "maxik_y", tier: "maxik", periodDays: 365, priceUah: 6999, aiCreditsMonthly: 6000, allowAIGenerate: true, allowAICheck: true }
];

export function getPlanById(id?: string | null) {
  if (!id) return plans.find((plan) => plan.id === DEFAULT_PLAN_ID) || plans[0];
  const legacyMap: Record<string, string> = { basic: "basik_m", pro: "pro_m" };
  const normalized = legacyMap[id] || id;
  return plans.find((plan) => plan.id === normalized) || plans.find((plan) => plan.id === DEFAULT_PLAN_ID) || plans[0];
}
