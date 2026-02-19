/**
 * Difficulty System - Централізована система складності контенту
 *
 * Експортує все необхідне для роботи з рівнями складності
 */

export * from "./specs";
export * from "./prompt-builder";
export * from "./validator";

import { getDifficultySpec } from "./specs";
import { buildGenerationPrompt, getExerciseSpecificInstructions } from "./prompt-builder";
import { validateExerciseContent, ValidationResult } from "./validator";

/**
 * Головна функція для генерування AI промпта з difficulty constraints
 *
 * Використання:
 * ```typescript
 * const prompt = generateDifficultyAwarePrompt({
 *   level: "A2",
 *   exerciseType: "reading",
 *   topic: "Подорожі",
 *   userInput: "Створи текст про подорож до Кракова",
 *   count: 6
 * });
 * ```
 */
export function generateDifficultyAwarePrompt(options: {
  level: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
  exerciseType: "reading" | "translation" | "dialogue" | "test" | "sentences" | "cloze" | "paraphrase" | "match";
  topic?: string;
  userInput?: string;
  count?: number;
  additionalConstraints?: string;
}): string {
  const spec = getDifficultySpec(options.level);

  // Базовий промпт
  let prompt = buildGenerationPrompt({
    level: options.level,
    exerciseType: options.exerciseType,
    topic: options.topic,
    additionalConstraints: options.additionalConstraints,
    count: options.count
  });

  // Додати specific instructions для типу вправи
  const specificInstructions = getExerciseSpecificInstructions(
    options.exerciseType,
    spec
  );

  if (specificInstructions) {
    prompt += `\n${specificInstructions}`;
  }

  // Додати user input якщо є
  if (options.userInput) {
    prompt += `\n\n**ЗАПИТ КОРИСТУВАЧА:**\n${options.userInput}`;
  }

  return prompt;
}

/**
 * Валідація згенерованого контенту
 *
 * Використання:
 * ```typescript
 * const result = validateGeneratedContent({
 *   content: generatedExercise,
 *   level: "A2",
 *   exerciseType: "reading"
 * });
 *
 * if (!result.valid) {
 *   console.error("Validation failed:", result.errors);
 * }
 * ```
 */
export function validateGeneratedContent(options: {
  content: any;
  level: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
  exerciseType: "reading" | "translation" | "dialogue" | "test";
}): ValidationResult {
  const spec = getDifficultySpec(options.level);
  return validateExerciseContent(options.content, options.exerciseType, spec);
}

/**
 * Отримати короткий опис рівня для UI
 */
export function getLevelDescription(level: "A1" | "A2" | "B1" | "B2" | "C1" | "C2"): {
  name: string;
  description: string;
  avgSentenceLength: string;
  features: string[];
} {
  const spec = getDifficultySpec(level);

  const features: string[] = [];

  // Граматика
  if (spec.grammar.moods.allowed.includes("conditional")) {
    features.push("Умовні конструкції");
  }
  if (spec.grammar.complexity.indirectSpeech) {
    features.push("Непряма мова");
  }
  if (spec.grammar.voice.passive !== "forbidden") {
    features.push("Пасивний стан");
  }

  // Лексика
  if (spec.lexicon.idioms.allowed) {
    features.push("Ідіоми");
  }
  if (spec.lexicon.slang.allowed) {
    features.push("Розмовна мова");
  }

  // Синтаксис
  if (spec.syntax.maxSubordinateClauses > 1) {
    features.push("Підрядні речення");
  }

  return {
    name: spec.name,
    description: spec.description,
    avgSentenceLength: `${spec.syntax.wordsPerSentence.avg} слів`,
    features
  };
}

/**
 * Порівняння двох рівнів
 */
export function compareLevels(
  level1: "A1" | "A2" | "B1" | "B2" | "C1" | "C2",
  level2: "A1" | "A2" | "B1" | "B2" | "C1" | "C2"
): {
  harder: string;
  differences: string[];
} {
  const spec1 = getDifficultySpec(level1);
  const spec2 = getDifficultySpec(level2);

  const levelOrder = ["A1", "A2", "B1", "B2", "C1", "C2"];
  const harder =
    levelOrder.indexOf(level1) > levelOrder.indexOf(level2) ? level1 : level2;

  const differences: string[] = [];

  // Порівняння довжини речень
  if (spec1.syntax.wordsPerSentence.avg !== spec2.syntax.wordsPerSentence.avg) {
    differences.push(
      `Довжина речення: ${spec1.syntax.wordsPerSentence.avg} vs ${spec2.syntax.wordsPerSentence.avg} слів`
    );
  }

  // Порівняння граматики
  if (spec1.grammar.moods.allowed.length !== spec2.grammar.moods.allowed.length) {
    differences.push(
      `Граматичні способи: ${spec1.grammar.moods.allowed.length} vs ${spec2.grammar.moods.allowed.length}`
    );
  }

  // Порівняння ідіом
  if (spec1.lexicon.idioms.allowed !== spec2.lexicon.idioms.allowed) {
    differences.push(
      `Ідіоми: ${spec1.lexicon.idioms.allowed ? "дозволені" : "заборонені"} vs ${spec2.lexicon.idioms.allowed ? "дозволені" : "заборонені"}`
    );
  }

  return {
    harder,
    differences
  };
}
