export type AchievementId =
  | "first-test"
  | "five-tests"
  | "ten-tests"
  | "words-20"
  | "words-100"
  | "sessions-5"
  | "sessions-20"
  | "points-100"
  | "points-500"
  | "top-10";

export type AchievementTone = "moss" | "gold" | "terracotta" | "ink";

export type AchievementIcon =
  | "seedling"
  | "flask"
  | "medal"
  | "book"
  | "stack"
  | "timer"
  | "fire"
  | "bolt"
  | "diamond"
  | "trophy";

type LocaleText = { uk: string; pl: string };

export type AchievementDefinition = {
  id: AchievementId;
  title: LocaleText;
  desc: LocaleText;
  icon: AchievementIcon;
  tone: AchievementTone;
  target: {
    type: "testsTaken" | "wordsStudied" | "sessions" | "points" | "rankMax";
    value: number;
  };
};

export type UserStatsSnapshot = {
  wordsStudied: number;
  testsTaken: number;
  sessions: number;
  points: number;
};

export type AchievementProgress = {
  id: AchievementId;
  title: string;
  desc: string;
  icon: AchievementIcon;
  tone: AchievementTone;
  unlocked: boolean;
  progress: number;
  target: number;
};

export const ACHIEVEMENTS: AchievementDefinition[] = [
  {
    id: "first-test",
    title: { uk: "Перші кроки", pl: "Pierwsze kroki" },
    desc: { uk: "Завершити 1 тест", pl: "Ukończ 1 test" },
    icon: "seedling",
    tone: "moss",
    target: { type: "testsTaken", value: 1 }
  },
  {
    id: "five-tests",
    title: { uk: "Тестова серія", pl: "Seria testów" },
    desc: { uk: "Завершити 5 тестів", pl: "Ukończ 5 testów" },
    icon: "flask",
    tone: "gold",
    target: { type: "testsTaken", value: 5 }
  },
  {
    id: "ten-tests",
    title: { uk: "Відмінник", pl: "Prymus" },
    desc: { uk: "Завершити 10 тестів", pl: "Ukończ 10 testów" },
    icon: "medal",
    tone: "terracotta",
    target: { type: "testsTaken", value: 10 }
  },
  {
    id: "words-20",
    title: { uk: "Словниковий старт", pl: "Start słownika" },
    desc: { uk: "Вивчити 20 слів", pl: "Poznaj 20 słów" },
    icon: "book",
    tone: "moss",
    target: { type: "wordsStudied", value: 20 }
  },
  {
    id: "words-100",
    title: { uk: "Сто слів", pl: "Sto słów" },
    desc: { uk: "Вивчити 100 слів", pl: "Poznaj 100 słów" },
    icon: "stack",
    tone: "gold",
    target: { type: "wordsStudied", value: 100 }
  },
  {
    id: "sessions-5",
    title: { uk: "Ритм", pl: "Rytm" },
    desc: { uk: "Зробити 5 навчальних сесій", pl: "Zrób 5 sesji nauki" },
    icon: "timer",
    tone: "ink",
    target: { type: "sessions", value: 5 }
  },
  {
    id: "sessions-20",
    title: { uk: "Стабільність", pl: "Stabilność" },
    desc: { uk: "Зробити 20 навчальних сесій", pl: "Zrób 20 sesji nauki" },
    icon: "fire",
    tone: "terracotta",
    target: { type: "sessions", value: 20 }
  },
  {
    id: "points-100",
    title: { uk: "Перші 100", pl: "Pierwsze 100" },
    desc: { uk: "Набрати 100 балів", pl: "Zdobądź 100 punktów" },
    icon: "bolt",
    tone: "gold",
    target: { type: "points", value: 100 }
  },
  {
    id: "points-500",
    title: { uk: "Сила 500", pl: "Moc 500" },
    desc: { uk: "Набрати 500 балів", pl: "Zdobądź 500 punktów" },
    icon: "diamond",
    tone: "moss",
    target: { type: "points", value: 500 }
  },
  {
    id: "top-10",
    title: { uk: "Топ-10", pl: "Top 10" },
    desc: { uk: "Увійти в першу десятку рейтингу", pl: "Wejdź do top 10 rankingu" },
    icon: "trophy",
    tone: "terracotta",
    target: { type: "rankMax", value: 10 }
  }
];

export function getUserAchievements(params: {
  locale: "uk" | "pl";
  stats: UserStatsSnapshot;
  rank?: number | null;
}): AchievementProgress[] {
  const { locale, stats, rank } = params;

  return ACHIEVEMENTS.map((achievement) => {
    const target = achievement.target.value;
    let progress = 0;
    let unlocked = false;

    if (achievement.target.type === "rankMax") {
      if (typeof rank === "number") {
        unlocked = rank <= target;
        progress = unlocked ? target : 0;
      } else {
        unlocked = false;
        progress = 0;
      }
    } else {
      const value = Number(stats[achievement.target.type] || 0);
      progress = Math.min(value, target);
      unlocked = value >= target;
    }

    return {
      id: achievement.id,
      title: achievement.title[locale],
      desc: achievement.desc[locale],
      icon: achievement.icon,
      tone: achievement.tone,
      unlocked,
      progress,
      target
    };
  });
}
