import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getAuthUser } from "@/lib/auth";
import { getDb } from "@/lib/db";

type WordProgressEntry = {
  wordId: string;
  seenCount: number;
  correctCount: number;
  lastSeen: Date;
};

type UserDoc = {
  _id: ObjectId;
  wordProgress?: WordProgressEntry[];
  stats?: { points?: number };
};

function countSentences(text: string) {
  const cleaned = text.replace(/\r/g, " ").trim();
  if (!cleaned) return 0;
  const parts = cleaned
    .split(/(?<=[.!?])\s+|\n+/)
    .map((item) => item.trim())
    .filter(Boolean);
  return parts.length;
}

function scoreForCount(count: number) {
  if (count >= 3) return 1;
  if (count === 2) return 0.75;
  if (count === 1) return 0.5;
  return 0;
}

function buildFormattedText(items: { word: string; text: string }[]) {
  return items
    .map((item, idx) => {
      const header = `${idx + 1}. ${item.word}`;
      const body = item.text
        .split(/\n+/)
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => `- ${line}`)
        .join("\n");
      return `${header}\n${body}`.trim();
    })
    .join("\n\n")
    .trim();
}

export async function GET() {
  const auth = await getAuthUser();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = await getDb();

  // Get exercise attempts (new system)
  const attempts = await db
    .collection("exercise_attempts")
    .find({ userId: new ObjectId(auth.id) })
    .sort({ createdAt: -1 })
    .limit(50)
    .toArray();

  // Transform to match expected format
  const entries = attempts.map((attempt: any) => ({
    id: attempt._id.toString(),
    type: attempt.type,
    createdAt: attempt.createdAt,
    score: attempt.score,
    points: attempt.points,
    details: attempt.details || {}
  }));

  return NextResponse.json({ entries });
}

export async function POST(request: Request) {
  const auth = await getAuthUser();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { items } = await request.json();
  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "Missing items" }, { status: 400 });
  }

  const db = await getDb();
  const userId = new ObjectId(auth.id);
  const latest = await db
    .collection("workbook_entries")
    .find({ userId })
    .sort({ number: -1 })
    .limit(1)
    .project({ number: 1 })
    .toArray();
  const nextNumber = (latest[0]?.number || 0) + 1;

  const normalized = items.map((item: any) => {
    const text = String(item.text || "").trim();
    const sentenceCount = countSentences(text);
    return {
      wordId: String(item.wordId || ""),
      pl: String(item.pl || "").trim(),
      uk: String(item.uk || "").trim(),
      type: String(item.type || ""),
      text,
      sentenceCount,
      points: scoreForCount(sentenceCount)
    };
  });

  const formattedText = buildFormattedText(
    normalized.map((item) => ({
      word: item.pl,
      text: item.text
    }))
  );

  const totalPoints = normalized.reduce((sum, item) => sum + item.points, 0);

  const entry = {
    id: `workbook_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
    number: nextNumber,
    userId,
    createdAt: new Date(),
    items: normalized,
    totalPoints,
    formattedText
  };

  await db.collection("workbook_entries").insertOne(entry);

  if (totalPoints > 0) {
    await db.collection<UserDoc>("users").updateOne(
      { _id: userId },
      {
        $inc: {
          "stats.points": totalPoints
        }
      }
    );
  }

  for (const item of normalized) {
    if (!item.wordId) continue;
    const existing = await db.collection<UserDoc>("users").findOne(
      { _id: userId, "wordProgress.wordId": item.wordId },
      { projection: { "wordProgress.$": 1 } }
    );

    if (existing?.wordProgress?.length) {
      const lastSeen = existing.wordProgress[0]?.lastSeen ? new Date(existing.wordProgress[0].lastSeen) : null;
      const now = Date.now();
      const limit = 48 * 60 * 60 * 1000;
      if (lastSeen && now - lastSeen.getTime() < limit) {
        await db.collection<UserDoc>("users").updateOne(
          { _id: userId, "wordProgress.wordId": item.wordId },
          { $set: { "wordProgress.$.lastSeen": new Date() } }
        );
        continue;
      }

      await db.collection<UserDoc>("users").updateOne(
        { _id: userId, "wordProgress.wordId": item.wordId },
        {
          $inc: {
            "wordProgress.$.seenCount": 1,
            "wordProgress.$.correctCount": item.sentenceCount >= 3 ? 1 : 0
          },
          $set: {
            "wordProgress.$.lastSeen": new Date()
          }
        }
      );
    } else {
      await db.collection<UserDoc>("users").updateOne(
        { _id: userId },
        {
          $push: {
            wordProgress: {
              wordId: item.wordId,
              seenCount: 1,
              correctCount: item.sentenceCount >= 3 ? 1 : 0,
              lastSeen: new Date()
            }
          }
        }
      );
    }
  }

  return NextResponse.json({ entry: { ...entry, userId: undefined, _id: undefined }, totalPoints });
}
