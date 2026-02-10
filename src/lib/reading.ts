import fs from "fs";
import path from "path";

export type ReadingText = {
  id: string;
  level: string;
  topic: string;
  title: { pl: string; uk: string };
  text: { pl: string; uk: string };
  glossary: { pl: string; uk: string }[];
  questions: { pl: string[]; uk: string[] };
};

export function loadReadingTexts(): ReadingText[] {
  const filePath = path.join(process.cwd(), "data", "reading_texts_a1.json");
  const raw = fs.readFileSync(filePath, "utf-8");
  const data = JSON.parse(raw);
  return Array.isArray(data?.items) ? data.items : [];
}
