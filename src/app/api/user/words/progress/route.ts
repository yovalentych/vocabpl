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
  stats?: { wordsStudied?: number; sessions?: number; points?: number };
};

export async function GET() {
  const auth = await getAuthUser();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = await getDb();
  const user = await db.collection<UserDoc>("users").findOne(
    { _id: new ObjectId(auth.id) },
    { projection: { wordProgress: 1 } }
  );

  return NextResponse.json({ wordProgress: user?.wordProgress || [] });
}

export async function POST(request: Request) {
  const auth = await getAuthUser();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { wordId, correct = false, incrementSession = false } = await request.json();
  if (!wordId) return NextResponse.json({ error: "Missing wordId" }, { status: 400 });

  const db = await getDb();
  const userId = new ObjectId(auth.id);

  const existing = await db.collection<UserDoc>("users").findOne(
    { _id: userId, "wordProgress.wordId": wordId },
    { projection: { "wordProgress.$": 1 } }
  );

  if (existing?.wordProgress?.length) {
    const lastSeen = existing.wordProgress[0]?.lastSeen ? new Date(existing.wordProgress[0].lastSeen) : null;
    if (lastSeen && Number.isFinite(lastSeen.getTime())) {
      const now = Date.now();
      const diff = now - lastSeen.getTime();
      const limit = 48 * 60 * 60 * 1000;
      if (diff < limit) {
        return NextResponse.json({ ok: true, throttled: true });
      }
    }
    const inc: Record<string, number> = {
      "wordProgress.$.seenCount": 1
    };
    if (correct) {
      inc["wordProgress.$.correctCount"] = 1;
    }

    const points = 1 + (correct ? 1 : 0);
    await db.collection<UserDoc>("users").updateOne(
      { _id: userId, "wordProgress.wordId": wordId },
      {
        $inc: {
          ...inc,
          "stats.wordsStudied": 1,
          "stats.sessions": incrementSession ? 1 : 0,
          "stats.points": points
        },
        $set: {
          "wordProgress.$.lastSeen": new Date()
        }
      }
    );
  } else {
    const points = 1 + (correct ? 1 : 0);
    await db.collection<UserDoc>("users").updateOne(
      { _id: userId },
      {
        $push: {
          wordProgress: {
            wordId,
            seenCount: 1,
            correctCount: correct ? 1 : 0,
            lastSeen: new Date()
          }
        },
        $inc: {
          "stats.wordsStudied": 1,
          "stats.sessions": incrementSession ? 1 : 0,
          "stats.points": points
        }
      }
    );
  }

  return NextResponse.json({ ok: true });
}
