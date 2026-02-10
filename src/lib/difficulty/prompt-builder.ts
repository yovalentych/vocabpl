/**
 * Prompt Builder - Генерування AI промптів на основі Difficulty Specs
 *
 * 3-фазний пайплайн:
 * 1. План (структура)
 * 2. Генерація (з constraints)
 * 3. Валідація (self-check)
 */

import { DifficultySpec, getDifficultySpec } from "./specs";

/**
 * Базовий шаблон constraints для промпта
 */
export function buildConstraintsSection(spec: DifficultySpec): string {
  const constraints: string[] = [];

  // === СИНТАКСИС ===
  constraints.push("**СИНТАКСИС (ОБОВ'ЯЗКОВО):**");
  constraints.push(
    `- Довжина речення: ${spec.syntax.wordsPerSentence.min}-${spec.syntax.wordsPerSentence.max} слів (середнє ~${spec.syntax.wordsPerSentence.avg}).`
  );
  constraints.push(
    `- Максимум ${spec.syntax.maxSubordinateClauses} підрядне речення на речення.`
  );
  constraints.push(
    `- Типи речень: ${spec.syntax.allowedSentenceTypes.join(", ")}.`
  );

  if (spec.syntax.bannedPatterns && spec.syntax.bannedPatterns.length > 0) {
    constraints.push(
      `- ЗАБОРОНЕНО: ${spec.syntax.bannedPatterns.join("; ")}.`
    );
  }

  // === ГРАМАТИКА ===
  constraints.push("\n**ГРАМАТИКА (ОБОВ'ЯЗКОВО):**");
  constraints.push(
    `- Дозволені часи: ${spec.grammar.tenses.allowed.join(", ")}.`
  );

  if (spec.grammar.tenses.banned && spec.grammar.tenses.banned.length > 0) {
    constraints.push(
      `- ЗАБОРОНЕНІ часи: ${spec.grammar.tenses.banned.join(", ")}.`
    );
  }

  constraints.push(
    `- Дозволені способи: ${spec.grammar.moods.allowed.join(", ")}.`
  );

  if (spec.grammar.moods.banned && spec.grammar.moods.banned.length > 0) {
    constraints.push(
      `- ЗАБОРОНЕНІ способи: ${spec.grammar.moods.banned.join(", ")}.`
    );
  }

  // Пасив
  const passiveRules: Record<string, string> = {
    forbidden: "ЗАБОРОНЕНО пасивний стан",
    rare: "Пасив ДУЖЕ РІДКО (максимум 1 на текст)",
    occasional: "Пасив інколи допустимий (до 20%)",
    frequent: "Пасив дозволений як стилістичний засіб"
  };
  constraints.push(`- ${passiveRules[spec.grammar.voice.passive]}.`);

  // Складність
  const complexityBans: string[] = [];
  if (!spec.grammar.complexity.indirectSpeech) complexityBans.push("непряма мова");
  if (!spec.grammar.complexity.participialPhrases) complexityBans.push("дієприкметникові звороти");
  if (!spec.grammar.complexity.gerundPhrases) complexityBans.push("дієприслівникові звороти");
  if (!spec.grammar.complexity.inversion) complexityBans.push("інверсія");

  if (complexityBans.length > 0) {
    constraints.push(`- ЗАБОРОНЕНО: ${complexityBans.join(", ")}.`);
  }

  // Сполучники
  if (spec.grammar.structures.bannedConjunctions && spec.grammar.structures.bannedConjunctions.length > 0) {
    constraints.push(
      `- НЕ ВИКОРИСТОВУЙ: ${spec.grammar.structures.bannedConjunctions.join(", ")}.`
    );
  }

  // === ЛЕКСИКА ===
  constraints.push("\n**ЛЕКСИКА (ОБОВ'ЯЗКОВО):**");
  constraints.push(
    `- Реєстр: ${spec.lexicon.register.join(" або ")}.`
  );
  constraints.push(
    `- Частотність слів: ${spec.lexicon.frequencyBand.preferredRange[0]}-${spec.lexicon.frequencyBand.preferredRange[1]} (найчастіші слова).`
  );
  constraints.push(
    `- Нових слів на речення: максимум ${spec.lexicon.newWordsPerSentence}.`
  );

  if (!spec.lexicon.idioms.allowed) {
    constraints.push("- ЗАБОРОНЕНО ідіоми та фразеологізми.");
  } else {
    constraints.push(
      `- Ідіоми: максимум ${spec.lexicon.idioms.maxPerText} на текст (${spec.lexicon.idioms.types?.join(", ")}).`
    );
  }

  if (!spec.lexicon.slang.allowed) {
    constraints.push("- ЗАБОРОНЕНО сленг.");
  }

  if (spec.lexicon.abstractConcepts === "forbidden") {
    constraints.push("- Використовуй ТІЛЬКИ конкретні, фізичні поняття. Абстракції заборонені.");
  }

  // === ПРАГМАТИКА ===
  constraints.push("\n**КОМУНІКАЦІЯ:**");
  constraints.push(
    `- Комунікативні наміри: ${spec.pragmatics.allowedIntents.slice(0, 6).join(", ")}.`
  );
  constraints.push(
    `- Тон: ${spec.pragmatics.tone.join(" / ")}.`
  );

  if (spec.pragmatics.implicitness === "explicit") {
    constraints.push("- Все має бути ЯВНИМ та ПРЯМИМ. Без натяків.");
  }

  return constraints.join("\n");
}

