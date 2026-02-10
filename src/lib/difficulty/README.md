# Difficulty System - Система контролю складності AI генерації

## Огляд

Централізована система для контролю якості AI-генерованого контенту через чіткі специфікації складності (A1-C2).

## Структура

```
difficulty/
├── specs.ts           # Специфікації рівнів A/B/C
├── prompt-builder.ts  # Генерування AI промптів
├── validator.ts       # Автоматична валідація
├── index.ts          # Головний експорт
└── README.md         # Ця документація
```

## Використання

### 1. Базове використання

```typescript
import { generateDifficultyAwarePrompt } from "@/lib/difficulty";

// Генерування промпта для reading exercise
const prompt = generateDifficultyAwarePrompt({
  level: "A2",
  exerciseType: "reading",
  topic: "Подорожі",
  count: 6
});

// Відправити промпт до AI
const response = await fetch("/api/ai/run", {
  method: "POST",
  body: JSON.stringify({
    mode: "reading_text_generate",
    userInput: prompt,
    context: JSON.stringify({ level: "A2" })
  })
});
```

### 2. Валідація згенерованого контенту

```typescript
import { validateGeneratedContent } from "@/lib/difficulty";

// Після отримання відповіді від AI
const generatedText = await response.json();

// Валідація
const validation = validateGeneratedContent({
  content: generatedText,
  level: "A2",
  exerciseType: "reading"
});

if (!validation.valid) {
  console.error("Content doesn't meet quality standards:");
  validation.errors.forEach(err => {
    console.error(`- ${err.message} (${err.severity})`);
  });

  // Можна або регенерувати, або показати помилку користувачу
}

console.log(`Quality score: ${(validation.score * 100).toFixed(0)}%`);
console.log(`Metrics:`, validation.metrics);
```

### 3. Отримання інформації про рівень

```typescript
import { getLevelDescription, getDifficultySpec } from "@/lib/difficulty";

// Для UI
const levelInfo = getLevelDescription("B1");
console.log(levelInfo.name); // "Середній (B1-B2)"
console.log(levelInfo.features); // ["Умовні конструкції", "Підрядні речення", ...]

// Для детальної конфігурації
const spec = getDifficultySpec("B1");
console.log(spec.syntax.wordsPerSentence); // { min: 10, max: 20, avg: 14 }
console.log(spec.grammar.tenses.allowed); // ["present", "past_simple", ...]
```

### 4. Інтеграція в існуючі modes

#### Reading Text Generation

```typescript
// В /api/ai/run/route.ts
import { generateDifficultyAwarePrompt } from "@/lib/difficulty";

if (mode === "reading_text_generate") {
  const level = context.level || "A2";

  const systemPrompt = generateDifficultyAwarePrompt({
    level,
    exerciseType: "reading",
    topic: userInput,
    additionalConstraints: `
      - Створи цікавий текст на тему: "${userInput}"
      - Додай заголовок українською та польською
      - Структура: вступ (1-2 речення) → основна частина → висновок
    `
  });

  return [
    { role: "system", content: systemPrompt },
    { role: "user", content: `Topic: ${userInput}` }
  ];
}
```

#### Test Generation

```typescript
if (mode === "test_generate") {
  const level = context.level || "A2";

  const systemPrompt = generateDifficultyAwarePrompt({
    level,
    exerciseType: "test",
    count: 12,
    additionalConstraints: `
      - ОДНЕ питання = ОДНЕ правило
      - 4 варіанти відповіді (1 правильний, 3 дистрактори)
      - Дистрактори мають бути ПРАВДОПОДІБНИМИ але ЯВНО неправильними
      - Граматична область: ${userInput}
    `
  });

  return [
    { role: "system", content: systemPrompt },
    { role: "user", content: userInput }
  ];
}
```

## Рівні складності

### A (A1-A2) - Початковий
- **Речення**: 5-12 слів, прості структури
- **Граматика**: Теперішній, минулий та майбутній прості часи
- **Лексика**: 1000 найчастіших слів
- **Заборонено**: Пасив, умовні, ідіоми, підрядні

