/**
 * Content Validator - Автоматична перевірка згенерованого контенту
 *
 * Перевіряє чи відповідає контент Difficulty Spec
 */

import { DifficultySpec } from "./specs";

export interface ValidationResult {
  valid: boolean;
  score: number; // 0-1, наскільки добре відповідає
  errors: ValidationError[];
  warnings: string[];
  metrics: ContentMetrics;
}

export interface ValidationError {
  type: string;
  message: string;
  severity: "critical" | "major" | "minor";
  affectedContent?: string;
}

export interface ContentMetrics {
  avgSentenceLength: number;
  sentenceCount: number;
  wordCount: number;
  subordinateClauseRatio: number;
  passiveVoiceRatio: number;
  lexicalDiversity: number; // Type-token ratio
  detectedIdioms: number;
  detectedForbiddenWords: string[];
}

/**
 * Базова валідація тексту
 */
export function validateContent(
  content: string,
  spec: DifficultySpec
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: string[] = [];

  // Розбити на речення (примітивно, але працює для базової валідації)
  const sentences = content
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const metrics = calculateMetrics(content, sentences);

  // === ПЕРЕВІРКА 1: Середня довжина речення ===
  if (spec.validation.checks.avgSentenceLength) {
    const { min, max } = spec.syntax.wordsPerSentence;
    const avg = metrics.avgSentenceLength;

    if (avg < min || avg > max) {
      errors.push({
        type: "sentence_length",
        message: `Середня довжина речення ${avg.toFixed(1)} слів. Очікувалось ${min}-${max} слів.`,
        severity: "major"
      });
    }

    // Warning якщо близько до меж
    if (avg < min + 1 || avg > max - 1) {
      warnings.push(
        `Середня довжина речення близька до межі (${avg.toFixed(1)} слів).`
      );
    }
  }

  // === ПЕРЕВІРКА 2: Підрядні речення ===
  if (spec.validation.checks.subordinateClauseRatio) {
    const threshold = spec.validation.thresholds.maxSubordinateRatio;
    const actual = metrics.subordinateClauseRatio;

    if (actual > threshold) {
      errors.push({
        type: "subordinate_clauses",
        message: `Занадто багато підрядних речень: ${(actual * 100).toFixed(0)}%. Максимум ${(threshold * 100).toFixed(0)}%.`,
        severity: "major"
      });
    }
  }

  // === ПЕРЕВІРКА 3: Пасивний стан ===
  if (spec.validation.checks.passiveVoiceRatio) {
    const threshold = spec.validation.thresholds.maxPassiveRatio;
    const actual = metrics.passiveVoiceRatio;

    if (actual > threshold) {
      errors.push({
        type: "passive_voice",
        message: `Занадто багато пасиву: ${(actual * 100).toFixed(0)}%. Максимум ${(threshold * 100).toFixed(0)}%.`,
        severity: spec.grammar.voice.passive === "forbidden" ? "critical" : "major"
      });
    }
  }

  // === ПЕРЕВІРКА 4: Заборонені слова ===
  if (spec.validation.checks.forbiddenWords) {
    if (metrics.detectedForbiddenWords.length > 0) {
      errors.push({
        type: "forbidden_words",
        message: `Знайдено заборонені конструкції: ${metrics.detectedForbiddenWords.join(", ")}`,
        severity: "critical",
        affectedContent: metrics.detectedForbiddenWords.join(", ")
      });
    }
  }

  // === ПЕРЕВІРКА 5: Лексичне різноманіття ===
  if (spec.validation.checks.lexicalDiversity) {
    const threshold = spec.validation.thresholds.minLexicalDiversity;
    const actual = metrics.lexicalDiversity;

    if (actual < threshold) {
      warnings.push(
        `Низьке лексичне різноманіття: ${(actual * 100).toFixed(0)}%. Рекомендовано ${(threshold * 100).toFixed(0)}%+.`
      );
    }
  }

  // === ПЕРЕВІРКА 6: Ідіоми ===
  if (!spec.lexicon.idioms.allowed && metrics.detectedIdioms > 0) {
    errors.push({
      type: "idioms",
      message: `Ідіоми заборонені для цього рівня, але знайдено ${metrics.detectedIdioms}.`,
      severity: "major"
    });
  } else if (
    spec.lexicon.idioms.allowed &&
    metrics.detectedIdioms > spec.lexicon.idioms.maxPerText
  ) {
    warnings.push(
      `Занадто багато ідіом: ${metrics.detectedIdioms}. Максимум ${spec.lexicon.idioms.maxPerText}.`
    );
  }

  // Розрахувати загальний score
  const score = calculateScore(errors, warnings);

  return {
    valid: errors.filter((e) => e.severity === "critical").length === 0,
    score,
    errors,
    warnings,
    metrics
  };
}

/**
 * Розрахунок метрик контенту
 */
