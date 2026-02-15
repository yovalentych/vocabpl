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
    return [
      {
        role: "system",
        content:
          "You are a Polish tutor roleplaying a dialogue. Return STRICT JSON ONLY: {\"aiText\":string,\"usedVocabIds\":string[],\"coach\":{\"quickFeedbackUk\":string,\"nextTargetVocabIds\":string[]}|null}. Keep reply short and simple (A1)."
      },
      { role: "user", content: `Request:\n${userInput}\nContext:\n${context}` }
    ];
  }
  if (mode === "mini_dialog_check") {
    return [
      {
        role: "system",
        content:
          "You are a Polish language tutor. Return STRICT JSON ONLY. Schema: {\"overall\":{\"score01\":number,\"band\":string,\"pointsForRating\":number,\"xp\":number},\"breakdown\":{\"completion01\":number,\"grammar01\":number,\"vocab01\":number,\"politeness01\":number},\"feedback\":string,\"improvedSample\":string,\"suggestedVocab\":[{\"lemma\":string,\"meaning\":string,\"reason\":string}]}. IMPORTANT scoring: score01 is 0-1 scale, pointsForRating is 0-10 scale (calculate as Math.round(score01 * 10)), xp is 0-50 range. Use Ukrainian for feedback and meanings."
      },
      { role: "user", content: `Request:\n${userInput}\nContext:\n${context}` }
    ];
  }
  if (mode === "paraphrase_generate") {
    return [
      {
        role: "system",
        content:
          "You are a Polish language tutor. Return STRICT JSON ONLY. Schema: {\"task\":{\"id\":string,\"type\":\"paraphrase\",\"level\":string,\"items\":[{\"id\":string,\"sourcePl\":string,\"instructionUk\":string,\"instructionPl\":string,\"constraints\":{\"forbiddenWords\":string[],\"requireAtLeastOneOf\":string[],\"minWords\":number},\"targetVocabIds\":string[]}]}}. CRITICAL: sourcePl and instructionPl MUST be in POLISH, regardless of the language used in the topic/request. Keep A1-A2 sentences short. Use vocabPool if provided."
      },
      { role: "user", content: `Request:\n${userInput}\nContext:\n${context}` }
    ];
  }
  if (mode === "paraphrase_check") {
    return [
      {
        role: "system",
        content:
          "You are a Polish language tutor. Return STRICT JSON ONLY. Schema: {\"overall\":{\"score01\":number,\"band\":string,\"pointsForRating\":number,\"xp\":number},\"breakdown\":{\"meaning01\":number,\"compliance01\":number,\"grammar01\":number,\"rephrase01\":number,\"style01\":number},\"items\":[{\"id\":string,\"score01\":number,\"verdict\":\"ok\"|\"weak\"|\"bad\",\"quickFeedbackUk\":string,\"issues\":string[],\"reference\":string[],\"improvedUserVersionPl\":string}],\"suggestedVocab\":[{\"lemma\":string,\"pos\":string,\"meaningUk\":string,\"reasonUk\":string}]}. IMPORTANT scoring: score01 is 0-1 scale, pointsForRating is 0-10 scale (calculate as Math.round(score01 * 10)), xp is 0-50 range. Use Ukrainian for feedback and meanings."
      },
      { role: "user", content: `Request:\n${userInput}\nContext:\n${context}` }
    ];
  }
  if (mode === "workbook_sentence_prompt") {
    return [
      {
        role: "system",
        content:
          "You are a Polish language tutor. Return STRICT JSON: {\"title\": string|null, \"prompt\": string}. The prompt should guide a student to write 2-3 sentences using given vocabulary. Keep it short."
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
          "You are a Polish language tutor. Return STRICT JSON: {\"title\": string|null, \"prompt\": string}. The prompt should set a short role-play situation for a 4-line mini dialogue. Keep it short."
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
          "You are a Polish language tutor. Return STRICT JSON: {\"title\": string|null, \"prompt\": string}. The prompt should describe an image topic for a student to write a Polish description. Keep it short and visual."
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
- qualityScore = (naturalness + grammar) / 2 * 10 (0-10 scale)

RETURN STRICT JSON ONLY:
{
  "qualityScore": number (0-10, calculated as (naturalness + grammar) / 2 * 10),
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

    return [
      {
        role: "system",
        content:
          `You are a Polish language tutor. Generate ${count} Polish words related to the topic "${topic}" at ${level} level for a sentence writing exercise. Return STRICT JSON ONLY. Schema: {\"words\":[{\"pl\":string,\"uk\":string,\"type\":string}]}. CRITICAL: The 'pl' field MUST contain POLISH words, regardless of the language used in the topic/request. The 'type' field should be the part of speech in English (e.g., "noun", "verb", "adjective", "adverb"). Select words that: 1) are appropriate for ${level} learners, 2) are thematically related to "${topic}", 3) are useful for writing varied sentences, 4) cover different parts of speech. IMPORTANT: Provide Ukrainian translations in the 'uk' field.`
      },
      {
        role: "user",
        content: `Generate ${count} words for topic: ${topic}, level: ${level}`
      }
    ];
  }
  if (mode === "sentences_check") {
    return [
      {
        role: "system",
        content:
          "You are a Polish language tutor. Return STRICT JSON ONLY. Schema: {\"overall\":{\"score01\":number,\"band\":string,\"pointsForRating\":number,\"xp\":number},\"items\":[{\"wordId\":string,\"word\":string,\"sentences\":[{\"text\":string,\"score01\":number,\"verdict\":\"ok\"|\"weak\"|\"bad\",\"feedback\":string,\"corrections\":string[],\"improved\":string}]}],\"suggestedVocab\":[{\"lemma\":string,\"meaning\":string,\"reason\":string}]}. Evaluate each sentence for: correctness, grammar, vocabulary usage, and whether it demonstrates understanding of the word. IMPORTANT scoring: score01 is 0-1 scale, pointsForRating is 0-10 scale (calculate as Math.round(score01 * 10)), xp is 0-50 range. Use the UI language from context (uiLanguage) for feedback, meanings and reasons. IMPORTANT: suggestedVocab.meaning must be in Ukrainian."
      },
      {
        role: "user",
        content: `Request:\n${userInput}\nContext:\n${context}`
      }
    ];
  }
  if (mode === "cloze_generate") {
    return [
      {
        role: "system",
        content:
          "You are a Polish language tutor. Return STRICT JSON ONLY. Schema: {\"task\":{\"id\":string,\"title\":string,\"level\":string,\"topic\":string,\"items\":[{\"id\":string,\"text\":string,\"gaps\":[{\"answers\":string[],\"hint\":string,\"hintType\":\"word\"|\"translation\"|\"context\"}]}]}}. CRITICAL: ALL sentences in the 'text' field MUST be in POLISH, regardless of the language used in the topic/request. Even if the user provides a topic in Ukrainian or English, generate Polish sentences. Create 5-8 Polish sentences with gaps (use ___ for gaps) about the given topic. Each gap should have: answers array (accept variations), hint (based on hintType), and hintType. hintType=word: hint is the Polish word in brackets; hintType=translation: hint is Ukrainian translation; hintType=context: hint is a contextual clue in Ukrainian. Use vocabPool if provided. Keep A1-A2 level simple. Use the UI language from context (uiLanguage) for title."
      },
      {
        role: "user",
        content: `Request:\n${userInput}\nContext:\n${context}`
      }
    ];
  }
  if (mode === "cloze_check") {
    return [
      {
        role: "system",
        content:
          "You are a Polish language tutor. Return STRICT JSON ONLY. Schema: {\"overall\":{\"score01\":number,\"band\":string,\"pointsForRating\":number,\"xp\":number},\"items\":[{\"id\":string,\"gaps\":[{\"verdict\":\"ok\"|\"weak\"|\"bad\",\"feedback\":string,\"correctAnswers\":string[]}]}],\"suggestedVocab\":[{\"lemma\":string,\"meaning\":string,\"reason\":string}]}. Evaluate each gap answer for correctness, consider Polish grammar and spelling variations. IMPORTANT scoring: score01 is 0-1 scale, pointsForRating is 0-10 scale (calculate as Math.round(score01 * 10)), xp is 0-50 range. Use the UI language from context (uiLanguage) for feedback, meanings and reasons. IMPORTANT: suggestedVocab.meaning must be in Ukrainian."
      },
      {
        role: "user",
        content: `Request:\n${userInput}\nContext:\n${context}`
      }
    ];
  }
  if (mode === "match_generate") {
    return [
      {
        role: "system",
        content:
          "You are a Polish language tutor. Return STRICT JSON ONLY. Schema: {\"task\":{\"id\":string,\"title\":string,\"level\":string,\"topic\":string,\"pairType\":\"translation\"|\"semantic\"|\"definition\",\"pairs\":[{\"left\":string,\"right\":string}]}}. Generate 8-12 matching pairs based on pairType: translation (Polish-Ukrainian), semantic (synonyms/antonyms/related concepts in Polish), definition (Polish word - Ukrainian definition). Keep A1-A2 level simple. Use vocabPool if provided. Use the UI language from context (uiLanguage) for title."
      },
      {
        role: "user",
        content: `Request:\n${userInput}\nContext:\n${context}`
      }
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
          "You are a Polish language tutor. Return STRICT JSON ONLY. Schema: {\"feedback\":{\"score\":number,\"overall\":string,\"suggestions\":string[],\"vocabulary\":[{\"pl\":string,\"uk\":string}]}}. Evaluate the student's story for: grammar correctness, vocabulary usage, coherence, creativity, and level appropriateness. Score is 0.0-1.0 (0.7+ is good). Overall feedback in Ukrainian (2-3 sentences). Suggestions array: 2-4 specific improvement tips in Ukrainian. Vocabulary: suggest 3-5 new Polish words (with Ukrainian translations) that would enhance the story. Be encouraging but constructive."
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
          "You are a Polish language creative writing coach. Return STRICT JSON ONLY. Schema: {\"hints\":string[]}. Based on the student's current text and the prompt, provide 2-4 short hints in Ukrainian to help them continue writing. Hints should be specific, actionable suggestions about: what to write next, vocabulary to use, sentence structures to try, or story development ideas. Keep each hint concise (one sentence)."
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
          "You are a Polish language tutor. Return STRICT JSON ONLY. Schema: {\"overall\":{\"score01\":number,\"band\":string,\"pointsForRating\":number,\"xp\":number},\"feedbackUk\":string,\"improvedPl\":string,\"translationUk\":string,\"suggestedVocab\":[{\"lemma\":string,\"meaningUk\":string,\"reasonUk\":string}]}. Evaluate a Polish description. IMPORTANT scoring: score01 is 0-1 scale, pointsForRating is 0-10 scale (calculate as Math.round(score01 * 10)), xp is 0-50 range. Feedback must be in Ukrainian. The improvedPl should be a corrected, natural Polish description. The translationUk should be Ukrainian translation of improvedPl."
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
          "You are a Polish language tutor. Return STRICT JSON ONLY. Schema: {\"overall\":{\"score01\":number,\"pointsForRating\":number,\"feedback\":string},\"items\":[{\"questionIndex\":number,\"correct\":boolean,\"userAnswer\":string,\"expectedAnswer\":string,\"feedback\":string}],\"suggestedVocab\":[{\"lemma\":string,\"meaning\":string,\"reason\":string}]}. Evaluate each answer for correctness and understanding. IMPORTANT scoring: score01 is 0-1 scale, pointsForRating is 0-10 scale (calculate as Math.round(score01 * 10)). Be flexible with answers that convey the right meaning even if wording differs. Use the UI language from context (uiLanguage) for all feedback and suggestedVocab meanings/reasons. IMPORTANT: suggestedVocab.meaning must be in Ukrainian."
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
          "You are a Polish language tutor. Return STRICT JSON ONLY. Schema: {\"explanation\":string,\"breakdown\":{\"grammar\":string,\"vocabulary\":string,\"context\":string},\"examples\":string[]}. Explain the selected Polish text fragment in Ukrainian. breakdown.grammar: grammatical analysis (tense, case, structure). breakdown.vocabulary: word meanings and usage. breakdown.context: contextual meaning in the text. examples: 2-3 example sentences using the same structure or vocabulary in Polish. Use the UI language from context (uiLanguage) for all explanations."
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
          "You are a Polish language tutor. Return STRICT JSON ONLY. Schema: {\"glossary\":[{\"pl\":string,\"uk\":string,\"difficulty\":\"easy\"|\"medium\"|\"hard\",\"context\":string}]}. Analyze the Polish text and extract 10-20 key vocabulary words that a learner at the specified level should know. For each word: pl is the lemma (base form), uk is Ukrainian translation, difficulty relative to learner level (easy: below level, medium: at level, hard: above level), context is the sentence from the text where it appears. Prioritize words that are: important for comprehension, useful for learners, not too basic. Use the UI language from context (uiLanguage) for Ukrainian translations."
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
    const count = parsed.count || 12;

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
        content: `You are a Polish language tutor. Generate ${count} example sentences using the Polish word "${word}" appropriate for ${level} level learners. Return STRICT JSON ONLY. Schema: {"examples":[{"sentence":string,"translation":string,"difficulty":"easy"|"medium"|"hard"}]}. Make examples practical and natural. Include Ukrainian translations.`
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
        content: `You are a Polish language tutor. Explain the grammar and usage of Polish word "${word}" (type: ${wordType}) for ${level} level learners. Return STRICT JSON ONLY. Schema: {"explanation":{"type":string,"usage":string,"notes":string,"forms":string[],"examples":[{"pl":string,"uk":string}]}}. Provide explanations in Ukrainian. Focus on practical usage.`
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
    const context = parsed.context || "";

    return [
      {
        role: "system",
        content: `You are a Polish language tutor. Based on the user's learned words and level, recommend ${count} new Polish words they should learn next. Return STRICT JSON ONLY. Schema: {"recommendations":[{"word":string,"translation":string,"reason":string,"category":string,"priority":"high"|"medium"|"low"}]}. Consider vocabulary progression and practical usefulness. Provide Ukrainian translations and reasons in Ukrainian.`
      },
      {
        role: "user",
        content: `User level: ${level}. Learned words: ${learnedWords.join(", ")}. Context: ${context}. Recommend ${count} new words.`
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
