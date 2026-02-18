import type { Word } from "@/lib/types";

export type WorkbookItem = Word & { text?: string; sentenceCount?: number };

export type WorkbookEntry = {
  id: string;
  number: number;
  createdAt: string;
  items: WorkbookItem[];
  totalPoints: number;
  formattedText: string;
};

/** Count filled sentences in an array of sentence strings */
export function countSentences(sentences: string[]) {
  return sentences.map((s) => s.trim()).filter(Boolean).length;
}

/** Calculate score based on sentence count: 3+ → 1, 2 → 0.75, 1 → 0.5, 0 → 0 */
export function scoreForCount(count: number) {
  if (count >= 3) return 1;
  if (count === 2) return 0.75;
  if (count === 1) return 0.5;
  return 0;
}

/** Safely parse JSON from AI response, returns null on failure */
export function safeParseAIResponse<T = any>(text: string | undefined | null): T | null {
  try {
    return JSON.parse(String(text || "{}"));
  } catch {
    return null;
  }
}
