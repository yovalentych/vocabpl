import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { ObjectId } from "mongodb";

export async function GET(request: Request) {
  const auth = await getAuthUser();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limit = Math.min(Number(searchParams.get("limit") || 20), 100);
  const textId = searchParams.get("textId");

  const db = await getDb();

  const query: Record<string, unknown> = {
    userId: new ObjectId(auth.id)
  };

  if (textId) {
    query.textId = textId;
  }

  const sessions = await db
    .collection("comprehension_sessions")
    .find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();

  // Calculate stats
  const stats = sessions.length > 0 ? {
    totalAttempts: sessions.length,
    averageScore: sessions.reduce((sum, s) => sum + (s.result?.score || 0), 0) / sessions.length,
    averagePoints: sessions.reduce((sum, s) => sum + (s.result?.points || 0), 0) / sessions.length,
    bestScore: Math.max(...sessions.map(s => s.result?.score || 0)),
    bestPoints: Math.max(...sessions.map(s => s.result?.points || 0))
  } : null;

  return NextResponse.json({
    sessions: sessions.map(s => ({
      id: s._id.toString(),
      textId: s.textId,
      textTitle: s.textTitle,
      textLevel: s.textLevel,
      textTopic: s.textTopic,
      score: s.result?.score || 0,
      points: s.result?.points || 0,
      feedback: s.result?.feedback || "",
      questionsCount: Array.isArray(s.questions) ? s.questions.length : 0,
      questions: s.questions || [],
      answers: s.answers || [],
      resultItems: s.result?.items || [],
      suggestedVocab: s.result?.suggestedVocab || [],
      viewMode: s.viewMode || "dual",
      createdAt: s.createdAt
    })),
    stats
  });
}
