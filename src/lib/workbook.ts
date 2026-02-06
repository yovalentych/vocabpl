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
