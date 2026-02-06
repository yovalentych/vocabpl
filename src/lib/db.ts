import { connectMongo } from "@/lib/mongodb";
import type { Db } from "mongodb";

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
  if (!process.env.MONGODB_URI && (process.env.CI === "true" || process.env.NEXT_PHASE === "phase-production-build")) {
    const mockCursor = {
      project() {
        return this;
      },
      sort() {
        return this;
      },
      limit() {
        return this;
      },
      toArray: async () => []
    };

    const mockCollection = {
      find: () => mockCursor,
      aggregate: () => mockCursor,
      findOne: async () => null,
      countDocuments: async () => 0,
      updateOne: async () => ({ acknowledged: true, matchedCount: 0, modifiedCount: 0, upsertedId: null }),
      insertOne: async () => ({ acknowledged: true, insertedId: null }),
      deleteOne: async () => ({ acknowledged: true, deletedCount: 0 }),
      bulkWrite: async () => ({ insertedCount: 0, matchedCount: 0, modifiedCount: 0, upsertedCount: 0 })
    };

    return {
      collection: () => mockCollection
    } as unknown as Db;
  }

  const client = await connectMongo();
  const dbName = process.env.MONGODB_DB || "polish_vocab";
  return client.db(dbName);
}
