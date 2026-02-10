/**
 * Difficulty System - Централізована система складності для AI генерації
 *
 * Кожен рівень (A/B/C) має чіткі обмеження для:
 * - Синтаксису (довжина речень, вкладеність)
 * - Граматики (дозволені/заборонені конструкції)
 * - Лексики (частотність, реєстр, ідіоми)
 * - Прагматики (комунікативні наміри)
 */

export interface DifficultySpec {
  id: "A" | "B" | "C";
  tier: 1 | 2 | 3; // Підрівні: A1/A2/A3, B1/B2, C1/C2
  name: string;
  description: string;

  // СИНТАКСИС
  syntax: {
    sentenceLength: { min: number; max: number; target: number };
    wordsPerSentence: { min: number; max: number; avg: number };
    maxSubordinateClauses: number;
    allowedSentenceTypes: ("simple" | "compound" | "complex" | "compound-complex")[];
    bannedPatterns?: string[]; // Заборонені синтаксичні патерни
  };

  // ГРАМАТИКА
  grammar: {
    tenses: {
      allowed: string[]; // "present", "past_simple", "future_simple", "past_perfect", etc.
      banned?: string[];
    };
    moods: {
      allowed: string[]; // "indicative", "imperative", "conditional", "subjunctive"
      banned?: string[];
    };
    voice: {
      passive: "forbidden" | "rare" | "occasional" | "frequent";
      activePreferred: boolean;
    };
    complexity: {
      indirectSpeech: boolean;
      participialPhrases: boolean; // Дієприкметникові звороти
      gerundPhrases: boolean; // Дієприслівникові звороти
      inversion: boolean;
      ellipsis: boolean; // Пропуск слів
    };
    structures: {
      maxNestingLevel: number; // Максимальна вкладеність підрядних
      allowedConjunctions: string[];
      bannedConjunctions?: string[];
    };
  };

  // ЛЕКСИКА
  lexicon: {
    register: ("neutral" | "informal" | "formal" | "mixed")[];
    frequencyBand: {
      min: number; // 1 = найчастіші, 10000 = рідкісні
      max: number;
      preferredRange: [number, number];
    };
    newWordsPerSentence: number; // Скільки нових слів допустимо
    idioms: {
      allowed: boolean;
      maxPerText: number; // На 100 слів
      types?: string[]; // "common", "literary", "colloquial"
    };
    slang: {
      allowed: boolean;
      types?: string[]; // "neutral", "mild", "strong"
    };
    technicalTerms: boolean;
    abstractConcepts: "forbidden" | "rare" | "occasional" | "frequent";
  };

  // ПРАГМАТИКА (комунікативні наміри)
  pragmatics: {
    allowedIntents: string[];
    // "request", "question", "answer", "explanation", "argument",
    // "persuasion", "negotiation", "refusal", "apology", "gratitude"
    tone: ("neutral" | "polite" | "formal" | "casual" | "ironic")[];
    implicitness: "explicit" | "mostly-explicit" | "mixed" | "implicit";
    culturalReferences: boolean;
  };

  // КОНТЕНТ
  content: {
    topicComplexity: "concrete" | "everyday" | "abstract" | "specialized";
    contextDependency: "low" | "medium" | "high";
    backgroundKnowledge: "none" | "basic" | "intermediate" | "advanced";
    themes: {
      allowed: string[];
      preferred?: string[];
    };
  };

  // ФОРМАТ (для різних типів вправ)
  format: {
    // Для reading
    reading?: {
      paragraphLength: { min: number; max: number };
      totalWords: { min: number; max: number };
      cohesiveDevices: ("minimal" | "basic" | "advanced")[];
    };
    // Для dialogue
    dialogue?: {
      turnsCount: { min: number; max: number };
      wordsPerTurn: { min: number; max: number };
    };
    // Для translation/sentences
    sentences?: {
      count: { min: number; max: number };
      variety: "repetitive" | "mixed" | "diverse";
    };
  };

  // ВАЛІДАЦІЯ (автоматичні метрики)
  validation: {
    // Що перевіряти автоматично
    checks: {
      avgSentenceLength: boolean;
      subordinateClauseRatio: boolean; // % речень з підрядними
      passiveVoiceRatio: boolean;
      lexicalDiversity: boolean; // Type-token ratio
      forbiddenWords: boolean;
    };
    // Пороги для автоматичного відхилення
    thresholds: {
      maxAvgSentenceLength: number;
      maxSubordinateRatio: number; // 0-1
      maxPassiveRatio: number; // 0-1
      minLexicalDiversity: number; // 0-1
    };
  };

