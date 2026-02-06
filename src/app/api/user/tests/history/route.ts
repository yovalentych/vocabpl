import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getAuthUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
export const dynamic = "force-dynamic";


type TestHistoryEntry = {
  testId: string;
  correct: number;
  total: number;
  completedAt: Date;
};

type UserDoc = {
  _id: ObjectId;
  testHistory?: TestHistoryEntry[];
  stats?: { testsTaken?: number; points?: number };
};

export async function GET() {
  const auth = await getAuthUser();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = await getDb();
  const user = await db.collection<UserDoc>("users").findOne(
    { _id: new ObjectId(auth.id) },
    { projection: { testHistory: 1 } }
  );

  return NextResponse.json({ testHistory: user?.testHistory || [] });
}

export async function POST(request: Request) {
  const auth = await getAuthUser();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { testId, correct, total } = await request.json();
  if (!testId || typeof correct !== "number" || typeof total !== "number") {
    return NextResponse.json({ error: "Missing test data" }, { status: 400 });
  }

  const db = await getDb();
  const entry: TestHistoryEntry = {
    testId,
    correct,
    total,
    completedAt: new Date()
  };

  const points = Math.max(correct, 0) * 5;

  await db.collection<UserDoc>("users").updateOne(
    { _id: new ObjectId(auth.id) },
    {
      $push: { testHistory: entry },
      $inc: { "stats.testsTaken": 1, "stats.points": points }
    }
  );

  return NextResponse.json({ ok: true });
}