**Приклад:**
```
✅ Wczoraj byłem w parku. (8 слів, простий минулий)
✅ Lubię czytać książki. (4 слова, теперішній)
❌ Gdybym miał czas, przeczytałbym książkę. (Умовний - заборонено)
❌ Książka została napisana w 1990 roku. (Пасив - заборонено)
```

### B (B1-B2) - Середній
- **Речення**: 10-20 слів, 1-2 підрядні
- **Граматика**: Всі прості часи + умовні + модальність
- **Лексика**: До 5000 слів, 1-2 ідіоми на текст
- **Дозволено**: Непряма мова, підрядні, інколи пасив

**Приклад:**
```
✅ Jeśli będę miał czas, pomogę ci. (Умовний простий)
✅ Powiedział, що jutro przyjedzie. (Непряма мова)
✅ Chociaż było zimno, poszliśmy na spacer. (Підрядне допустове)
```

### C (C1-C2) - Просунутий
- **Речення**: 15-35 слів, складні структури
- **Граматика**: Повний арсенал
- **Лексика**: Без обмежень, ідіоми, абстракції
- **Дозволено**: Все, включно з дієприкметниками, інверсією

**Приклад:**
```
✅ Nie mogąc dojść do porozumienia, postanowili odłożyć...
✅ To, co powiedział, choć kontrowersyjne, miało ziarno prawdy.
✅ Gdyby tylko wiedział wcześniej...
```

## Метрики якості

Система автоматично перевіряє:

1. **avgSentenceLength** - Середня довжина речення
2. **subordinateClauseRatio** - % речень з підрядними
3. **passiveVoiceRatio** - % пасивних конструкцій
4. **lexicalDiversity** - Type-token ratio (різноманітність слів)
5. **detectedForbiddenWords** - Заборонені конструкції

## Поріг якості

```typescript
validation.valid === true  // Немає критичних помилок
validation.score >= 0.7    // Якість достатня (70%+)
```

Якщо score < 0.7 - рекомендується регенерація контенту.

## Розширення системи

### Додавання нового рівня

Відредагуй `/src/lib/difficulty/specs.ts`:

```typescript
export const DIFFICULTY_A3: DifficultySpec = {
  id: "A",
  tier: 3,
  // ... налаштування
};
```

### Додавання нових forbidden patterns

```typescript
const forbiddenPatterns = [
  "gdybym", "gdybyś", // Умовний
  "не wiedząc", // Дієприслівник
  // Додай свої:
  "będąc", "mając", "robiąc"
];
```

### Налаштування для нового типу вправи

В `prompt-builder.ts`:

```typescript
case "new_exercise_type":
  return `
**Інструкції для NEW_EXERCISE:**
- Спеціальні правила...
  `;
```

## Best Practices

1. **Завжди валідуй** після генерації
2. **Логуй метрики** для аналізу якості
3. **Регенеруй** якщо score < 0.7
4. **Показуй користувачу** які обмеження діють для його рівня
5. **Тестуй** на реальних користувачах

## Приклад повного workflow

```typescript
// 1. Генерування промпта
const prompt = generateDifficultyAwarePrompt({
  level: userLevel,
  exerciseType: "reading",
  topic: "Кафе"
});

// 2. Запит до AI
const aiResponse = await callAI(prompt);

// 3. Валідація
const validation = validateGeneratedContent({
  content: aiResponse,
  level: userLevel,
  exerciseType: "reading"
});

// 4. Перевірка якості
if (!validation.valid || validation.score < 0.7) {
  // Спробувати ще раз або показати помилку
  console.log("Regenerating due to low quality...");
  return regenerateContent();
}

// 5. Логування метрик
await logMetrics({
  level: userLevel,
  score: validation.score,
  metrics: validation.metrics
});

// 6. Показати користувачу
return aiResponse;
```

## Моніторинг

Рекомендується логувати в БД:

```typescript
await db.collection("content_quality_logs").insertOne({
  userId,
  exerciseType,
  level,
  generatedAt: new Date(),
  validation: {
    valid: validation.valid,
    score: validation.score,
    errors: validation.errors.length,
    warnings: validation.warnings.length
  },
  metrics: validation.metrics
});
```

Це дозволить:
- Відстежувати якість генерації по рівнях
- Знаходити проблемні areas
- Покращувати промпти на основі даних
