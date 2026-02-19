import { NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { getAuthUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { isSubscriptionActive } from "@/lib/subscription";
import { getPlanById, DEFAULT_PLAN_ID } from "@/lib/plans";
import { ObjectId } from "mongodb";
import { selectModel, getMaxTokensForModel, validateModelSelection } from "@/lib/ai-models";
import { generateDifficultyAwarePrompt, getDifficultySpec } from "@/lib/difficulty";

export const dynamic = "force-dynamic";

function buildPrompt(mode: string, userInput: string, context: string) {
  if (mode === "translate_generate") {
    // Parse input to get level, direction, topic
    let parsed: any = {};
    try {
      parsed = JSON.parse(userInput);
    } catch (e) {
      parsed = { level: "A2", direction: "uk_to_pl", topic: userInput };
    }

    const level = parsed.level || "A2";
    const direction = parsed.direction || "uk_to_pl";
    const topic = parsed.topic || "general";
    const count = parsed.count || 8;

    // Generate difficulty-aware prompt
    const difficultyPrompt = generateDifficultyAwarePrompt({
      level: level as any,
      exerciseType: "translation",
      topic,
      count,
      additionalConstraints: `
**ФОРМАТ ВІДПОВІДІ (JSON):**
{
  "task": {
    "id": string,
    "type": "translate_sentences",
    "level": string,
    "direction": "${direction}",
    "topic": string,
    "items": [
      {
        "id": string,
        "source": string (${direction === "uk_to_pl" ? "UKRAINIAN" : "POLISH"} sentence),
        "hints": string|null,
        "targetVocab": string[]
      }
    ]
  },
  "ui": {
    "title": string,
    "instructions": string
  }
}

**КРИТИЧНО ВАЖЛИВО:**
- Direction: "${direction}"
- ${direction === "uk_to_pl" ? "source sentences MUST be in UKRAINIAN" : "source sentences MUST be in POLISH"}
- Кількість речень: ${count}
- Всі речення мають відповідати рівню ${level}
- Use vocabPool if provided
      `
    });

    return [
      { role: "system", content: difficultyPrompt },
      { role: "user", content: `Topic: ${topic}\nDirection: ${direction}\nCount: ${count}` }
    ];
  }
  if (mode === "translate_check") {
    return [
      {
        role: "system",
        content:
          `You are a Polish language tutor evaluating student translations.

**RETURN STRICT JSON ONLY** with this schema:
{
  "overall": {
    "accuracy": number (0-100, overall accuracy percentage),
    "points": number (0-10 scale, points awarded for this exercise),
    "xp": number (0-50 range, experience points),
    "feedback": string (Ukrainian - overall performance summary, 2-3 sentences)
  },
  "items": [
    {
      "source": string (original sentence that was translated),
      "userTranslation": string (user's translation),
      "score": number (0-1 scale, correctness score for this sentence),
      "verdict": "excellent"|"good"|"acceptable"|"weak"|"poor",
      "reference": string (best/model translation),
      "feedback": string (Ukrainian - detailed feedback on THIS translation: what's good, what needs improvement),
      "improvements": [
        {
          "issue": string (Ukrainian - describe what was wrong/suboptimal),
          "original": string (user's problematic phrase),
          "improved": string (corrected/better version),
          "explanation": string (Ukrainian - why this is better)
        }
      ],
      "alternativeVersions": string[] (2-3 other valid translation options)
    }
  ],
  "suggestedVocab": [
    {
      "lemma": string (Polish word in base form),
      "translation": string (Ukrainian translation),
      "reason": string (Ukrainian - why this word is useful: appeared in exercise, commonly used, helpful for topic)
    }
  ]
}

**EVALUATION CRITERIA:**
1. **Accuracy** - Does translation convey the original meaning?
2. **Grammar** - Correct grammar, cases, verb forms, word order
3. **Naturalness** - Sounds like native speaker would say it
4. **Vocabulary** - Appropriate word choice for context and level

**SCORING RULES:**
- score 0.9-1.0 = "excellent" (perfect or near-perfect)
- score 0.7-0.89 = "good" (minor issues, meaning preserved)
- score 0.5-0.69 = "acceptable" (understandable but has problems)
- score 0.3-0.49 = "weak" (major issues, meaning partially lost)
- score 0-0.29 = "poor" (incorrect, meaning lost or reversed)

**FEEDBACK GUIDELINES:**
- Be constructive and specific
- Point out both strengths and weaknesses
- Explain WHY something is wrong, not just THAT it's wrong
- Provide concrete examples and alternatives
- Use Ukrainian for all feedback

**IMPROVEMENTS:**
- Only include if there ARE actual issues
- Be specific about the problem
- Show the exact phrase that needs improvement
- Provide the corrected version
- Explain the grammatical/lexical reason

**VOCABULARY SUGGESTIONS:**
- Suggest 3-5 useful Polish words from the exercise
- Prioritize: words user struggled with, high-frequency words, thematic vocabulary
- Explain practical usage or why it's important
- Include Ukrainian translations

**IMPORTANT:**
- Calculate overall.accuracy as average of all items' scores * 100
- Calculate overall.points as (overall.accuracy / 10) rounded to 1 decimal
- Be fair but encouraging - this is for learning, not punishment
- Use Ukrainian (uk) for all feedback, reasons, and explanations`
      },
      {
        role: "user",
        content: `Request:\n${userInput}\nContext:\n${context}`
      }
    ];
  }
  if (mode === "mini_dialog_generate") {
    // Parse input to get level and situation
    let parsed: any = {};
    try {
      parsed = JSON.parse(userInput);
    } catch (e) {
      parsed = { level: "A2", situation: userInput };
    }

    const level = parsed.level || "A2";
    const situation = parsed.situation || "casual conversation";

    return [
      {
        role: "system",
        content: `You are a Polish language tutor creating a conversation practice dialogue.

SITUATION: ${situation}
LEVEL: ${level}

Your task: Start a natural dialogue by providing the FIRST AI turn.

CRITICAL INSTRUCTIONS:
1. Analyze the situation: "${situation}"
2. Determine what ROLE the AI should play (e.g., for "проблема з інтернетом" → internet provider employee; for "замовлення каві" → barista; for "питання про дорогу" → local person)
3. Create an opening line from that role's perspective that:
   - Introduces the role naturally (e.g., "Dzień dobry! Nazywam się Anna, pracuję w firmie internetowej TechNet. Jak mogę pomóc?")
   - Sets the conversation direction (e.g., asks about the problem, offers help, responds to customer)
   - Is appropriate and realistic for the situation

REQUIREMENTS:
- Opening MUST be contextual and role-appropriate for: "${situation}"
- Use vocabulary and grammar suitable for ${level} learners
- Keep it SHORT but complete (2-3 sentences max)
- Sound NATURAL and professional/friendly as appropriate
- Establish clear context for the learner to respond

EXAMPLES:
- "Проблема з інтернетом" → "Dzień dobry! Nazywam się Tomasz z działu technicznego NetPol. Rozumiem, że ma Pan/Pani problem z internetem. Proszę opisać, co się dzieje?"
- "Замовлення каві" → "Dzień dobry! Witam w naszej kawiarni. Co mogę dla Pani/Pana przygotować?"
- "Питання про дорогу" → "Dzień dobry! Tak, oczywiście mogę pomóc. Dokąd Pan/Pani chce się dostać?"

RETURN STRICT JSON ONLY:
{
  "firstTurn": string (AI's contextual opening line in Polish)
}

IMPORTANT:
- firstTurn must be in POLISH
- Must establish clear role and context
- Match the ${level} difficulty level
- Be professional but friendly`
      },
      {
        role: "user",
        content: `Start a dialogue for situation: "${situation}" at ${level} level`
      }
    ];
  }
  if (mode === "mini_dialog_continue") {
    // Parse input to get conversation context
    let parsed: any = {};
    try {
      parsed = JSON.parse(userInput);
    } catch (e) {
      parsed = { situation: "", level: "A2", conversationHistory: [] };
    }

    const situation = parsed.situation || "casual conversation";
    const level = parsed.level || "A2";
    const history = parsed.conversationHistory || [];

    // Build conversation history for context
    const conversationContext = history.map((turn: any) =>
      `${turn.speaker === "ai" ? "AI співрозмовник" : "Користувач"}: ${turn.text}`
    ).join("\n");

    return [
      {
        role: "system",
        content: `You are a Polish language tutor acting as a conversation partner in a mini dialogue practice.

SITUATION: ${situation}
LEVEL: ${level}
CONVERSATION SO FAR:
${conversationContext}

Your task: Continue the dialogue by providing the NEXT AI turn (response).

CRITICAL INSTRUCTIONS:
1. Identify the ROLE you're playing from the conversation history (e.g., internet provider employee, barista, local person, etc.)
2. Stay IN CHARACTER throughout the conversation
3. Respond naturally to what the user just said
4. Keep the conversation flowing toward resolving the situation

REQUIREMENTS:
- Maintain the SAME ROLE and context established in the first message
- Keep response natural and appropriate for ${level} level
- Stay focused on the situation: "${situation}"
- Response should be 1-2 short sentences max
- Use vocabulary and grammar appropriate for ${level} learners
- Make it conversational, helpful, and realistic
- If appropriate, ask follow-up questions or offer solutions

RETURN STRICT JSON ONLY:
{
  "nextTurn": string (AI's next line in the dialogue, in Polish)
}

IMPORTANT:
- nextTurn must be in POLISH
- Keep it SHORT (1-2 sentences)
- Sound NATURAL and stay in character
- Match the ${level} difficulty level
- Be helpful and guide the conversation naturally`
      },
      {
        role: "user",
        content: `Continue the dialogue. The user just said: "${history[history.length - 1]?.text || ""}"`
      }
    ];
  }
  if (mode === "video_open_check") {
    let parsed: any = {};
    let ctx: any = {};
    try {
      parsed = JSON.parse(userInput);
    } catch {
      parsed = { question: "", answer: userInput };
    }
    try {
      ctx = JSON.parse(context);
    } catch {
      ctx = {};
    }
    const question = parsed.question || "";
    const answer = parsed.answer || "";
    const transcript = String(ctx.transcript || "").slice(0, 6000);
    const locale = ctx.locale === "uk" ? "uk" : "pl";
    const sampleAnswer = ctx.sampleAnswer || "";
    const languageInstruction =
      locale === "uk"
        ? "Відповідай українською."
        : "Odpowiadaj po polsku.";

    return [
      {
        role: "system",
        content: `You are a Polish language tutor evaluating a student's open answer about a video.

Context:
- Video title: ${ctx.title || "video"}
- Level: ${ctx.level || "A2"}
- Transcript (if provided): ${transcript || "not provided"}

Task:
1) Judge if the answer matches the question and video content.
2) Give a score 0-100.
3) Provide brief, constructive feedback (2-4 sentences).
4) If needed, suggest 1-2 improvements or corrections.

${languageInstruction}
Return plain text (no JSON).`
      },
      {
        role: "user",
        content: `Question: ${question}\nStudent answer: ${answer}\nSample answer (optional): ${sampleAnswer}`
      }
    ];
  }
  if (mode === "mini_dialog_roleplay") {
    // Parse context to get level
    let ctxParsed: any = {};
    try { ctxParsed = JSON.parse(context); } catch (e) { ctxParsed = {}; }
    const level = ctxParsed.level || "A2";

    return [
      {
        role: "system",
        content:
          `You are a Polish tutor roleplaying a dialogue at ${level} level.

**RETURN STRICT JSON ONLY:**
{"aiText":string,"usedVocabIds":string[],"coach":{"quickFeedbackUk":string,"nextTargetVocabIds":string[]}|null}

**ПРАВИЛА РОЗМОВИ (рівень ${level}):**
${level.startsWith("A")
  ? "- Відповідь: 1-2 короткі речення, прості конструкції.\n- Лексика: базова, високочастотна.\n- Граматика: теперішній та минулий час, прості відмінки."
  : "- Відповідь: 2-3 речення, можна складніші конструкції.\n- Лексика: різноманітна, тематична.\n- Граматика: допускається умовний спосіб, підрядні речення."}

**КОНСИСТЕНТНІСТЬ ПЕРСОНАЖА:**
- Залишайся в ролі, встановленій на початку діалогу.
- Реагуй природно на те, що сказав користувач.
- Якщо користувач допустив помилку — coach має це відзначити.

**ЯКІСТЬ COACHING FEEDBACK:**
- quickFeedbackUk: УКРАЇНСЬКОЮ, конкретний фідбек на репліку користувача.
- НЕ "Добре!" або "Гарна робота!" без деталей.
- ТАК: "Правильно вжито 'chciałbym', але після 'do' потрібен родовий відмінок: 'do sklepu', а не 'do sklep'."
- Якщо помилок немає — коротко підтвердити і запропонувати варіацію.
- nextTargetVocabIds: слова з vocabPool, які варто використати далі.

**КРИТИЧНО:**
- aiText: ТІЛЬКИ ПОЛЬСЬКОЮ.
- coach.quickFeedbackUk: ТІЛЬКИ УКРАЇНСЬКОЮ.
- usedVocabIds: ID слів з vocabPool, що були використані в aiText.`
      },
      { role: "user", content: `Request:\n${userInput}\nContext:\n${context}` }
    ];
  }
  if (mode === "mini_dialog_check") {
    return [
      {
        role: "system",
        content:
          `You are an expert Polish language tutor evaluating a student's mini-dialogue performance.

**RETURN STRICT JSON ONLY:**
{"overall":{"score01":number,"band":string,"pointsForRating":number,"xp":number},"breakdown":{"completion01":number,"grammar01":number,"vocab01":number,"politeness01":number},"feedback":string,"improvedSample":string,"suggestedVocab":[{"lemma":string,"meaning":string,"reason":string}]}

**4 КРИТЕРІЇ ОЦІНЮВАННЯ:**

1. **completion01** (вага 0.3) — Виконання комунікативної задачі:
   - 0.9-1.0: Діалог завершений, ситуація розв'язана, всі ключові моменти покриті.
   - 0.6-0.8: Діалог частково завершений, основна задача виконана.
   - 0.3-0.5: Діалог незавершений, ситуація не розв'язана.
   - 0.0-0.2: Відповідь не по темі або відсутня.

2. **grammar01** (вага 0.3) — Граматична правильність:
   - 0.9-1.0: Без помилок або мінімальні стилістичні нюанси.
   - 0.6-0.8: 1-2 граматичні помилки, зміст зрозумілий.
   - 0.3-0.5: Множинні помилки, зміст частково зрозумілий.
   - 0.0-0.2: Текст граматично незрозумілий або не польською.

3. **vocab01** (вага 0.2) — Лексика:
   - 0.9-1.0: Різноманітна, доречна лексика для ситуації.
   - 0.6-0.8: Базова але правильна лексика.
   - 0.3-0.5: Обмежена або частково неправильна лексика.
   - 0.0-0.2: Лексика не відповідає ситуації.

4. **politeness01** (вага 0.2) — Ввічливість та доречність:
   - 0.9-1.0: Правильні форми звертання (Pan/Pani), доречний тон.
   - 0.6-0.8: Прийнятний тон, незначні стилістичні недоліки.
   - 0.3-0.5: Невідповідний тон для ситуації.

**ФОРМУЛА:** score01 = completion01*0.3 + grammar01*0.3 + vocab01*0.2 + politeness01*0.2

**SCORING:**
- pointsForRating = Math.round(score01 * 10) (0-10)
- xp = Math.round(score01 * 50) (0-50)
- band: score01 >= 0.9 → "excellent", >= 0.7 → "good", >= 0.5 → "acceptable", >= 0.3 → "weak", < 0.3 → "poor"

**FEEDBACK RULES:**
- feedback: УКРАЇНСЬКОЮ, 2-3 речення. Конкретний — вкажи що саме добре/погано.
- improvedSample: покращена версія відповіді ПОЛЬСЬКОЮ.
- suggestedVocab: 2-4 корисні слова з контексту діалогу (meaning та reason УКРАЇНСЬКОЮ).
- НЕ пиши загальні фрази ("покращте граматику"). Пиши КОНКРЕТНО ("замість 'do sklep' використовуйте 'do sklepu' — родовий відмінок після 'do'").`
      },
      { role: "user", content: `Request:\n${userInput}\nContext:\n${context}` }
    ];
  }
  if (mode === "paraphrase_generate") {
    // Parse input to get level
    let parsed: any = {};
    try {
      parsed = JSON.parse(userInput);
    } catch (e) {
      parsed = {};
    }
    const level = parsed.level || "A2";
    const topic = parsed.topic || "general";

    const difficultyPrompt = generateDifficultyAwarePrompt({
      level: level as any,
      exerciseType: "paraphrase",
      topic,
      additionalConstraints: `
**ФОРМАТ ВІДПОВІДІ (JSON):**
{"task":{"id":string,"type":"paraphrase","level":string,"items":[{"id":string,"sourcePl":string,"instructionUk":string,"instructionPl":string,"constraints":{"forbiddenWords":string[],"requireAtLeastOneOf":string[],"minWords":number},"targetVocabIds":string[]}]}}

**ЗАДАЧА:** Створи 4-6 речень для перефразування.

**ПРИНЦИПИ ДИЗАЙНУ:**
- sourcePl: ПРИРОДНЕ польське речення (не підручникове). ОБОВ'ЯЗКОВО ПОЛЬСЬКОЮ.
- instructionPl: інструкція ПОЛЬСЬКОЮ. instructionUk: інструкція УКРАЇНСЬКОЮ.
- forbiddenWords: стратегічно обрані слова, що ЗМУШУЮТЬ перефразувати.

**РІВНЕВІ СТРАТЕГІЇ:**
${level.startsWith("A")
  ? `- A-рівень: проста заміна слів синонімами.
- 1-2 forbidden words на речення.
- sourcePl: короткі прості речення (4-8 слів).
- minWords: 3-5 (менше ніж source).
- Приклад: "Lubię jeść jabłka" з forbidden ["lubić"] → студент пише "Jem jabłka z przyjemnością".`
  : level.startsWith("B")
    ? `- B-рівень: структурна трансформація (активний→пасивний, пряма→непряма мова).
- 2-3 forbidden words на речення.
- sourcePl: середні речення (6-12 слів).
- minWords: 5-8.
- Приклад: "Maria kupiła nowy samochód" з forbidden ["kupić", "nowy"] → "Maria nabyła świeży pojazd".`
    : `- C-рівень: повне перефразування зі збереженням нюансів.
- 3-4 forbidden words.
- sourcePl: складні речення (10-18 слів).
- minWords: 8-12.`}

**ЯКІСТЬ:**
- constraints ДОСЯЖНІ для рівня ${level}: не вимагай конструкцій вище рівня.
- requireAtLeastOneOf: слова, що природно підходять для перефразування.
- Use vocabPool if provided.
      `
    });

    return [
      { role: "system", content: difficultyPrompt },
      { role: "user", content: `Request:\n${userInput}\nContext:\n${context}` }
    ];
  }
  if (mode === "paraphrase_check") {
    return [
      {
        role: "system",
        content:
          `You are an expert Polish language tutor evaluating paraphrase exercises.

**RETURN STRICT JSON ONLY:**
{"overall":{"score01":number,"band":string,"pointsForRating":number,"xp":number},"breakdown":{"meaning01":number,"compliance01":number,"grammar01":number,"rephrase01":number,"style01":number},"items":[{"id":string,"score01":number,"verdict":"ok"|"weak"|"bad","quickFeedbackUk":string,"issues":string[],"reference":string[],"improvedUserVersionPl":string}],"suggestedVocab":[{"lemma":string,"pos":string,"meaningUk":string,"reasonUk":string}]}

**5 ВИМІРІВ ОЦІНЮВАННЯ (для кожного item та overall):**

1. **meaning01** (0-1) — Збереження змісту:
   - 1.0: Зміст повністю збережений, всі нюанси передані.
   - 0.7-0.9: Основний зміст збережений, дрібні нюанси втрачені.
   - 0.3-0.6: Зміст частково змінений, але зрозумілий.
   - 0.0-0.2: Зміст спотворений або втрачений.

2. **compliance01** (0-1) — Дотримання constraints:
   - КРИТИЧНО: Якщо використано forbidden word → compliance01 = 0.0 для цього item!
   - Перевір КОЖНЕ forbidden word (case-insensitive, враховуй всі форми слова).
   - requireAtLeastOneOf: чи використано хоча б одне з required слів.
   - minWords: чи дотримано мінімальну довжину.
   - 1.0: Всі constraints дотримані. 0.5: Частково. 0.0: forbidden word використано.

3. **grammar01** (0-1) — Граматична правильність перефразування.

4. **rephrase01** (0-1) — Якість перефразування:
   - 1.0: Творче, елегантне перефразування з новою структурою.
   - 0.5-0.8: Прийнятне перефразування, замінені ключові слова.
   - 0.0-0.4: Мінімальна зміна або просто видалене/додане слово.

5. **style01** (0-1) — Природність та стиль.

**ФОРМУЛА:** overall.score01 = avg(meaning01, compliance01, grammar01, rephrase01, style01)
- pointsForRating = Math.round(score01 * 10)
- xp = Math.round(score01 * 50)
- band: >= 0.9 "excellent", >= 0.7 "good", >= 0.5 "acceptable", >= 0.3 "weak", < 0.3 "poor"

**FEEDBACK:**
- quickFeedbackUk: УКРАЇНСЬКОЮ, конкретний фідбек на КОЖЕН item.
- issues: список конкретних проблем (forbidden word usage, grammar errors).
- reference: 1-2 зразкових перефразування ПОЛЬСЬКОЮ.
- improvedUserVersionPl: мінімально виправлена версія відповіді користувача ПОЛЬСЬКОЮ.
- suggestedVocab: 2-4 слова (meaningUk та reasonUk УКРАЇНСЬКОЮ).`
      },
      { role: "user", content: `Request:\n${userInput}\nContext:\n${context}` }
    ];
  }
  if (mode === "workbook_sentence_prompt") {
    return [
      {
        role: "system",
        content:
          `You are a creative Polish language tutor creating writing prompts.

**RETURN STRICT JSON:** {"title": string|null, "prompt": string}

**ЗАДАЧА:** Створи мотивуючий промпт для написання 2-3 речень польською.

**ВИМОГИ ДО ПРОМПТУ:**
- prompt: УКРАЇНСЬКОЮ, 2-4 речення.
- Створи КОНКРЕТНИЙ сценарій (не загальний "напишіть про...").
- Вбудуй лексику з контексту природно в опис ситуації.
- Додай емоційний гачок або цікаву деталь.
- Вкажи мінімальну вимогу (2-3 речення).

**ПРИКЛАДИ:**
- НЕ: "Напишіть речення про покупки."
- ТАК: "Уявіть, що ви на варшавському базарі Hala Mirowska. Що ви бачите навколо? Які запахи відчуваєте? Напишіть 2-3 речення польською, використовуючи слова з вашого списку."
- ТАК: "Ви пишете листівку другу з Кракова. Розкажіть що вас найбільше вразило за сьогодні. 2-3 речення польською."

**title:** Короткий заголовок УКРАЇНСЬКОЮ або null.`
      },
      {
        role: "user",
        content: `Topic or theme: ${userInput}\nAdditional context: ${context}`
      }
    ];
  }
  if (mode === "workbook_dialogue_prompt") {
    return [
      {
        role: "system",
        content:
          `You are a creative Polish language tutor creating dialogue prompts.

**RETURN STRICT JSON:** {"title": string|null, "prompt": string}

**ЗАДАЧА:** Створи промпт для 4-рядкового міні-діалогу польською.

**ВИМОГИ ДО ПРОМПТУ:**
- prompt: УКРАЇНСЬКОЮ, 2-3 речення.
- Встанови КОНКРЕТНУ ситуацію з чіткими ролями.
- Вкажи хто говорить з ким і де.
- Додай комунікативну мету (що треба з'ясувати/домовитися/вирішити).
- Вбудуй лексику з контексту.

**ПРИКЛАДИ:**
- НЕ: "Створіть діалог про їжу."
- ТАК: "Ви в кав'ярні 'Café Mleczna' у Гданську. Офіціант запитує ваше замовлення, але ви не впевнені що обрати. Запитайте про рекомендації та зробіть замовлення. 4 репліки польською."
- ТАК: "Ви загубилися біля Вавельського замку. Запитайте перехожого як дістатися до залізничного вокзалу. 4 репліки польською."

**title:** Короткий заголовок УКРАЇНСЬКОЮ або null.`
      },
      {
        role: "user",
        content: `Topic or situation: ${userInput}\nAdditional context: ${context}`
      }
    ];
  }
  if (mode === "workbook_describe_prompt") {
    return [
      {
        role: "system",
        content:
          `You are a creative Polish language tutor creating description prompts.

**RETURN STRICT JSON:** {"title": string|null, "prompt": string}

**ЗАДАЧА:** Створи промпт для опису сцени/зображення польською.

**ВИМОГИ ДО ПРОМПТУ:**
- prompt: УКРАЇНСЬКОЮ, 2-3 речення.
- Створи ВІЗУАЛЬНО ЯСКРАВИЙ сценарій (студент має уявити картину).
- Запропонуй конкретні деталі для опису (об'єкти, кольори, дії, атмосфера).
- Вбудуй лексику з контексту.
- Вкажи очікуваний обсяг (3-5 речень).

**ПРИКЛАДИ:**
- НЕ: "Опишіть природу."
- ТАК: "Уявіть осінній парк: жовте листя на деріжках, дитина грається з собакою, старший чоловік сидить на лавці з газетою. Опишіть цю сцену польською (3-5 речень). Що бачите? Які кольори? Що відбувається?"
- ТАК: "Ви стоїте на ринку (Rynek) старого міста вранці. Опишіть що бачите навколо: будівлі, людей, погоду. 3-5 речень польською."

**title:** Короткий заголовок УКРАЇНСЬКОЮ або null.`
      },
      {
        role: "user",
        content: `Topic or theme: ${userInput}\nAdditional context: ${context}`
      }
    ];
  }
  if (mode === "dialogue_check") {
    // Parse input to get dialogue details
    let parsed: any = {};
    try {
      parsed = JSON.parse(userInput);
    } catch (e) {
      parsed = { situation: "", level: "A2", turns: [] };
    }

    const situation = parsed.situation || "conversation";
    const level = parsed.level || "A2";
    const turns = parsed.turns || [];

    // Extract only user turns for evaluation
    const userTurns = turns
      .filter((turn: any) => turn.speaker === "user")
      .map((turn: any, idx: number) => `[Репліка ${idx + 1}]: ${turn.text}`)
      .join("\n");

    // Full conversation for context
    const fullConversation = turns
      .map((turn: any) => `${turn.speaker === "ai" ? "AI" : "Користувач"}: ${turn.text}`)
      .join("\n");

    return [
      {
        role: "system",
        content: `You are a Polish language tutor evaluating a student's performance in an AI dialogue practice.

DIALOGUE SITUATION: ${situation}
LEVEL: ${level}

FULL CONVERSATION:
${fullConversation}

USER'S TURNS TO EVALUATE:
${userTurns}

Your task: Provide detailed feedback on the USER's turns ONLY (not AI's turns).

EVALUATION CRITERIA:
1. **Naturalness** (0-1 scale): How natural and conversational are the responses? Do they fit the situation?
2. **Grammar** (0-1 scale): Grammatical correctness, proper word forms, sentence structure
3. **Vocabulary**: Appropriate word choice, spelling
4. **Context appropriateness**: Do responses make sense in the conversation flow?

IMPORTANT EVALUATION RULES:
- If user writes in Ukrainian/English instead of Polish → BIG penalty to naturalness (max 0.3) and grammar (0.2)
- Minor grammar mistakes → naturalness 0.7-0.8, grammar 0.6-0.8 (still conversational)
- Good attempts with small errors → naturalness 0.8-0.9, grammar 0.7-0.9
- Perfect or near-perfect → naturalness 0.9-1.0, grammar 0.9-1.0
- score01 = (naturalness + grammar) / 2 (0-1 scale)

RETURN STRICT JSON ONLY:
{
  "overall": {
    "score01": number (0-1, calculated as (naturalness + grammar) / 2),
    "band": string ("excellent" | "good" | "fair" | "poor"),
    "pointsForRating": number (Math.round(score01 * 10), 0-10)
  },
  "overallFeedback": string (загальна оцінка українською, 2-3 речення),
  "naturalness": number (0-1),
  "naturalnessNote": string (коментар українською),
  "grammar": number (0-1),
  "grammarNote": string (коментар українською),
  "turns": [
    {
      "userText": string (репліка користувача),
      "feedback": string (фідбек українською),
      "corrections": string[] (що виправити),
      "improved": string (покращена версія польською, якщо потрібні виправлення)
    }
  ],
  "suggestedPhrases": [
    {
      "pl": string (корисна фраза польською),
      "uk": string (переклад українською),
      "usage": string (пояснення використання українською)
    }
  ]
}

CRITICAL REQUIREMENTS:
- ALL text feedback must be in UKRAINIAN (except Polish text in improved/suggestedPhrases.pl)
- Be constructive and encouraging, but honest about mistakes
- If user mixed languages, explicitly mention it in corrections
- Suggest 3-5 useful phrases from the dialogue context
- For good performance, be generous with scores (don't give 0% unless it's really terrible)`
      },
      {
        role: "user",
        content: `Evaluate this dialogue practice for situation "${situation}" at ${level} level. The user had ${turns.filter((t: any) => t.speaker === "user").length} turns.`
      }
    ];
  }
  if (mode === "sentences_generate") {
    // Parse input to get topic, level, count
    let parsed: any = {};
    try {
      parsed = JSON.parse(userInput);
    } catch (e) {
      parsed = { topic: "general", level: "A2", count: 5 };
    }

    const topic = parsed.topic || "general";
    const level = parsed.level || "A2";
    const count = parsed.count || 5;

    const difficultyPrompt = generateDifficultyAwarePrompt({
      level: level as any,
      exerciseType: "sentences",
      topic,
      count,
      additionalConstraints: `
**ФОРМАТ ВІДПОВІДІ (JSON):**
{"words":[{"pl":string,"uk":string,"type":string}]}

**ЗАДАЧА:** Згенеруй ${count} польських слів для вправи "напиши речення з цим словом".

**КРИТЕРІЇ ВИБОРУ СЛІВ:**
1. Mix частин мови: включи іменники, дієслова, прикметники (мінімум 2 категорії).
2. Уникай слів-когнатів, очевидних для українців (наприклад: "telefon", "muzyka", "problem").
3. Частотний діапазон: слова мають бути корисними та вживаними для рівня ${level}.
4. Тематична зв'язність: всі слова пов'язані з темою "${topic}".
5. Різноманітність: слова НЕ мають бути синонімами один одного.
6. Практичність: студент має зуміти побудувати цікаве речення з кожним словом.

**КРИТИЧНО:**
- 'pl' — слово ПОЛЬСЬКОЮ (лема/базова форма).
- 'uk' — переклад УКРАЇНСЬКОЮ.
- 'type' — частина мови англійською ("noun", "verb", "adjective", "adverb", "preposition").
      `
    });

    return [
      { role: "system", content: difficultyPrompt },
      { role: "user", content: `Generate ${count} words for topic: ${topic}, level: ${level}` }
    ];
  }
  if (mode === "sentences_check") {
    return [
      {
        role: "system",
        content:
          `You are an expert Polish language tutor evaluating student-written sentences.

**RETURN STRICT JSON ONLY:**
{"overall":{"score01":number,"band":string,"pointsForRating":number,"xp":number},"items":[{"wordId":string,"word":string,"sentences":[{"text":string,"score01":number,"verdict":"ok"|"weak"|"bad","feedback":string,"corrections":string[],"improved":string}]}],"suggestedVocab":[{"lemma":string,"meaning":string,"reason":string}]}

**КРИТЕРІЇ ОЦІНЮВАННЯ КОЖНОГО РЕЧЕННЯ:**

1. **Correctness** (граматична правильність):
   - Відмінки, рід, число, час дієслова, порядок слів.
   - Орфографія та діакритики (ą, ę, ó, ś, ź, ż, ć, ń, ł).

2. **Word usage** (правильне вживання цільового слова):
   - Слово вжито у правильному контексті та значенні.
   - Слово відмінене/проспрягане правильно.
   - Не просто вставлене, а інтегроване у речення.

3. **Meaning** (зміст та осмисленість):
   - Речення має сенс, логічне.
   - Не є дослівним перекладом з іншої мови.

4. **Creativity** (творчість):
   - Речення не шаблонне ("To jest..." для всіх слів).
   - Демонструє розуміння слова в різних контекстах.

**SCORING PER SENTENCE:**
- 0.9-1.0 "ok": Правильне, природне, творче вживання слова.
- 0.6-0.8 "ok": Правильне з незначними помилками.
- 0.4-0.59 "weak": Зрозуміле, але з помилками або неприродне.
- 0.0-0.39 "bad": Серйозні помилки, слово вжито неправильно, або не польською.

**OVERALL:**
- score01 = середнє всіх sentence scores.
- pointsForRating = Math.round(score01 * 10) (0-10).
- xp = Math.round(score01 * 50) (0-50).
- band: >= 0.9 "excellent", >= 0.7 "good", >= 0.5 "acceptable", >= 0.3 "weak", < 0.3 "poor".

**FEEDBACK RULES:**
- feedback: УКРАЇНСЬКОЮ, конкретний фідбек. НЕ "покращте граматику", А "після прийменника 'w' потрібен місцевий відмінок: 'w sklepie', не 'w sklep'".
- corrections: список конкретних виправлень.
- improved: виправлене речення ПОЛЬСЬКОЮ (якщо потрібно, інакше = оригінал).
- suggestedVocab: 2-4 слова (meaning та reason УКРАЇНСЬКОЮ).`
      },
      {
        role: "user",
        content: `Request:\n${userInput}\nContext:\n${context}`
      }
    ];
  }
  if (mode === "cloze_generate") {
    // Parse input to get level
    let parsed: any = {};
    try {
      parsed = JSON.parse(userInput);
    } catch (e) {
      parsed = {};
    }
    const level = parsed.level || "A2";
    const topic = parsed.topic || "general";

    const difficultyPrompt = generateDifficultyAwarePrompt({
      level: level as any,
      exerciseType: "cloze",
      topic,
      additionalConstraints: `
**ФОРМАТ ВІДПОВІДІ (JSON):**
{"task":{"id":string,"title":string,"level":string,"topic":string,"items":[{"id":string,"text":string,"gaps":[{"answers":string[],"hint":string,"hintType":"word"|"translation"|"context"}]}]}}

**ЗАДАЧА:** Створи 5-8 польських речень з пропусками (gaps) на тему "${topic}".

**ПРАВИЛА РОЗМІЩЕННЯ GAPS:**
- Використовуй ___ для позначення gap.
- Кожен gap тестує ОДНЕ граматичне/лексичне поняття.
- ${level.startsWith("A")
  ? "A-рівень: базові форми (теперішній/минулий час, прості відмінки Nom/Acc/Gen, базові прийменники)."
  : "B-рівень: складніші форми (умовний спосіб, підрядні конструкції, рідкісні відмінки, aspectual pairs)."}
- ${level.startsWith("A") ? "1 gap на речення." : "До 2 gaps на речення."}

**ВИМОГИ ДО HINTS (підказок):**
- hintType="word": базова форма слова (інфінітив для дієслів, називний для іменників). Наприклад: "(kupić)" для gap де очікується "kupiłem".
- hintType="translation": ТОЧНИЙ український переклад очікуваної відповіді. Наприклад: "(купив)" для "kupiłem".
- hintType="context": контекстна підказка українською, що наводить на правильну форму. Наприклад: "(дія в минулому, чоловік)".
- Чергуй hintType між реченнями для різноманітності.

**ВИМОГИ ДО ANSWERS:**
- Включи ВСІ допустимі варіанти: з діакритиками та без (ą/a, ę/e, ó/o, ł/l, ś/s, ź/z, ż/z, ć/c, ń/n).
- Включи варіанти регістру (kupiłem, Kupiłem).
- Включи граматичні синоніми якщо допустимо.

**ЯКІСТЬ РЕЧЕНЬ:**
- ALL sentences MUST be in POLISH.
- Речення тематично зв'язані, але НЕ повторюються за структурою.
- Контекст речення має допомагати вгадати правильну форму.
- Use vocabPool if provided.
- Title in Ukrainian (uiLanguage).
      `
    });

    return [
      { role: "system", content: difficultyPrompt },
      { role: "user", content: `Request:\n${userInput}\nContext:\n${context}` }
    ];
  }
  if (mode === "cloze_check") {
    return [
      {
        role: "system",
        content:
          `You are an expert Polish language tutor evaluating cloze (fill-in-the-gap) answers.

**RETURN STRICT JSON ONLY:**
{"overall":{"score01":number,"band":string,"pointsForRating":number,"xp":number},"items":[{"id":string,"gaps":[{"verdict":"ok"|"weak"|"bad","feedback":string,"correctAnswers":string[]}]}],"suggestedVocab":[{"lemma":string,"meaning":string,"reason":string}]}

**ПРАВИЛА ПРИЙНЯТТЯ ВІДПОВІДЕЙ:**

1. **Case-insensitive:** "Kupiłem" = "kupiłem" → verdict "ok".

2. **Діакритики:** Прийняти без діакритик з verdict "weak" та попередженням:
   - ą→a, ę→e, ó→o, ś→s, ź→z, ż→z, ć→c, ń→n, ł→l.
   - "kupil" замість "kupił" → verdict "weak", feedback: "Правильна основа, але пропущено діакритику: 'kupił'."
   - "kupilem" замість "kupiłem" → verdict "weak", не "bad".

3. **Альтернативні граматичні форми:**
   - Якщо обидва аспекти (dokonany/niedokonany) допустимі в контексті → обидва "ok".
   - Якщо різні форми однієї парадигми підходять → прийняти з поясненням.
   - Приклад: gap очікує "poszedł" → "szedł" може бути "weak" з поясненням різниці аспектів.

4. **Partial credit система:**
   - "ok" = 1.0: Точна або повністю прийнятна відповідь.
   - "weak" = 0.5: Відповідь розпізнана, є помилки (діакритики, minor form error).
   - "bad" = 0.0: Неправильне слово, неправильна форма, або пусто.

**ФОРМУЛА:**
- overall.score01 = (sum of all gap scores) / (total gaps). Gap score: ok=1.0, weak=0.5, bad=0.0.
- pointsForRating = Math.round(score01 * 10) (0-10).
- xp = Math.round(score01 * 50) (0-50).
- band: >= 0.9 "excellent", >= 0.7 "good", >= 0.5 "acceptable", >= 0.3 "weak", < 0.3 "poor".

**FEEDBACK:**
- feedback: УКРАЇНСЬКОЮ, конкретний для кожного gap.
- correctAnswers: ВСІ допустимі відповіді для gap.
- НЕ "Неправильно", А "Очікувалося 'kupiłem' (минулий час, чоловічий рід). Ви написали 'kupił' — це форма 3-ї особи, а контекст вказує на 1-у особу."
- suggestedVocab: 2-4 слова (meaning та reason УКРАЇНСЬКОЮ).`
      },
      {
        role: "user",
        content: `Request:\n${userInput}\nContext:\n${context}`
      }
    ];
  }
  if (mode === "match_generate") {
    // Parse input to get level
    let parsed: any = {};
    try {
      parsed = JSON.parse(userInput);
    } catch (e) {
      parsed = {};
    }
    const level = parsed.level || "A2";
    const topic = parsed.topic || "general";

    const difficultyPrompt = generateDifficultyAwarePrompt({
      level: level as any,
      exerciseType: "match",
      topic,
      additionalConstraints: `
**ФОРМАТ ВІДПОВІДІ (JSON):**
{"task":{"id":string,"title":string,"level":string,"topic":string,"pairType":"translation"|"semantic"|"definition","pairs":[{"left":string,"right":string}]}}

**ЗАДАЧА:** Згенеруй 8-12 пар для вправи "з'єднай пари".

**ПРАВИЛА ПО pairType:**

pairType="translation" (Polish↔Ukrainian):
- Лівий елемент: польське слово/фраза. Правий: український переклад.
- Використовуй ОДНОЗНАЧНІ переклади (не "zamek" що може бути "замок" або "блискавка").
- Якщо слово багатозначне — додай контекст у дужках: "zamek (budynek)".

pairType="semantic" (зв'язки між польськими словами):
- Чіткі смислові відношення: антоніми (duży↔mały), тематичні пари (lekarz↔szpital).
- БЕЗ неоднозначних зв'язків де можна сплутати пари.

pairType="definition" (Polish word → Ukrainian definition):
- Стислі визначення: 3-8 слів.
- Визначення мають бути зрозумілі для рівня ${level}.
- Визначення РІЗНІ за структурою (не всі починаються з "це...").

**ЗАГАЛЬНІ ПРАВИЛА:**
- БЕЗ дублікатів та близьких синонімів серед left або right елементів.
- Mix складності: ~40% easy (базова лексика), ~40% medium (рівень ${level}), ~20% hard.
- Кожна пара ОДНОЗНАЧНА: один left → тільки один right.
- Use vocabPool if provided. Title in Ukrainian (uiLanguage).
      `
    });

    return [
      { role: "system", content: difficultyPrompt },
      { role: "user", content: `Request:\n${userInput}\nContext:\n${context}` }
    ];
  }
  if (mode === "story_generate") {
    // Parse input to get level and topic
    let parsed: any = {};
    try {
      parsed = JSON.parse(userInput);
    } catch (e) {
      parsed = { level: "A2", topic: userInput };
    }

    const level = parsed.level || "A2";
    const topic = parsed.topic || "adventure";

    // Get difficulty spec for story
    const spec = getDifficultySpec(level as any);

    const storyPrompt = `You are a Polish language tutor and creative writing coach.

**CRITICAL: The "text" field MUST contain a story in POLISH, regardless of the language used in the topic/request.**

**РІВЕНЬ: ${level} - ${spec.name}**

${generateDifficultyAwarePrompt({
  level: level as any,
  exerciseType: "sentences", // Story is like extended sentences
  topic,
  additionalConstraints: `
**ФОРМАТ ВІДПОВІДІ (JSON):**
{
  "prompt": string (Ukrainian),
  "text": string (Polish example story - ЗАВЖДИ ПОЛЬСЬКОЮ!)
}

**ЗАВДАННЯ:**
1. Створи writing prompt (українською), який направляє студента написати коротку історію польською
2. Створи example story (ПОЛЬСЬКОЮ), яка демонструє хороше письмо для рівня ${level}

**ВИМОГИ ДО EXAMPLE STORY:**
- Текст історії ОБОВ'ЯЗКОВО польською мовою, навіть якщо topic українською
- Довжина: ${spec.format.reading?.totalWords.min || 100}-${spec.format.reading?.totalWords.max || 200} слів
- Всі речення мають відповідати обмеженням рівня ${level}
- Історія має бути ЦІКАВОЮ та ЗАЛУЧАЮЧОЮ
- Prompt має бути КОНКРЕТНИМ та МОТИВУЮЧИМ
  `
})}`;

    return [
      { role: "system", content: storyPrompt },
      { role: "user", content: `Topic: ${topic}\nLevel: ${level}` }
    ];
  }
  if (mode === "story_check") {
    return [
      {
        role: "system",
        content:
          `You are an expert Polish language tutor and creative writing coach evaluating a student's story.

**RETURN STRICT JSON ONLY:**
{"feedback":{"score":number,"overall":string,"suggestions":string[],"vocabulary":[{"pl":string,"uk":string}]}}

**5 ВИМІРІВ ОЦІНЮВАННЯ (score = weighted average):**

1. **Grammar** (вага 30%):
   - Правильність відмінків, часів, узгодження роду та числа.
   - Порядок слів, прийменникові конструкції.
   - Орфографія та діакритики.

2. **Vocabulary** (вага 20%):
   - Різноманітність лексики (не повторює одні й ті ж слова).
   - Доречність для теми та рівня.
   - Використання конекторів (potem, dlatego, jednak, więc).

3. **Coherence** (вага 20%):
   - Логічна структура: вступ → розвиток → кінцівка.
   - Зв'язність між реченнями та абзацами.
   - Часова послідовність подій.

4. **Creativity** (вага 15%):
   - Оригінальність сюжету.
   - Деталі, описи, діалоги.
   - Емоційна залученість читача.

5. **Level match** (вага 15%):
   - Складність відповідає заявленому рівню.
   - Не надто проста і не надто складна.
   - Природність для рівня (A: прості речення OK, B: очікується більша різноманітність).

**SCORING:** score = grammar*0.3 + vocabulary*0.2 + coherence*0.2 + creativity*0.15 + levelMatch*0.15
- Score is 0.0-1.0 (0.7+ is good).

**FEEDBACK RULES:**
- overall: УКРАЇНСЬКОЮ, 2-3 речення. Конкретний та конструктивний.
- suggestions: 2-4 КОНКРЕТНІ поради УКРАЇНСЬКОЮ:
  - НЕ "покращте граматику" або "використовуйте більше слів".
  - ТАК: "Додайте короткий діалог між персонажами, наприклад: 'Dokąd idziemy?' — zapytała Maria."
  - ТАК: "Замість повторення 'potem... potem...' використайте конектори: 'następnie', 'w końcu', 'po chwili'."
  - ТАК: "В реченні 'Ona poszedł do sklepu' має бути 'poszła' (жіночий рід)."
- vocabulary: 3-5 нових польських слів з українським перекладом, що ЗБАГАТИЛИ б цю конкретну історію.`
      },
      {
        role: "user",
        content: `Request:\n${userInput}\nContext:\n${context}`
      }
    ];
  }
  if (mode === "story_hints") {
    return [
      {
        role: "system",
        content:
          `You are a Polish language creative writing coach helping a student continue their story.

**RETURN STRICT JSON ONLY:**
{"hints":string[]}

**ЗАДАЧА:** Прочитай поточний текст студента та prompt, дай 3-4 підказки УКРАЇНСЬКОЮ.

**ТИПИ ПІДКАЗОК (чергуй між ними):**

1. **Plot (сюжет):** Що може статися далі? Конкретний поворот або подія.
   - ТАК: "Що, якщо головний герой зустріне когось несподіваного в парку?"
   - НІ: "Продовжуйте писати." (надто загально)

2. **Language (мовні засоби):** Корисні польські фрази для продовження.
   - ТАК: "Спробуйте використати 'nagle' (раптом) або 'w tym momencie' (в цей момент) для створення напруги."
   - Давай конкретні польські фрази з перекладом.

3. **Structure (структура):** Організація тексту.
   - ТАК: "Додайте короткий діалог — це зробить розповідь живішою. Наприклад: '— Przepraszam, czy...'"
   - ТАК: "Опишіть обстановку: що бачить/чує/відчуває герой?"

**ПРАВИЛА:**
- Підказки мають ВРАХОВУВАТИ вже написаний текст (не повторювати те, що вже є).
- Кожна підказка — 1-2 речення, конкретна та actionable.
- Мінімум 1 підказка з конкретними польськими фразами.
- Всі підказки УКРАЇНСЬКОЮ (польські фрази в лапках).`
      },
      {
        role: "user",
        content: `Request:\n${userInput}\nContext:\n${context}`
      }
    ];
  }
  if (mode === "describe_check") {
    // Parse payload to check if image URL is provided
    let parsedInput: any = {};
    try {
      parsedInput = JSON.parse(userInput);
    } catch (e) {
      // Fallback if parsing fails
    }

    const hasImageUrl = parsedInput?.image?.url;

    // If image URL provided, use vision-capable model with image content
    if (hasImageUrl) {
      return [
        {
          role: "system",
          content:
            `You are an expert Polish language tutor with image analysis capabilities.

TASK: Evaluate a student's Polish description of the provided image.

EVALUATION CRITERIA:
1. **Accuracy** - Does the description match what's actually in the image?
2. **Completeness** - Are important visual elements mentioned?
3. **Grammar** - Polish grammar correctness
4. **Vocabulary** - Appropriate word choice and variety
5. **Style** - Natural, fluent Polish writing

RETURN STRICT JSON ONLY:
{
  "overall": {
    "score01": number (0-1 scale),
    "band": string (A1-C2),
    "pointsForRating": number (0-10 scale, calculate as Math.round(score01 * 10)),
    "xp": number (0-50 range)
  },
  "feedbackUk": string (Ukrainian - detailed feedback on accuracy, grammar, completeness),
  "improvedPl": string (Polish - corrected version with missing details from image),
  "translationUk": string (Ukrainian - translation of improvedPl),
  "suggestedVocab": [
    {
      "lemma": string (Polish base form),
      "meaningUk": string (Ukrainian translation),
      "reasonUk": string (Ukrainian - why this word is useful for describing this image)
    }
  ]
}

IMPORTANT:
- Compare student's description with ACTUAL image content
- Point out missing important details
- Suggest vocabulary for elements visible in the image
- Be constructive and educational
- Feedback must be in Ukrainian`
        },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: parsedInput.image.url,
                detail: "low"
              }
            },
            {
              type: "text",
              text: `Task prompt: ${parsedInput.prompt || "Describe the image in Polish"}

Student's description (Polish):
${parsedInput.description || ""}

Level: ${parsedInput.level || "A2"}

Please evaluate this description by analyzing the image and comparing it with the student's text.`
            }
          ]
        }
      ];
    }

    // Fallback: text-only evaluation (if no image URL)
    return [
      {
        role: "system",
        content:
          `You are an expert Polish language tutor evaluating a student's descriptive writing.

**RETURN STRICT JSON ONLY:**
{"overall":{"score01":number,"band":string,"pointsForRating":number,"xp":number},"feedbackUk":string,"improvedPl":string,"translationUk":string,"suggestedVocab":[{"lemma":string,"meaningUk":string,"reasonUk":string}]}

**5 КРИТЕРІЇВ ОЦІНЮВАННЯ:**

1. **Grammar** (вага 25%) — Граматична правильність:
   - Відмінки, рід, число, час, узгодження.
   - Орфографія та діакритики.

2. **Vocabulary** (вага 20%) — Лексична різноманітність:
   - Різноманітність прикметників, дієслів, іменників.
   - Уникнення повторів (nie "jest... jest... jest...").
   - Доречні описові слова.

3. **Detail** (вага 20%) — Рівень деталізації:
   - Опис конкретний, з деталями (кольори, розміри, дії, емоції).
   - Не надто загальний ("To jest ładne miejsce").

4. **Structure** (вага 20%) — Структура тексту:
   - Логічна організація (загальне → деталі, або просторова: зліва → справа).
   - Зв'язність між реченнями.

5. **Naturalness** (вага 15%) — Природність мови:
   - Звучить як природна польська, не дослівний переклад.
   - Відповідний стиль для типу опису.

**SCORING:**
- score01 = weighted average (0-1 scale).
- pointsForRating = Math.round(score01 * 10) (0-10).
- xp = Math.round(score01 * 50) (0-50).
- band: >= 0.9 "excellent", >= 0.7 "good", >= 0.5 "acceptable", >= 0.3 "weak", < 0.3 "poor".

**FEEDBACK:**
- feedbackUk: УКРАЇНСЬКОЮ, 2-3 речення. Конкретний: що добре і що покращити.
- improvedPl: Виправлена + покращена версія ПОЛЬСЬКОЮ.
- translationUk: Переклад improvedPl УКРАЇНСЬКОЮ.
- suggestedVocab: 3-5 корисних слів (meaningUk та reasonUk УКРАЇНСЬКОЮ).`
      },
      {
        role: "user",
        content: `Request:\n${userInput}\nContext:\n${context}`
      }
    ];
  }
  if (mode === "reading_text_generate") {
    // Parse input to get level and topic
    let parsed: any = {};
    try {
      parsed = JSON.parse(userInput);
    } catch (e) {
      parsed = { topic: userInput, level: "A2" };
    }

    const level = parsed.level || "A2";
    const topic = parsed.topic || userInput;

    // Generate difficulty-aware prompt
    const difficultyPrompt = generateDifficultyAwarePrompt({
      level: level as any,
      exerciseType: "reading",
      topic,
      additionalConstraints: `
**ФОРМАТ ВІДПОВІДІ (JSON):**
{
  "title": {"pl": string, "uk": string},
  "text": {"pl": string, "uk": string},
  "topic": string,
  "level": string
}

**ДОДАТКОВІ ВИМОГИ:**
- text.pl: польський текст, розділений на абзаци (\\n\\n між абзацами)
- text.uk: український переклад, в ТОМУ Ж ПОРЯДКУ абзаців
- Кожен абзац pl має відповідати абзацу uk (для паралельного читання)
- Заголовок природний та привабливий в обох мовах
- Текст має бути ЦІКАВИМ та НАВЧАЛЬНИМ
      `
    });

    return [
      { role: "system", content: difficultyPrompt },
      { role: "user", content: `Topic: ${topic}\nLevel: ${level}` }
    ];
  }
  if (mode === "reading_questions_generate") {
    return [
      {
        role: "system",
        content:
          `You are a Polish language tutor. Return STRICT JSON ONLY, no markdown, no code blocks, just pure JSON.

Schema:
{
  "questions": [
    {
      "type": "multiple"|"truefalse"|"open"|"short",
      "question": {"pl": string, "uk": string},
      "correctAnswer": boolean (only for truefalse),
      "options": [{"pl": string, "uk": string}] (only for multiple, exactly 4 options),
      "correctOptionIndex": number (only for multiple, 0-3)
    }
  ]
}

Generate 8-10 questions with varied types:
- 4-5 multiple choice (4 options each)
- 2-3 true/false
- 2-3 open-ended OR short answer

Example output:
{"questions":[{"type":"multiple","question":{"pl":"Gdzie odbywa się akcja?","uk":"Де відбувається дія?"},"options":[{"pl":"W sklepie","uk":"В магазині"},{"pl":"W domu","uk":"Вдома"},{"pl":"Na ulicy","uk":"На вулиці"},{"pl":"W szkole","uk":"У школі"}],"correctOptionIndex":0},{"type":"truefalse","question":{"pl":"Maria kupuje warzywa?","uk":"Марія купує овочі?"},"correctAnswer":true}]}

IMPORTANT: Return ONLY valid JSON, no explanations, no markdown formatting.`
      },
      {
        role: "user",
        content: `Text: ${userInput}\nLevel: ${context}`
      }
    ];
  }
  if (mode === "reading_comprehension_check") {
    return [
      {
        role: "system",
        content:
          `You are an expert Polish language tutor evaluating reading comprehension answers.

**RETURN STRICT JSON ONLY:**
{"overall":{"score01":number,"pointsForRating":number,"feedback":string},"items":[{"questionIndex":number,"correct":boolean,"userAnswer":string,"expectedAnswer":string,"feedback":string}],"suggestedVocab":[{"lemma":string,"meaning":string,"reason":string}]}

**ПРАВИЛА ОЦІНЮВАННЯ ПО ТИПУ ПИТАННЯ:**

**Multiple choice:**
- Binary: правильно (1.0) або неправильно (0.0).
- Порівнюй вибрану опцію з correctOptionIndex.
- feedback: поясни ЧОМУ правильна відповідь вірна, з посиланням на текст.

**True/false:**
- Binary: правильно (1.0) або неправильно (0.0).
- feedback: вкажи конкретне місце в тексті, що підтверджує правильну відповідь.
- Приклад: "У тексті сказано: 'Maria kupiła trzy jabłka', тому відповідь TRUE."

**Open-ended:**
- Partial credit (0.0 - 1.0):
  - 1.0: Відповідь повна, точна, підкріплена текстом.
  - 0.5-0.8: Відповідь частково правильна або неповна.
  - 0.0-0.4: Відповідь неправильна або не стосується питання.
- ПРИЙНЯТИ відповіді ПОЛЬСЬКОЮ та УКРАЇНСЬКОЮ.
- ПРИЙНЯТИ синоніми та перефразування якщо зміст правильний.

**Short answer:**
- Partial credit (0.0 - 1.0).
- ПРИЙНЯТИ синоніми (слово з того ж семантичного поля).
- ПРИЙНЯТИ різні граматичні форми того ж слова.
- Case-insensitive порівняння.

**SCORING:**
- score01 = average of all item scores (0-1 scale).
- pointsForRating = Math.round(score01 * 10) (0-10).

**FEEDBACK:**
- feedback: УКРАЇНСЬКОЮ, конкретний для кожного питання.
- overall.feedback: УКРАЇНСЬКОЮ, загальний висновок (2-3 речення).
- suggestedVocab: 2-4 ключові слова з тексту (meaning та reason УКРАЇНСЬКОЮ).`
      },
      {
        role: "user",
        content: `Request:\n${userInput}\nContext:\n${context}`
      }
    ];
  }
  if (mode === "reading_explain") {
    return [
      {
        role: "system",
        content:
          `You are an expert Polish language tutor explaining text fragments to learners.

**RETURN STRICT JSON ONLY:**
{"explanation":string,"breakdown":{"grammar":string,"vocabulary":string,"context":string},"examples":string[]}

**ЗАДАЧА:** Пояснити виділений фрагмент польського тексту. Всі пояснення УКРАЇНСЬКОЮ.

**ЯКІСТЬ ПОЯСНЕНЬ:**

**breakdown.grammar** — Конкретний граматичний розбір:
- Вкажи ЧАС дієслова (czas teraźniejszy, przeszły, przyszły).
- Вкажи ВІДМІНОК іменників/прикметників (Mianownik, Dopełniacz, Celownik, Biernik, Narzędnik, Miejscownik, Wołacz).
- Вкажи РІД та ЧИСЛО.
- Поясни ЧОМУ саме ця форма (після якого прийменника/дієслова).
- Приклад: "słowa 'w sklepie' — 'sklep' у місцевому відмінку (Miejscownik), бо після прийменника 'w' (де?) завжди Miejscownik: sklep → sklepie."

**breakdown.vocabulary** — Значення та вживання слів:
- Лема (базова форма) кожного ключового слова.
- Переклад українською.
- Типові словосполучення (collocations).
- Приклад: "'kupować' (купувати) — kupić (доконаний) / kupować (недоконаний). Типові сполучення: kupić bilet, kupić prezent."

**breakdown.context** — Контекстне значення:
- Як цей фрагмент пов'язаний з рештою тексту.
- Чи має слово особливе значення в цьому контексті.

**examples:** 2-3 ПРАКТИЧНІ приклади ПОЛЬСЬКОЮ, що використовують ту ж граматичну конструкцію або лексику. Приклади мають бути прості та зрозумілі для рівня студента.

**КРИТИЧНО:** Всі пояснення (explanation, breakdown) УКРАЇНСЬКОЮ. Приклади (examples) ПОЛЬСЬКОЮ.`
      },
      {
        role: "user",
        content: `Request:\n${userInput}\nContext:\n${context}`
      }
    ];
  }
  if (mode === "reading_glossary_generate") {
    return [
      {
        role: "system",
        content:
          `You are an expert Polish language tutor creating a vocabulary glossary from a reading text.

**RETURN STRICT JSON ONLY:**
{"glossary":[{"pl":string,"uk":string,"difficulty":"easy"|"medium"|"hard","context":string}]}

**ЗАДАЧА:** Проаналізуй польський текст і витягни 10-20 ключових слів для глосарію.

**ПРІОРИТЕТИ ВІДБОРУ СЛІВ (від найвищого до найнижчого):**
1. **Ключові для розуміння тексту:** Слова, без яких студент не зрозуміє основний зміст.
2. **Високочастотні для рівня:** Слова, що студент часто зустрічатиме в інших текстах.
3. **Тематична лексика:** Слова, характерні для теми тексту.
4. **Цікаві мовні явища:** Слова з нерегулярними формами, false friends, корисні idioms.

**ВИКЛЮЧИТИ:**
- Службові слова (i, w, na, z, do, jest — ЯКЩО НЕ частина цікавого вислову).
- Очевидні когнати для українців (telefon, muzyka, problem, komputer).
- Слова, що ідентичні в обох мовах.
- Власні назви (імена, міста — ЯКЩО НЕ мають пояснення).

**ФОРМАТ КОЖНОГО СЛОВА:**
- pl: лема (базова форма) — називний відмінок для іменників, інфінітив для дієслів.
- uk: точний український переклад.
- difficulty: "easy" (нижче рівня), "medium" (рівень студента), "hard" (вище рівня).
- context: ТОЧНЕ речення з тексту, де слово зустрічається. Якщо слово зустрічається кілька разів — обирай найінформативніший контекст.

**БАЛАНС:** ~30% easy, ~50% medium, ~20% hard.`
      },
      {
        role: "user",
        content: `Request:\n${userInput}\nContext:\n${context}`
      }
    ];
  }
  if (mode === "test_generate") {
    // Parse input to extract level and topics
    let parsed: any = {};
    try {
      parsed = JSON.parse(userInput);
    } catch (e) {
      parsed = { level: "A2", topics: [userInput] };
    }

    const level = parsed.level || "A2";
    const topics = parsed.topics || parsed.grammarTopics || [];
    const count = parsed.questionCount || parsed.count || 12;

    // Generate difficulty-aware base prompt
    const difficultyPrompt = generateDifficultyAwarePrompt({
      level: level as any,
      exerciseType: "test",
      count,
      additionalConstraints: `
**КРИТИЧНІ JSON ПРАВИЛА:**
- Return STRICT JSON ONLY, no markdown, no code blocks
- Use straight quotes " not curly quotes
- Escape special characters: \\" \\\\ \\n
- NO line breaks inside JSON strings

**JSON SCHEMA:**
{
  "questions": [
    {
      "id": string ("q1", "q2", ...),
      "type": "single"|"multiple"|"fillgap"|"open",
      "question": {"pl": string, "uk": string},
      "correctAnswer": string|string[],
      "options": [{"id": string, "pl": string, "uk": string}] (4 options for single/multiple),
      "gapSentence": {"pl": string, "uk": string} (for fillgap, use ___),
      "explanation": {"pl": string, "uk": string},
      "testedRule": string
    }
  ]
}

**ТЕСТУВАННЯ ПРАВИЛ (КРИТИЧНО):**
1. ОДНЕ питання = ОДНЕ правило граматики
2. НЕ міксуй декілька правил в одному питанні
3. Дистрактори: правдоподібні але ЯВНО неправильні
4. БЕЗ пасток, двозначностей, суб'єктивності
5. БЕЗ культурних/фактичних знань, тільки мова

**ТИПИ ПИТАНЬ:**

**Single/Multiple Choice:**
- ТОЧНО 4 варіанти
- Всі опції - одна категорія (всі дієслова / всі відмінки)
- Дистрактори = типові помилки учнів

**Fill Gap:**
- КРИТИЧНО: Завжди вказуй підмет для дієслів!
  ✅ "Wczoraj ja (mężczyzna) ___ (kupić)..."
  ✅ "Maria ___ (iść) do szkoły."
  ❌ "Wczoraj ___ (kupić)..." (НЕ ЯСНО хто!)
- Вказуй ВСІ допустимі форми в correctAnswer

**Open:**
- Короткі об'єктивні відповіді (1-3 слова)

${topics.length > 0 ? `\n**ГРАМАТИЧНІ ТЕМИ:**\n${topics.map((t: string) => `- ${t}`).join('\n')}` : ''}
      `
    });

    return [
      { role: "system", content: difficultyPrompt },
      { role: "user", content: `Generate ${count} test questions. ${topics.length > 0 ? `Grammar topics: ${topics.join(', ')}` : ''}` }
    ];
  }
  if (mode === "test_check") {
    return [
      {
        role: "system",
        content:
          `You are an expert Polish language examiner with experience in CEFR-aligned assessment.
Your task is to EVALUATE test answers objectively and provide constructive feedback.

EVALUATION PURPOSE:
- Objective assessment (not subjective judgment)
- Clear, actionable feedback
- Fair scoring with partial credit where appropriate

RETURN STRICT JSON ONLY (no markdown, no explanations outside JSON).

JSON SCHEMA:
{
  "overall": {
    "score01": number (0-1, average correctness),
    "pointsForRating": number (0-10, rounded points for display),
    "feedback": string (Ukrainian, overall performance summary)
  },
  "items": [
    {
      "questionIndex": number,
      "questionId": string,
      "correct": boolean,
      "userAnswer": string (as submitted),
      "expectedAnswer": string (correct answer),
      "feedback": string (Ukrainian, specific feedback),
      "partialCredit": number (0-1, for open/fillgap questions)
    }
  ],
  "suggestedVocab": [
    {
      "lemma": string (Polish base form),
      "meaning": string (Ukrainian translation),
      "reason": string (Ukrainian, why user should learn this)
    }
  ]
}

EVALUATION RULES BY QUESTION TYPE:

Single Choice:
- Correct if user selected the right option ID
- No partial credit
- Binary: 1.0 or 0.0

Multiple Choice:
- Award partial credit proportionally
- If correct answer is ["o1", "o2"] and user selected ["o1", "o3"]:
  partialCredit = (correct selected) / (total correct) = 0.5
- Full credit only if exact match

Fill Gap:
- Accept ALL grammatically correct forms
- Ignore case differences (uppercase/lowercase)
- Accept forms with/without diacritics if phonetically identical
- Examples: "kupiłem" = "Kupiłem" (accept)
            "poszedł" = "poszedl" (accept with warning about orthography)
- Award partial credit if form is recognizable but has minor errors

Open-Ended:
- Evaluate on 3 criteria:
  1. Correctness (does it answer the question?)
  2. Grammar (is it grammatically sound?)
  3. Completeness (does it address all parts?)
- Partial credit: average of 3 criteria
- Be lenient with stylistic variation
- Do NOT penalize for creative variation if correct

FEEDBACK RULES:
- Use Ukrainian for all feedback
- Be constructive and specific
- For correct answers: brief confirmation
- For incorrect: explain WHAT was wrong and WHY
- Avoid vague statements like "це неправильно"
- Good example: "Правильна форма минулого часу для 'я (чоловік)' - 'kupiłem', а не 'kupił'"

VOCABULARY SUGGESTIONS:
- Suggest 2-5 words maximum
- Only suggest words that appeared in questions user got wrong
- Prioritize high-frequency, useful vocabulary
- Explain why each word is important

SCORING CALCULATION:
- score01 = (sum of all partialCredit values) / (total questions)
- pointsForRating = round(score01 * 10)
- Be consistent and objective

Remember: You are an EXAMINER, not a teacher. Evaluate fairly, provide clear feedback, help learner improve.`
      },
      {
        role: "user",
        content: `Request:\n${userInput}\nContext:\n${context}`
      }
    ];
  }
  if (mode === "unsplash_translate") {
    return [
      {
        role: "system",
        content:
          `Extract key visual concepts from the text and translate to English for image search.

INPUT: Ukrainian or Polish text describing a scene, topic, or concept.
OUTPUT: Short English keywords (2-5 words) suitable for Unsplash image search.

RULES:
- Focus on VISUAL elements (objects, people, places, actions)
- Ignore non-visual concepts (feelings, abstract ideas)
- Use common English words
- Keep it short and specific
- Return ONLY the English keywords, nothing else
- No explanations, no JSON, just plain text keywords

EXAMPLES:
Input: "Опишіть сцену в аеропорті: пасажири чекають на рейс"
Output: airport passengers waiting

Input: "Люди працюють в офісі біля комп'ютерів"
Output: office people working computers

Input: "Kawiarnia z ludźmi pijącymi kawę"
Output: cafe people drinking coffee

Input: "Природа, гори, озеро, сонце"
Output: mountains lake nature landscape`
      },
      {
        role: "user",
        content: userInput
      }
    ];
  }

  // Dictionary AI modes
  if (mode === "word_examples") {
    let parsed: any = {};
    try {
      parsed = JSON.parse(userInput);
    } catch (e) {
      parsed = { word: userInput, level: "A2", count: 3 };
    }

    const word = parsed.word || userInput;
    const level = parsed.level || "A2";
    const count = parsed.count || 3;

    return [
      {
        role: "system",
        content: `You are a Polish language tutor creating example sentences.

**RETURN STRICT JSON ONLY:**
{"examples":[{"sentence":string,"translation":string,"difficulty":"easy"|"medium"|"hard"}]}

**ЗАДАЧА:** Створи ${count} прикладів речень зі словом "${word}" для рівня ${level}.

**ВИМОГИ ДО ПРИКЛАДІВ:**
- Речення мають бути ПРИРОДНИМИ (як у реальному житті, не підручникові).
- РІЗНІ контексти вживання (побут, робота, подорожі, емоції тощо).
- Показати РІЗНІ граматичні форми слова (відмінки, часи, число).
- sentence: ПОЛЬСЬКОЮ. translation: УКРАЇНСЬКОЮ.
- difficulty: "easy" (простіше за ${level}), "medium" (рівень ${level}), "hard" (трохи вище).
- Мінімум 1 "easy" і 1 "medium" приклад.`
      },
      {
        role: "user",
        content: `Generate ${count} example sentences for word: "${word}" at ${level} level`
      }
    ];
  }

  if (mode === "word_grammar") {
    let parsed: any = {};
    try {
      parsed = JSON.parse(userInput);
    } catch (e) {
      parsed = { word: userInput, type: "unknown", level: "A2" };
    }

    const word = parsed.word || userInput;
    const wordType = parsed.type || "unknown";
    const level = parsed.level || "A2";

    return [
      {
        role: "system",
        content: `You are a Polish language tutor explaining grammar to Ukrainian-speaking learners.

**RETURN STRICT JSON ONLY:**
{"explanation":{"type":string,"usage":string,"notes":string,"forms":string[],"examples":[{"pl":string,"uk":string}]}}

**ЗАДАЧА:** Поясни граматику та вживання слова "${word}" (${wordType}) для рівня ${level}.

**ВИМОГИ ДО ПОЯСНЕННЯ (все УКРАЇНСЬКОЮ):**
- type: частина мови (іменник, дієслово, прикметник тощо).
- usage: ПРАКТИЧНЕ пояснення — коли і як вживати. Конкретні ситуації.
- notes: рівневий граматичний розбір:
  ${wordType === "noun" || wordType === "unknown" ? "- Для іменників: рід, відміна, нерегулярні форми відмінків.\n  - Типові прийменники, з якими вживається." : ""}
  ${wordType === "verb" || wordType === "unknown" ? "- Для дієслів: аспект (dokonany/niedokonany), відмінювання, керування (який відмінок після дієслова)." : ""}
  ${wordType === "adjective" || wordType === "unknown" ? "- Для прикметників: ступені порівняння, узгодження з іменниками." : ""}
- forms: найважливіші граматичні форми для рівня ${level} (не всі 42, а 5-8 найкорисніших).
- examples: 2-3 ПРИРОДНІ приклади (pl: ПОЛЬСЬКОЮ, uk: УКРАЇНСЬКОЮ).

**РІВНЕВІСТЬ:** Для ${level} — пояснюй ТІЛЬКИ те, що потрібно для цього рівня. Не перевантажуй C1 деталями A2 студента.`
      },
      {
        role: "user",
        content: `Explain grammar for word: "${word}" (${wordType}) at ${level} level`
      }
    ];
  }

  if (mode === "word_recommendations") {
    let parsed: any = {};
    try {
      parsed = JSON.parse(userInput);
    } catch (e) {
      parsed = { learnedWords: [], level: "A2", count: 5 };
    }

    const learnedWords = parsed.learnedWords || [];
    const level = parsed.level || "A2";
    const count = parsed.count || 5;
    const recContext = parsed.context || "";

    return [
      {
        role: "system",
        content: `You are a Polish language tutor recommending vocabulary.

**RETURN STRICT JSON ONLY:**
{"recommendations":[{"word":string,"translation":string,"reason":string,"category":string,"priority":"high"|"medium"|"low"}]}

**ЗАДАЧА:** Рекомендуй ${count} нових польських слів для рівня ${level}.

**КРИТЕРІЇ ВИБОРУ:**
1. **Vocabulary progression:** Слова логічно продовжують вже вивчені (тематично або граматично).
2. **Практичність:** Слова, які студент використовуватиме в реальних ситуаціях.
3. **Частотність:** Високочастотні для рівня ${level}.
4. **Різноманітність:** Mix частин мови (не тільки іменники).
5. **Не когнати:** Уникай слів, очевидних для українців.

**ФОРМАТ:**
- word: ПОЛЬСЬКОЮ (лема/базова форма).
- translation: УКРАЇНСЬКОЮ.
- reason: УКРАЇНСЬКОЮ — ЧОМУ саме це слово (конкретно, не "корисне слово").
- category: тематична категорія (їжа, транспорт, емоції, робота тощо).
- priority: "high" (критично для рівня), "medium" (корисно), "low" (бонус).

**ПРИКЛАДИ REASON:**
- ТАК: "Часто зустрічається в діалогах у магазині, доповнює вже вивчене 'kupić'."
- НІ: "Корисне слово для вивчення." (надто загально)`
      },
      {
        role: "user",
        content: `User level: ${level}. Learned words: ${learnedWords.join(", ")}. Context: ${recContext}. Recommend ${count} new words.`
      }
    ];
  }

  return [
    {
      role: "system",
      content:
        "You are a Polish language tutor. Return STRICT JSON with fields: score (0-100), corrections (array), suggestions (array), rewritten (string)."
    },
    {
      role: "user",
      content: `Context:\n${context}\n\nUser:\n${userInput}`
    }
  ];
}

