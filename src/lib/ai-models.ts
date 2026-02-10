/**
 * AI Models Configuration
 * Централізована конфігурація всіх доступних AI моделей
 */

export interface AIModel {
  id: string;
  name: string;
  provider: "openai" | "anthropic";
  maxTokens: number;
  supportsVision: boolean;
  costPer1kTokens: number;
  defaultFor: string[];
  description: string;
}

export const AI_MODELS: Record<string, AIModel> = {
  "gpt-4.1-mini": {
    id: "gpt-4.1-mini",
    name: "GPT-4.1 Mini",
    provider: "openai",
    maxTokens: 2500,
    supportsVision: false,
    costPer1kTokens: 0.001,
    defaultFor: ["text", "generation", "checking", "translation"],
    description: "Швидка і економічна модель для текстових завдань"
  },
  "gpt-4o": {
    id: "gpt-4o",
    name: "GPT-4o",
    provider: "openai",
    maxTokens: 4000,
    supportsVision: true,
    costPer1kTokens: 0.005,
    defaultFor: ["vision", "image-analysis"],
    description: "Потужна модель з підтримкою аналізу зображень"
  },
  "gpt-4o-mini": {
    id: "gpt-4o-mini",
    name: "GPT-4o Mini",
    provider: "openai",
    maxTokens: 2000,
    supportsVision: true,
    costPer1kTokens: 0.002,
    defaultFor: [],
    description: "Економічна модель з підтримкою vision (альтернатива)"
  },
  "gpt-4-turbo": {
    id: "gpt-4-turbo",
    name: "GPT-4 Turbo",
    provider: "openai",
    maxTokens: 4096,
    supportsVision: false,
    costPer1kTokens: 0.01,
    defaultFor: [],
    description: "Найпотужніша модель для складних завдань"
  }
};

export const DEFAULT_MODEL = "gpt-4.1-mini";
export const DEFAULT_VISION_MODEL = "gpt-4o";

/**
 * Автоматичний вибір оптимальної моделі
 */
export function selectModel(options: {
  mode?: string;
  needsVision?: boolean;
  userPreference?: string;
  adminOverride?: string;
}): string {
  const { mode, needsVision, userPreference, adminOverride } = options;

  // 1. Admin override має найвищий пріоритет
  if (adminOverride && AI_MODELS[adminOverride]) {
    return adminOverride;
  }

  // 2. Якщо потрібен vision - використовуй vision model
  if (needsVision) {
    return DEFAULT_VISION_MODEL;
  }

  // 3. User preference (якщо дозволена модель)
  if (userPreference && AI_MODELS[userPreference]) {
    return userPreference;
  }

  // 4. За замовчуванням
  return DEFAULT_MODEL;
}

/**
 * Отримати максимальну кількість токенів для моделі
 */
export function getMaxTokensForModel(modelId: string, mode?: string): number {
  const model = AI_MODELS[modelId];
  if (!model) return 220; // fallback

  // Спеціальні ліміти для різних modes
  const modeOverrides: Record<string, number> = {
    translate_word: 900,
    translate_sentence: 900,
    test_generate: 2500,
    test_check: 1500,
    describe_check: model.supportsVision ? 1500 : 1000,
    unsplash_translate: 50
  };

  return modeOverrides[mode || ""] || model.maxTokens;
}

/**
 * Перевірка чи модель підтримує vision
 */
export function supportsVision(modelId: string): boolean {
  return AI_MODELS[modelId]?.supportsVision || false;
}

/**
 * Отримати список доступних моделей для UI
 */
export function getAvailableModels(): AIModel[] {
  return Object.values(AI_MODELS);
}

/**
 * Валідація вибору моделі
 */
export function validateModelSelection(
  modelId: string,
  needsVision: boolean
): { valid: boolean; error?: string } {
  const model = AI_MODELS[modelId];

  if (!model) {
    return { valid: false, error: "Модель не знайдена" };
  }

  if (needsVision && !model.supportsVision) {
    return {
      valid: false,
      error: `Модель ${model.name} не підтримує аналіз зображень`
    };
  }

  return { valid: true };
}