/**
 * Секція валідації для self-check
 */
export function buildValidationSection(spec: DifficultySpec): string {
  const checks: string[] = [];

  checks.push("**SELF-CHECK (обов'язковий перед відправкою):**");
  checks.push("Перевір кожне речення на:");

  if (spec.validation.checks.avgSentenceLength) {
    checks.push(
      `1. Довжина: ${spec.syntax.wordsPerSentence.min}-${spec.syntax.wordsPerSentence.max} слів.`
    );
  }

  if (spec.validation.checks.subordinateClauseRatio) {
    checks.push(
      `2. Підрядні: максимум ${spec.syntax.maxSubordinateClauses} на речення.`
    );
  }

  if (spec.validation.checks.passiveVoiceRatio) {
    if (spec.grammar.voice.passive === "forbidden") {
      checks.push("3. Пасив: ЗАБОРОНЕНО (перевір кожне речення!).");
    } else {
      checks.push(
        `3. Пасив: не більше ${spec.validation.thresholds.maxPassiveRatio * 100}% речень.`
      );
    }
  }

  if (spec.validation.checks.forbiddenWords) {
    checks.push(
      "4. Заборонені конструкції: перевір список вище та ВИДАЛИ їх."
    );
  }

  checks.push("\nЯкщо хоч одне речення не проходить перевірку - ПЕРЕПИШИ його.");

  return checks.join("\n");
}

/**
 * Приклади для промпта
 */
export function buildExamplesSection(spec: DifficultySpec): string {
  if (spec.examples.good.length === 0) {
    return "";
  }

  const examples: string[] = [];

  examples.push("**ПРИКЛАДИ ПРАВИЛЬНИХ РЕЧЕНЬ:**");
  spec.examples.good.forEach((ex, i) => {
    examples.push(`${i + 1}. ${ex}`);
  });

  if (spec.examples.bad.length > 0) {
    examples.push("\n**ПРИКЛАДИ НЕПРАВИЛЬНИХ РЕЧЕНЬ (не роби так!):**");
    spec.examples.bad.forEach((ex, i) => {
      examples.push(`${i + 1}. ${ex}`);
    });
  }

  return examples.join("\n");
}

/**
 * Повний промпт для генерації контенту
 */
