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

export type AchievementLevel = {
  value: number;
  label: LocaleText;
};

export type AchievementDefinition = {
  id: AchievementId;
  title: LocaleText;
  desc: LocaleText;
  icon: AchievementIcon;
  tone: AchievementTone;
  targetType: "testsTaken" | "wordsStudied" | "sessions" | "points" | "rankMax";
  levels: AchievementLevel[];
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
  completed: boolean;
  progress: number;
  target: number;
  tierLabel: string | null;
  nextLabel: string | null;
  statusLabel: string;
};

export const ACHIEVEMENTS: AchievementDefinition[] = [
  {
    id: "first-test",
    title: { uk: "Перші кроки", pl: "Pierwsze kroki" },
    desc: { uk: "Завершити 1 тест", pl: "Ukończ 1 test" },
    icon: "seedling",
    tone: "moss",
    targetType: "testsTaken",
    levels: [
      { value: 1, label: { uk: "Бронза", pl: "Brąz" } },
      { value: 10, label: { uk: "Срібло", pl: "Srebro" } },
      { value: 30, label: { uk: "Золото", pl: "Złoto" } }
    ]
  },
  {
    id: "five-tests",
    title: { uk: "Тестова серія", pl: "Seria testów" },
    desc: { uk: "Завершити 5 тестів", pl: "Ukończ 5 testów" },
    icon: "flask",
    tone: "gold",
    targetType: "testsTaken",
    levels: [
      { value: 5, label: { uk: "Бронза", pl: "Brąz" } },
      { value: 25, label: { uk: "Срібло", pl: "Srebro" } },
      { value: 60, label: { uk: "Золото", pl: "Złoto" } }
    ]
  },
  {
    id: "ten-tests",
    title: { uk: "Відмінник", pl: "Prymus" },
    desc: { uk: "Завершити 10 тестів", pl: "Ukończ 10 testów" },
    icon: "medal",
    tone: "terracotta",
    targetType: "testsTaken",
    levels: [
      { value: 10, label: { uk: "Бронза", pl: "Brąz" } },
      { value: 50, label: { uk: "Срібло", pl: "Srebro" } },
      { value: 120, label: { uk: "Золото", pl: "Złoto" } }
    ]
  },
  {
    id: "words-20",
    title: { uk: "Словниковий старт", pl: "Start słownika" },
    desc: { uk: "Вивчити 20 слів", pl: "Poznaj 20 słów" },
    icon: "book",
    tone: "moss",
    targetType: "wordsStudied",
    levels: [
      { value: 20, label: { uk: "Бронза", pl: "Brąz" } },
      { value: 100, label: { uk: "Срібло", pl: "Srebro" } },
      { value: 300, label: { uk: "Золото", pl: "Złoto" } }
    ]
  },
  {
    id: "words-100",
    title: { uk: "Сто слів", pl: "Sto słów" },
    desc: { uk: "Вивчити 100 слів", pl: "Poznaj 100 słów" },
    icon: "stack",
    tone: "gold",
    targetType: "wordsStudied",
    levels: [
      { value: 200, label: { uk: "Бронза", pl: "Brąz" } },
      { value: 500, label: { uk: "Срібло", pl: "Srebro" } },
      { value: 1000, label: { uk: "Золото", pl: "Złoto" } }
    ]
  },
  {
    id: "sessions-5",
    title: { uk: "Ритм", pl: "Rytm" },
    desc: { uk: "Зробити 5 навчальних сесій", pl: "Zrób 5 sesji nauki" },
    icon: "timer",
    tone: "ink",
    targetType: "sessions",
    levels: [
      { value: 5, label: { uk: "Бронза", pl: "Brąz" } },
      { value: 20, label: { uk: "Срібло", pl: "Srebro" } },
      { value: 60, label: { uk: "Золото", pl: "Złoto" } }
    ]
  },
  {
    id: "sessions-20",
    title: { uk: "Стабільність", pl: "Stabilność" },
    desc: { uk: "Зробити 20 навчальних сесій", pl: "Zrób 20 sesji nauki" },
    icon: "fire",
    tone: "terracotta",
    targetType: "sessions",
    levels: [
      { value: 20, label: { uk: "Бронза", pl: "Brąz" } },
      { value: 80, label: { uk: "Срібло", pl: "Srebro" } },
      { value: 160, label: { uk: "Золото", pl: "Złoto" } }
    ]
  },
  {
    id: "points-100",
    title: { uk: "Перші 100", pl: "Pierwsze 100" },
    desc: { uk: "Набрати 100 балів", pl: "Zdobądź 100 punktów" },
    icon: "bolt",
    tone: "gold",
    targetType: "points",
    levels: [
      { value: 100, label: { uk: "Бронза", pl: "Brąz" } },
      { value: 500, label: { uk: "Срібло", pl: "Srebro" } },
      { value: 2000, label: { uk: "Золото", pl: "Złoto" } }
    ]
  },
  {
    id: "points-500",
    title: { uk: "Сила 500", pl: "Moc 500" },
    desc: { uk: "Набрати 500 балів", pl: "Zdobądź 500 punktów" },
    icon: "diamond",
    tone: "moss",
    targetType: "points",
    levels: [
      { value: 1000, label: { uk: "Бронза", pl: "Brąz" } },
      { value: 2500, label: { uk: "Срібло", pl: "Srebro" } },
      { value: 5000, label: { uk: "Золото", pl: "Złoto" } }
    ]
  },
  {
    id: "top-10",
    title: { uk: "Топ-10", pl: "Top 10" },
    desc: { uk: "Увійти в першу десятку рейтингу", pl: "Wejdź do top 10 rankingu" },
    icon: "trophy",
    tone: "terracotta",
    targetType: "rankMax",
    levels: [
      { value: 10, label: { uk: "Top 10", pl: "Top 10" } },
      { value: 3, label: { uk: "Top 3", pl: "Top 3" } },
      { value: 1, label: { uk: "Top 1", pl: "Top 1" } }
    ]
  }
];

