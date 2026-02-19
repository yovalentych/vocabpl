const LEVEL_MULTIPLIER: Record<string, number> = {
  A1: 1.0,
  A2: 1.1,
  B1: 1.25,
  B2: 1.4,
};

const DEFAULT_ITEM_COUNTS: Record<string, number> = {
  sentences: 5,
  cloze: 5,
  match: 5,
  translate: 5,
  dialogue: 3,
  paraphrase: 5,
  story: 1,
  describe: 1,
};

export function calculatePoints({
  score01,
  level,
  itemCount,
  exercise,
}: {
  score01: number;
  level?: string;
  itemCount?: number;
  exercise: string;
}): number {
  const base = Math.min(score01, 1) * 10;
  const lvl = LEVEL_MULTIPLIER[level ?? ""] ?? 1.0;
  const def = DEFAULT_ITEM_COUNTS[exercise] ?? 5;
  const qty = Math.max(itemCount ?? def, 1) / def;
  return Math.round(base * lvl * qty);
}