  // ПРИКЛАДИ (для промптів)
  examples: {
    good: string[]; // Приклади хороших речень цього рівня
    bad: string[]; // Приклади того, чого уникати
  };
}

/**
 * РІВЕНЬ A (A1-A2)
 * Контрольована простота, мінімум неоднозначностей
 */
export const DIFFICULTY_A: DifficultySpec = {
  id: "A",
  tier: 1,
  name: "Початковий (A1-A2)",
  description: "Прості речення, базова граматика, повсякденна лексика",

  syntax: {
    sentenceLength: { min: 3, max: 12, target: 8 },
    wordsPerSentence: { min: 5, max: 12, avg: 8 },
    maxSubordinateClauses: 1,
    allowedSentenceTypes: ["simple", "compound"],
    bannedPatterns: [
      "вкладені підрядні",
      "дужки та вставні конструкції",
      "складні перерахування",
      "риторичні питання"
    ]
  },

  grammar: {
    tenses: {
      allowed: ["present", "past_simple", "future_simple"],
      banned: ["past_perfect", "future_perfect", "past_continuous"]
    },
    moods: {
      allowed: ["indicative", "imperative"],
      banned: ["conditional", "subjunctive"]
    },
    voice: {
      passive: "forbidden",
      activePreferred: true
    },
    complexity: {
      indirectSpeech: false,
      participialPhrases: false,
      gerundPhrases: false,
      inversion: false,
      ellipsis: false
    },
    structures: {
      maxNestingLevel: 0,
      allowedConjunctions: ["і", "a", "але", "бо", "та", "або"],
      bannedConjunctions: [
        "хоча", "незважаючи на", "попри", "оскільки",
        "внаслідок", "задля", "через те що"
      ]
    }
  },

  lexicon: {
    register: ["neutral", "informal"],
    frequencyBand: {
      min: 1,
      max: 2000,
      preferredRange: [1, 1000]
    },
    newWordsPerSentence: 1,
    idioms: {
      allowed: false,
      maxPerText: 0
    },
    slang: {
      allowed: false
    },
    technicalTerms: false,
    abstractConcepts: "forbidden"
  },

  pragmatics: {
    allowedIntents: [
      "request", "question", "answer", "greeting",
      "thanks", "simple_explanation", "description"
    ],
    tone: ["neutral", "polite"],
    implicitness: "explicit",
    culturalReferences: false
  },

  content: {
    topicComplexity: "concrete",
    contextDependency: "low",
    backgroundKnowledge: "none",
    themes: {
      allowed: [
        "повсякденне життя", "їжа", "сім'я", "робота",
        "подорожі", "покупки", "дім", "хобі", "погода"
      ],
      preferred: ["їжа", "сім'я", "повсякденне життя"]
    }
  },

  format: {
    reading: {
      paragraphLength: { min: 3, max: 5 },
      totalWords: { min: 80, max: 150 },
      cohesiveDevices: ["minimal"]
    },
    dialogue: {
      turnsCount: { min: 4, max: 8 },
      wordsPerTurn: { min: 3, max: 10 }
    },
    sentences: {
      count: { min: 6, max: 12 },
      variety: "repetitive"
    }
  },

  validation: {
    checks: {
      avgSentenceLength: true,
      subordinateClauseRatio: true,
      passiveVoiceRatio: true,
      lexicalDiversity: false,
      forbiddenWords: true
    },
    thresholds: {
      maxAvgSentenceLength: 12,
      maxSubordinateRatio: 0.2,
      maxPassiveRatio: 0,
      minLexicalDiversity: 0.5
    }
  },

  examples: {
    good: [
      "Wczoraj byłem w parku.",
      "Lubię czytać książki.",
      "Moja siostra pracuje w szkole.",
      "Czy chcesz kawy?",
      "Jutro idę do lekarza."
    ],
    bad: [
      "Gdybym miał więcej czasu, przeczytałbym tę książkę.", // Conditional
      "Książka, którą mi poleciłeś, była interesująca.", // Підрядне означальне
      "Nie wiedząc, co zrobić, czekałem.", // Дієприслівник
      "To jest zrobione przez niego." // Passive
    ]
  }
};

/**
 * РІВЕНЬ B (B1-B2)
 * Природність, різноманітність, контрольована складність
 */
