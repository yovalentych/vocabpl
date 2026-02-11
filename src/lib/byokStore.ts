import { getDb } from "@/lib/db";

type ByokEntry = {
  apiKey: string;
  expiresAt: number;
};

const globalForByok = globalThis as unknown as {
  byokIndexesReady?: boolean;
};

async function ensureIndexes() {
  if (globalForByok.byokIndexesReady) return;
  try {
    const db = await getDb();
    const coll = db.collection("byok_sessions");
    await coll.createIndex({ sessionId: 1 }, { unique: true });
    await coll.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
    globalForByok.byokIndexesReady = true;
  } catch {
    // Ignore index creation errors to avoid blocking requests.
  }
}

export async function setByokSession(sessionId: string, apiKey: string, ttlMs: number) {
  await ensureIndexes();
  const db = await getDb();
  const expiresAt = new Date(Date.now() + ttlMs);
  await db.collection("byok_sessions").updateOne(
    { sessionId },
    {
      $set: {
        sessionId,
        apiKey,
        expiresAt,
        updatedAt: new Date()
      },
      $setOnInsert: {
        createdAt: new Date()
      }
    },
    { upsert: true }
  );
}

export async function getByokSession(sessionId: string): Promise<ByokEntry | null> {
  await ensureIndexes();
  const db = await getDb();
  const record = await db.collection("byok_sessions").findOne({ sessionId });
  if (!record) return null;
  const expiresAt = record.expiresAt ? new Date(record.expiresAt).getTime() : 0;
  if (expiresAt && Date.now() > expiresAt) {
    await db.collection("byok_sessions").deleteOne({ sessionId });
    return null;
  }
  return {
    apiKey: String(record.apiKey || ""),
    expiresAt
  };
}

export async function clearByokSession(sessionId: string) {
  await ensureIndexes();
  const db = await getDb();
  await db.collection("byok_sessions").deleteOne({ sessionId });
}
