export type Plan = {
  id: "week" | "month" | "half_year" | "year";
  durationDays: number;
  priceUah: number;
};

export const plans: Plan[] = [
  { id: "week", durationDays: 7, priceUah: 79 },
  { id: "month", durationDays: 30, priceUah: 199 },
  { id: "half_year", durationDays: 182, priceUah: 899 },
  { id: "year", durationDays: 365, priceUah: 1490 }
];