function calculateMetrics(content: string, sentences: string[]): ContentMetrics {
  const words = content.split(/\s+/).filter((w) => w.length > 0);
  const wordCount = words.length;
  const sentenceCount = sentences.length;

  // Середня довжина речення
  const avgSentenceLength =
    sentenceCount > 0 ? wordCount / sentenceCount : 0;

  // Підрахунок підрядних (примітивно - по комах та сполучниках)
  const subordinateMarkers = [
    "що", "який", "яка", "яке", "які",
    "коли", "де", "хоча", "якщо", "тому що",
    "оскільки", "поки", "якби"
  ];
  let subordinateCount = 0;
  sentences.forEach((s) => {
    const lowerSentence = s.toLowerCase();
    subordinateMarkers.forEach((marker) => {
      if (lowerSentence.includes(marker)) {
        subordinateCount++;
      }
    });
  });
  const subordinateClauseRatio =
    sentenceCount > 0 ? subordinateCount / sentenceCount : 0;

  // Підрахунок пасиву (примітивно - шукаємо "został/została/zostało")
  const passiveMarkers = [
    "został", "została", "zostało", "zostali", "zostały",
    "był", "była", "było", "byli", "były"
  ];
  let passiveCount = 0;
  sentences.forEach((s) => {
    const lowerSentence = s.toLowerCase();
    // Пасив часто має форму "був/був зроблений"
    const hasPassiveMarker = passiveMarkers.some((marker) =>
      lowerSentence.includes(marker)
    );
    // Примітивна евристика: marker + дієприкметник (закінчення -ny/-ty/-ony/-any)
    const hasParticiple = /\b\w+(ny|ty|ony|any|na|ta|ne|te)\b/i.test(s);
    if (hasPassiveMarker && hasParticiple) {
      passiveCount++;
    }
  });
  const passiveVoiceRatio =
    sentenceCount > 0 ? passiveCount / sentenceCount : 0;

  // Лексичне різноманіття (type-token ratio)
  const uniqueWords = new Set(
    words.map((w) => w.toLowerCase().replace(/[.,!?;:]/g, ""))
  );
  const lexicalDiversity =
    wordCount > 0 ? uniqueWords.size / wordCount : 0;

  // Детекція ідіом (примітивний список)
  const commonIdioms = [
    "ani be ani me", "cicho sza", "jak burza", "robić hałas",
    "wziąć się w garść", "lać jak z cebra"
  ];
  let detectedIdioms = 0;
  const lowerContent = content.toLowerCase();
  commonIdioms.forEach((idiom) => {
    if (lowerContent.includes(idiom)) {
      detectedIdioms++;
    }
  });

  // Детекція заборонених слів
  const forbiddenPatterns = [
    "gdybym", "gdybyś", "gdyby", "gdybyśmy", "gdybyście",
    "nie wiedząc", "nie mając", "będąc",
    "niezważaючи на", "pomimo"
  ];
  const detectedForbiddenWords: string[] = [];
  forbiddenPatterns.forEach((pattern) => {
    if (lowerContent.includes(pattern.toLowerCase())) {
      detectedForbiddenWords.push(pattern);
    }
  });

  return {
    avgSentenceLength,
    sentenceCount,
    wordCount,
    subordinateClauseRatio,
    passiveVoiceRatio,
    lexicalDiversity,
    detectedIdioms,
    detectedForbiddenWords
  };
}

/**
 * Розрахунок загального score (0-1)
 */
function calculateScore(
  errors: ValidationError[],
  warnings: string[]
): number {
  let score = 1.0;

  errors.forEach((error) => {
    if (error.severity === "critical") {
      score -= 0.3;
    } else if (error.severity === "major") {
      score -= 0.15;
    } else {
      score -= 0.05;
    }
  });

  warnings.forEach(() => {
    score -= 0.02;
  });

  return Math.max(0, Math.min(1, score));
}

/**
 * Валідація для конкретного типу вправи
 */
export function validateExerciseContent(
  content: any,
  exerciseType: "reading" | "translation" | "dialogue" | "test",
  spec: DifficultySpec
): ValidationResult {
  let textToValidate = "";

  // Екстракт тексту залежно від типу вправи
  switch (exerciseType) {
    case "reading":
      textToValidate = content.text?.pl || content.text || "";
      break;

    case "translation":
      if (Array.isArray(content.items)) {
        textToValidate = content.items
          .map((item: any) => item.source || "")
          .join(" ");
      }
      break;

    case "dialogue":
      if (Array.isArray(content.turns)) {
        textToValidate = content.turns
          .map((turn: any) => turn.pl || turn.text || "")
          .join(" ");
      }
      break;

    case "test":
      if (Array.isArray(content.questions)) {
        textToValidate = content.questions
          .map((q: any) => q.question?.pl || q.text || "")
          .join(" ");
      }
      break;
  }

  return validateContent(textToValidate, spec);
}

/**
 * Швидка перевірка чи контент пройшов validation
 */
export function quickValidate(content: string, spec: DifficultySpec): boolean {
  const result = validateContent(content, spec);
  return result.valid && result.score >= 0.7;
}
