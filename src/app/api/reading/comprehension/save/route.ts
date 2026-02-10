import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { ObjectId } from "mongodb";

export async function POST(request: Request) {
  const auth = await getAuthUser();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json();
  const {
    textId,
    textTitle,
    textLevel,
    textTopic,
    questions,
    answers,
    result,
    viewMode
  } = payload;

  if (!textId || !result) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const db = await getDb();

  const session = {
    userId: new ObjectId(auth.id),
    textId,
    textTitle: textTitle || { pl: "Unknown", uk: "Невідомо" },
    textLevel: textLevel || "A2",
    textTopic: textTopic || "",
    questions: questions || [],
    answers: answers || [],
    result: {
      score: result.overall?.score01 || 0,
      points: result.overall?.pointsForRating || 0,
      feedback: result.overall?.feedback || "",
      items: result.items || [],
      suggestedVocab: result.suggestedVocab || []
    },
    viewMode: viewMode || "dual",
    createdAt: new Date()
  };

  const insertResult = await db.collection("comprehension_sessions").insertOne(session);

  return NextResponse.json({
    ok: true,
    sessionId: insertResult.insertedId.toString()
  });
}
