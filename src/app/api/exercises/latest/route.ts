import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { ObjectId } from "mongodb";

export const dynamic = "force-dynamic";

// GET /api/exercises/latest?type=sentences&since=1709301234567
// Returns the most recent exercise_attempt for this user
export async function GET(request: Request) {
  const auth = await getAuthUser();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const since = searchParams.get("since");

  if (!type) {
    return NextResponse.json({ error: "Missing type parameter" }, { status: 400 });
  }

  const db = await getDb();

  const query: any = {
    userId: new ObjectId(auth.id),
    type
  };

  if (since) {
    query.createdAt = { $gte: new Date(Number(since)) };
  }

  const attempt = await db
    .collection("exercise_attempts")
    .findOne(query, { sort: { createdAt: -1 } });

  if (!attempt) {
    return NextResponse.json({ attempt: null });
  }

  return NextResponse.json({
    attempt: {
      score: attempt.score ?? 0,
      points: attempt.points ?? 0,
      createdAt: attempt.createdAt
    }
  });
}
