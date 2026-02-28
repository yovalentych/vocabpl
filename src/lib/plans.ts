export const DEFAULT_PLAN_ID = "free";

export interface Plan {
  id: string;
  name: string;
  priceUah: number;
  features: string[];
  allowAIGenerate?: boolean;
  allowAICheck?: boolean;
  maxAIRequests?: number;
  aiCreditsMonthly?: number;
  periodDays?: number;
  tier?: string;
}

export const plans: Plan[] = [
  {
    id: "free",
    name: "Безкоштовний",
    priceUah: 0,
    features: [
      "Базові вправи",
      "Словник",
      "Обмежений AI доступ"
    ],
    allowAIGenerate: false,
    allowAICheck: false,
    maxAIRequests: 0,
    periodDays: 30,
    tier: "free"
  },
  {
    id: "basic",
    name: "Базовий",
    priceUah: 99,
    features: [
      "Всі вправи",
      "Повний словник",
      "AI генерація (10 req/день)",
      "AI перевірка (20 req/день)"
    ],
    allowAIGenerate: true,
    allowAICheck: true,
    maxAIRequests: 30,
    periodDays: 30,
    tier: "basic"
  },
  {
    id: "pro",
    name: "Професіонал",
    priceUah: 199,
    features: [
      "Необмежені вправи",
      "Необмежений AI",
      "Пріоритетна підтримка",
      "Статистика прогресу"
    ],
    allowAIGenerate: true,
    allowAICheck: true,
    maxAIRequests: -1,
    periodDays: 30,
    tier: "pro"
  }
];

export function getPlanById(planId: string): Plan | undefined {
  return plans.find(p => p.id === planId);
}

export function getDefaultPlan(): Plan {
  return plans[0];
}
