import { connectMongo } from "@/lib/mongodb";

export type Word = {
  _id?: string;
  id: string;
  pl: string;
  uk: string;
  pos: string;
  source: string;
  type:
    | "verb"
    | "adverb"
    | "adjective"
    | "slang"
    | "others"
    | "soft_swears"
    | "clean_emotions"
    | "abbreviations"
    | "my_words";
};

export type TestQuestion = {
  id: string;
  number: number;
  type: string;
  prompt: string;
  options: { id: string; text: string }[];
  answer: string | string[];
  answerType: string;
};

export async function getDb() {
  const client = await connectMongo();
  const dbName = process.env.MONGODB_DB || "polish_vocab";
  return client.db(dbName);
}