export const DIFFICULTY_B: DifficultySpec = {
  id: "B",
  tier: 1,
  name: "Середній (B1-B2)",
  description: "Різноманітні структури, модальність, умовні конструкції",

  syntax: {
    sentenceLength: { min: 8, max: 20, target: 14 },
    wordsPerSentence: { min: 10, max: 20, avg: 14 },
    maxSubordinateClauses: 2,
    allowedSentenceTypes: ["simple", "compound", "complex"],
    bannedPatterns: [
      "надмірно вкладені конструкції (3+ рівні)",
      "архаїчні звороти"
    ]
  },

  grammar: {
    tenses: {
      allowed: [
        "present", "past_simple", "past_perfect",
        "future_simple", "present_perfect", "past_continuous"
      ],
      banned: ["future_perfect", "past_perfect_continuous"]
    },
    moods: {
      allowed: ["indicative", "imperative", "conditional"],
      banned: ["subjunctive_advanced"]
    },
    voice: {
      passive: "occasional",
      activePreferred: true
    },
    complexity: {
      indirectSpeech: true,
      participialPhrases: false,
      gerundPhrases: false,
      inversion: false,
      ellipsis: false
    },
    structures: {
      maxNestingLevel: 1,
      allowedConjunctions: [
        "і", "a", "ale", "бо", "та", "або",
        "якщо", "коли", "тому що", "щоб",
        "хоча", "поки", "як", "який"
      ],
      bannedConjunctions: [
        "незважаючи на те що", "внаслідок того що",
        "задля того щоб"
      ]
    }
  },

  lexicon: {
    register: ["neutral", "informal", "formal"],
    frequencyBand: {
      min: 1,
      max: 5000,
      preferredRange: [500, 3000]
    },
    newWordsPerSentence: 2,
    idioms: {
      allowed: true,
      maxPerText: 2,
      types: ["common"]
    },
    slang: {
      allowed: true,
      types: ["neutral", "mild"]
    },
    technicalTerms: false,
    abstractConcepts: "occasional"
  },

  pragmatics: {
    allowedIntents: [
      "request", "question", "answer", "explanation",
      "argument", "suggestion", "refusal", "negotiation",
      "complaint", "apology", "persuasion"
    ],
    tone: ["neutral", "polite", "formal", "casual"],
    implicitness: "mostly-explicit",
    culturalReferences: true
  },

  content: {
    topicComplexity: "everyday",
    contextDependency: "medium",
    backgroundKnowledge: "basic",
    themes: {
      allowed: [
        "робота", "освіта", "культура", "здоров'я",
        "технології", "суспільство", "довкілля",
        "відносини", "планування", "проблеми та рішення"
      ]
    }
  },

  format: {
    reading: {
      paragraphLength: { min: 4, max: 8 },
      totalWords: { min: 150, max: 300 },
      cohesiveDevices: ["basic", "advanced"]
    },
    dialogue: {
      turnsCount: { min: 8, max: 14 },
      wordsPerTurn: { min: 8, max: 18 }
    },
    sentences: {
      count: { min: 8, max: 15 },
      variety: "mixed"
    }
  },

  validation: {
    checks: {
      avgSentenceLength: true,
      subordinateClauseRatio: true,
      passiveVoiceRatio: true,
      lexicalDiversity: true,
      forbiddenWords: true
    },
    thresholds: {
      maxAvgSentenceLength: 20,
      maxSubordinateRatio: 0.6,
      maxPassiveRatio: 0.2,
      minLexicalDiversity: 0.6
    }
  },

  examples: {
    good: [
      "Jeśli będę miał czas, pomogę ci z tym projektem.",
      "Powiedział, że jutro przyjedzie, ale nie jestem pewien.",
      "Chociaż było zimno, postanowiliśmy pójść na spacer.",
      "Myślę, że warto spróbować, zanim podejmiemy decyzję."
    ],
    bad: [
      "Nie mając pojęcia o tym, co się stało, czekałem na dalsze informacje.", // Дієприслівник
      "To, co powiedziałeś wczoraj, było bardzo interesujące, choć nie do końca zrozumiałe.", // Занадто складно
      "Książka została napisana przez autora, który mieszka w naszym mieście." // Passive + means
    ]
  }
};

/**
 * РІВЕНЬ C (C1-C2)
 * Стилістика, нюанси, багатошаровість
 */