export async function POST(request: Request) {
  const payload = await request.json().catch(() => ({}));
  const mode = String(payload?.mode || "writing_check");
  const userInput = String(payload?.userInput || "");
  const context = String(payload?.context || "");

  // Check if describe_check with image URL - use vision model
  let needsVision = false;
  if (mode === "describe_check") {
    try {
      const parsed = JSON.parse(userInput);
      needsVision = !!parsed?.image?.url;
    } catch (e) {
      // Ignore parse errors
    }
  }

  const auth = await getAuthUser();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await getDb();
  const user = await db.collection("users").findOne({ _id: new ObjectId(auth.id) });
  const isAdmin = Boolean(user?.role === "admin" || user?.isAdmin);
  const isActive = isSubscriptionActive(user?.subscription, isAdmin);
  const planId = user?.subscription?.planId || DEFAULT_PLAN_ID;
  const plan = getPlanById(planId);

  // IMPORTANT: Адміни НЕ мають лімітів на AI credits
  const creditsLimit = isAdmin ? Infinity : (plan?.aiCreditsMonthly || 0);

  const generateModes = new Set([
    "sentences_generate",
    "cloze_generate",
    "match_generate",
    "translate_generate",
    "mini_dialog_generate",
    "mini_dialog_continue",
    "mini_dialog_roleplay",
    "paraphrase_generate",
    "story_generate",
    "reading_text_generate",
    "reading_questions_generate",
    "word_examples",
    "word_grammar",
    "word_recommendations",
    "test_generate"
  ]);

  const checkModes = new Set([
    "sentences_check",
    "cloze_check",
    "match_check",
    "translate_check",
    "mini_dialog_check",
    "dialogue_check",
    "paraphrase_check",
    "story_check",
    "story_hints",
    "describe_check",
    "reading_comprehension_check",
    "reading_explain",
    "test_check",
    "video_open_check"
  ]);

  if (!isAdmin && generateModes.has(mode) && !plan?.allowAIGenerate) {
    return NextResponse.json({ error: "AI mode not available for plan", code: "ai_mode_locked" }, { status: 402 });
  }
  if (!isAdmin && checkModes.has(mode) && !plan?.allowAICheck) {
    return NextResponse.json({ error: "AI check not available for plan", code: "ai_check_locked" }, { status: 402 });
  }

  // Select optimal AI model
  const model = selectModel({
    mode,
    needsVision,
    userPreference: payload?.model,
    adminOverride: user?.aiModelOverride // Admin can set preferred model
  });

  // Validate model selection
  const validation = validateModelSelection(model, needsVision);
  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const provider = "pvs";

  const pvsKey = process.env.PVS_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
  const usePvs = provider === "pvs";

  let apiKey: string | null = null;
  if (usePvs) {
    if (!pvsKey) {
      return NextResponse.json({ error: "PVS key missing" }, { status: 500 });
    }
    if (!isActive) {
      return NextResponse.json({ error: "PVS not available for plan", code: "pvs_unavailable" }, { status: 402 });
    }
    apiKey = pvsKey;
  } else {
    return NextResponse.json({ error: "No provider available" }, { status: 400 });
  }

  const rateKey = `pvs:${auth.id}`;
  const rate = await checkRateLimit(rateKey, 20, 60_000);
  if (!rate.ok) {
    return NextResponse.json({ error: "Rate limit" }, { status: 429 });
  }

  const monthKey = new Date().toISOString().slice(0, 7);
  const usedCredits =
    user?.aiUsage?.month === monthKey ? Number(user?.aiUsage?.usedCredits || 0) : 0;
  const creditsCost = mode.includes("prompt") || mode.includes("generate") || mode.includes("check") ? 2 : 1;

  // Check credits limit (skip for admins - they have Infinity)
  if (usedCredits + creditsCost > creditsLimit) {
    return NextResponse.json({ error: "AI quota exceeded", code: "ai_quota" }, { status: 402 });
  }

  const modeLimits: Record<string, { limit: number; windowMs: number }> = {
    reading_text_generate: { limit: 2, windowMs: 60_000 },
    test_generate: { limit: 3, windowMs: 60_000 },
    story_generate: { limit: 3, windowMs: 60_000 },
    reading_questions_generate: { limit: 4, windowMs: 60_000 },
    sentences_generate: { limit: 6, windowMs: 60_000 },
    cloze_generate: { limit: 6, windowMs: 60_000 },
    match_generate: { limit: 6, windowMs: 60_000 },
    paraphrase_generate: { limit: 6, windowMs: 60_000 },
    translate_generate: { limit: 8, windowMs: 60_000 },
    mini_dialog_generate: { limit: 8, windowMs: 60_000 },
    mini_dialog_continue: { limit: 10, windowMs: 60_000 },
    mini_dialog_roleplay: { limit: 10, windowMs: 60_000 },
    video_open_check: { limit: 10, windowMs: 60_000 }
  };

  const perModeLimit = modeLimits[mode];
  if (perModeLimit) {
    const extraRate = await checkRateLimit(`ai:mode:${mode}:${auth.id}`, perModeLimit.limit, perModeLimit.windowMs);
    if (!extraRate.ok) {
      return NextResponse.json({ error: "Rate limit" }, { status: 429 });
    }
  }

  const messages = buildPrompt(mode, userInput, context);

  const url = "https://api.openai.com/v1/chat/completions";
  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json"
  };

  // Use centralized token limit configuration
  const maxTokens = getMaxTokensForModel(model, mode);
  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model,
      temperature: 0.2,
      max_tokens: maxTokens,
      messages
    })
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    return NextResponse.json({ error: data?.error?.message || "OpenAI error" }, { status: 500 });
  }
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content || "";

  // Extract usage info from OpenAI response
  const usage = data?.usage || {};
  const promptTokens = usage.prompt_tokens || 0;
  const completionTokens = usage.completion_tokens || 0;
  const totalTokens = usage.total_tokens || 0;

  // Update user credits (skip if creditsLimit is Infinity - i.e., admin)
  if (creditsLimit !== Infinity && creditsLimit > 0) {
    if (user?.aiUsage?.month === monthKey) {
      await db.collection("users").updateOne(
        { _id: new ObjectId(auth.id) },
        { $inc: { "aiUsage.usedCredits": creditsCost }, $set: { "aiUsage.month": monthKey } }
      );
    } else {
      await db.collection("users").updateOne(
        { _id: new ObjectId(auth.id) },
        { $set: { "aiUsage.month": monthKey, "aiUsage.usedCredits": creditsCost } }
      );
    }
  }

  // Log AI usage with detailed info
  await db.collection("ai_usage_logs").insertOne({
    userId: new ObjectId(auth.id),
    username: auth.username,
    isAdmin,
    mode,
    model,
    needsVision,
    credits: creditsCost,
    tokens: {
      prompt: promptTokens,
      completion: completionTokens,
      total: totalTokens
    },
    maxTokens,
    createdAt: new Date(),
    month: monthKey
  });

  return NextResponse.json({ ok: true, text });
}
