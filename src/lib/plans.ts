export type Plan = {
  id: "basic" | "pro";
  durationDays: number;
  priceUah: number;
  aiCreditsMonthly: number;
};

export const plans: Plan[] = [
  { id: "basic", durationDays: 30, priceUah: 219, aiCreditsMonthly: 600 },
  { id: "pro", durationDays: 30, priceUah: 439, aiCreditsMonthly: 2500 }
];

export function getPlanById(id?: string | null) {
  if (!id) return plans[0];
  return plans.find((plan) => plan.id === id) || plans[0];
}