export const DIFFICULTY_C: DifficultySpec = {
  id: "C",
  tier: 1,
  name: "Просунутий (C1-C2)",
  description: "Повний арсенал граматики, ідіоми, стилістичні засоби",

  syntax: {
    sentenceLength: { min: 12, max: 35, target: 20 },
    wordsPerSentence: { min: 15, max: 35, avg: 22 },
    maxSubordinateClauses: 4,
    allowedSentenceTypes: ["simple", "compound", "complex", "compound-complex"]
  },

  grammar: {
    tenses: {
      allowed: ["all"]
    },
    moods: {
      allowed: ["all"]
    },
    voice: {
      passive: "frequent",
      activePreferred: false
    },
    complexity: {
      indirectSpeech: true,
      participialPhrases: true,
      gerundPhrases: true,
      inversion: true,
      ellipsis: true
    },
    structures: {
      maxNestingLevel: 3,
      allowedConjunctions: ["all"],
      bannedConjunctions: []
    }
  },

  lexicon: {
    register: ["neutral", "informal", "formal", "mixed"],
    frequencyBand: {
      min: 1,
      max: 10000,
      preferredRange: [1000, 8000]
    },
    newWordsPerSentence: 3,
    idioms: {
      allowed: true,
      maxPerText: 5,
      types: ["common", "literary", "colloquial"]
    },
    slang: {
      allowed: true,
      types: ["neutral", "mild", "strong"]
    },
    technicalTerms: true,
    abstractConcepts: "frequent"
  },

  pragmatics: {
    allowedIntents: ["all"],
    tone: ["neutral", "polite", "formal", "casual", "ironic"],
    implicitness: "mixed",
    culturalReferences: true
  },

  content: {
    topicComplexity: "specialized",
    contextDependency: "high",
    backgroundKnowledge: "advanced",
    themes: {
      allowed: ["all"]
    }
  },

  format: {
    reading: {
      paragraphLength: { min: 6, max: 12 },
      totalWords: { min: 300, max: 600 },
      cohesiveDevices: ["advanced"]
    },
    dialogue: {
      turnsCount: { min: 10, max: 20 },
      wordsPerTurn: { min: 12, max: 30 }
    },
    sentences: {
      count: { min: 10, max: 20 },
      variety: "diverse"
    }
  },

  validation: {
    checks: {
      avgSentenceLength: true,
      subordinateClauseRatio: false,
      passiveVoiceRatio: false,
      lexicalDiversity: true,
      forbiddenWords: false
    },
    thresholds: {
      maxAvgSentenceLength: 35,
      maxSubordinateRatio: 1,
      maxPassiveRatio: 0.4,
      minLexicalDiversity: 0.7
    }
  },

  examples: {
    good: [
      "Pomimo tego, że sytuacja wydawała się beznadziejna, nie tracił nadziei na pozytywne rozwiązanie.",
      "Gdyby tylko wiedział wcześniej o konsekwencjach swojej decyzji, zapewne postąpiłby inaczej.",
      "Nie mogąc dojść do porozumienia, postanowili odłożyć dyskusję na później, co okazało się mądrym rozwiązaniem.",
      "To, co powiedział, choć brzmiało kontrowersyjnie, miało w sobie ziarno prawdy, które trudno było zignorować."
    ],
    bad: []
  }
};

/**
 * Мапа всіх рівнів
 */
export const DIFFICULTY_SPECS: Record<"A" | "B" | "C", DifficultySpec> = {
  A: DIFFICULTY_A,
  B: DIFFICULTY_B,
  C: DIFFICULTY_C
};

/**
 * Отримати spec для рівня
 */
export function getDifficultySpec(level: "A1" | "A2" | "B1" | "B2" | "C1" | "C2"): DifficultySpec {
  const mainLevel = level[0] as "A" | "B" | "C";
  const tier = parseInt(level[1]) as 1 | 2;

  const spec = { ...DIFFICULTY_SPECS[mainLevel] };
  spec.tier = tier;

  // Підстроювання для tier 2 (A2, B2, C2) - трохи складніше
  if (tier === 2) {
    spec.syntax.wordsPerSentence.avg += 2;
    spec.syntax.wordsPerSentence.max += 3;
    spec.lexicon.newWordsPerSentence += 0.5;
    if (spec.format.reading) {
      spec.format.reading.totalWords.min += 30;
      spec.format.reading.totalWords.max += 50;
    }
  }

  return spec;
}