export function getUserAchievements(params: {
  locale: "uk" | "pl";
  stats: UserStatsSnapshot;
  rank?: number | null;
}): AchievementProgress[] {
  const { locale, stats, rank } = params;

  return ACHIEVEMENTS.map((achievement) => {
    const levels = [...achievement.levels].sort((a, b) => a.value - b.value);
    const maxIndex = levels.length - 1;
    let achievedIndex = -1;
    let progress = 0;
    let target = levels[0]?.value || 0;

    if (achievement.targetType === "rankMax") {
      if (typeof rank === "number") {
        for (let i = levels.length - 1; i >= 0; i -= 1) {
          if (rank <= levels[i].value) {
            achievedIndex = i;
            break;
          }
        }
      }
      const completed = achievedIndex === maxIndex;
      const nextIndex = completed ? maxIndex : Math.max(0, achievedIndex + 1);
      target = levels[nextIndex]?.value || 0;
      progress = typeof rank === "number" && rank <= target ? target : 0;
    } else {
      const value = Number(stats[achievement.targetType] || 0);
      for (let i = levels.length - 1; i >= 0; i -= 1) {
        if (value >= levels[i].value) {
          achievedIndex = i;
          break;
        }
      }
      const completed = achievedIndex === maxIndex;
      const nextIndex = completed ? maxIndex : Math.max(0, achievedIndex + 1);
      target = levels[nextIndex]?.value || 0;
      progress = Math.min(value, target);
    }

    const unlocked = achievedIndex >= 0;
    const completed = achievedIndex === maxIndex && unlocked;
    const tierLabel = unlocked ? levels[achievedIndex]?.label[locale] || null : null;
    const nextLabel = completed ? null : levels[Math.max(0, achievedIndex + 1)]?.label[locale] || null;
    const statusLabel = completed
      ? locale === "pl"
        ? "Maks"
        : "Макс"
      : unlocked
        ? tierLabel && nextLabel
          ? `${tierLabel} → ${nextLabel}`
          : tierLabel || ""
        : nextLabel || "";

    return {
      id: achievement.id,
      title: achievement.title[locale],
      desc: achievement.desc[locale],
      icon: achievement.icon,
      tone: achievement.tone,
      unlocked,
      completed,
      progress,
      target,
      tierLabel,
      nextLabel,
      statusLabel
    };
  });
}
