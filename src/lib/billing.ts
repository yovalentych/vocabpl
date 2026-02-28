import { plans as defaultPlans, Plan } from "@/lib/plans";

export type BillingSettings = {
  blurPlans: boolean;
  plans: Plan[];
};

export function mergeBillingPlans(overrides?: { id: Plan["id"]; priceUah: number }[]) {
  if (!Array.isArray(overrides) || overrides.length === 0) return defaultPlans;
  const overrideMap = new Map(overrides.map((item) => [item.id, item.priceUah]));
  return defaultPlans.map((plan) => ({
    ...plan,
    priceUah: overrideMap.has(plan.id) ? Number(overrideMap.get(plan.id)) : plan.priceUah
  }));
}
