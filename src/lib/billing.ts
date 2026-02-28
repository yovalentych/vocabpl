import { plans, type Plan } from "./plans";

export interface BillingPlan {
  id: string;
  priceUah: number;
}

export function mergeBillingPlans(customPlans?: BillingPlan[]): Plan[] {
  if (!customPlans || customPlans.length === 0) {
    return plans;
  }

  return plans.map(defaultPlan => {
    const customPlan = customPlans.find(cp => cp.id === defaultPlan.id);
    if (customPlan) {
      return {
        ...defaultPlan,
        priceUah: customPlan.priceUah
      };
    }
    return defaultPlan;
  });
}