export function buildGenerationPrompt(options: {
  level: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
  exerciseType: "reading" | "translation" | "dialogue" | "test" | "sentences";
  topic?: string;
  additionalConstraints?: string;
  count?: number; // Кількість речень/питань
}): string {
  const spec = getDifficultySpec(options.level);

  const sections: string[] = [];

  // Роль
  sections.push(`Ти експерт-розробник навчального контенту польської мови рівня ${options.level} (CEFR).`);
  sections.push(`Твоя задача: створити ЯКІСНИЙ контент для вправи типу "${options.exerciseType}".`);

  // Тема
  if (options.topic) {
    sections.push(`\nТема: ${options.topic}`);
  }

  // Рівень і обмеження
  sections.push(`\n**РІВЕНЬ: ${spec.name}**`);
  sections.push(spec.description);

  // Constraints
  sections.push(`\n${buildConstraintsSection(spec)}`);

  // Додаткові обмеження
  if (options.additionalConstraints) {
    sections.push(`\n**ДОДАТКОВІ ВИМОГИ:**`);
    sections.push(options.additionalConstraints);
  }

  // Приклади
  const examples = buildExamplesSection(spec);
  if (examples) {
    sections.push(`\n${examples}`);
  }

  // Валідація
  sections.push(`\n${buildValidationSection(spec)}`);

  // Формат відповіді
  sections.push("\n**ФОРМАТ ВІДПОВІДІ:**");
  sections.push("Поверни ТІЛЬКИ валідний JSON без пояснень.");

  return sections.join("\n");
}

/**
 * Промпт для перевірки та виправлення
 */
export function buildValidationPrompt(options: {
  level: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
  generatedContent: string;
}): string {
  const spec = getDifficultySpec(options.level);

  return `Ти експерт з перевірки навчального контенту польської мови.

**ЗАДАЧА:** Перевір чи згенерований контент відповідає вимогам рівня ${options.level}.

**КОНТЕНТ ДЛЯ ПЕРЕВІРКИ:**
${options.generatedContent}

**КРИТЕРІЇ ПЕРЕВІРКИ:**
${buildConstraintsSection(spec)}

**ТВОЯ ВІДПОВІДЬ (JSON):**
{
  "valid": boolean,
  "errors": string[],  // Список знайдених помилок
  "suggestions": string[],  // Пропозиції виправлень
  "correctedContent": string | null  // Виправлений контент (якщо потрібно)
}

Якщо є хоч одна помилка - верни valid: false та виправлений варіант.`;
}

/**
 * Короткий інструктаж для конкретного типу вправи
 */
export function getExerciseSpecificInstructions(
  exerciseType: string,
  spec: DifficultySpec
): string {
  switch (exerciseType) {
    case "reading":
      return `
**Інструкції для READING:**
- Загальна довжина: ${spec.format.reading?.totalWords.min}-${spec.format.reading?.totalWords.max} слів.
- Довжина абзацу: ${spec.format.reading?.paragraphLength.min}-${spec.format.reading?.paragraphLength.max} речень.
- Зв'язність: використовуй ${spec.format.reading?.cohesiveDevices.join(" / ")} cohesive devices.
- Структура: вступ → розвиток → висновок.
`;

    case "dialogue":
      return `
**Інструкції для DIALOGUE:**
- Кількість реплік: ${spec.format.dialogue?.turnsCount.min}-${spec.format.dialogue?.turnsCount.max}.
- Довжина репліки: ${spec.format.dialogue?.wordsPerTurn.min}-${spec.format.dialogue?.wordsPerTurn.max} слів.
- Природність: діалог має звучати реалістично.
- Контекст: вкажи де відбувається розмова.
`;

    case "translation":
    case "sentences":
      return `
**Інструкції для SENTENCES:**
- Кількість речень: ${spec.format.sentences?.count.min}-${spec.format.sentences?.count.max}.
- Різноманітність: ${spec.format.sentences?.variety}.
- Кожне речення має бути самостійним (не залежати від попередніх).
`;

    case "test":
      return `
**Інструкції для TEST:**
- ОДНЕ питання = ОДНЕ правило граматики.
- Дистрактори мають бути правдоподібними але ЯВНО неправильними.
- Без "пасток" і двозначностей.
- Перевіряй ТІЛЬКИ те, що відповідає рівню ${spec.id}.
`;

    default:
      return "";
  }
}
