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
    testTopic,
    testFocus,
    testGrammarTopics,
    testLevel,
    questions,
    answers,
    result,
    createdAt
  } = payload;

  if (!testTopic || !result) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const db = await getDb();

  const session = {
    userId: new ObjectId(auth.id),
    testTopic,
    testFocus: testFocus || [],
    testGrammarTopics: testGrammarTopics || [],
    testLevel: testLevel || "A2",
    questionsCount: Array.isArray(questions) ? questions.length : 0,
    questions: questions || [],
    answers: answers || {},
    result: {
      score: result.overall?.score01 || 0,
      points: result.overall?.pointsForRating || 0,
      feedback: result.overall?.feedback || "",
      items: result.items || [],
      suggestedVocab: result.suggestedVocab || []
    },
    createdAt: createdAt || new Date().toISOString()
  };

  const insertResult = await db.collection("test_ai_sessions").insertOne(session);

  return NextResponse.json({
    ok: true,
    sessionId: insertResult.insertedId.toString()
  });
}

export async function GET(request: Request) {
  const auth = await getAuthUser();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limit = Math.min(Number(searchParams.get("limit") || 20), 100);

  const db = await getDb();

  const sessions = await db
    .collection("test_ai_sessions")
    .find({ userId: new ObjectId(auth.id) })
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
      testTopic: s.testTopic,
      testFocus: s.testFocus,
      testGrammarTopics: s.testGrammarTopics,
      testLevel: s.testLevel,
      questionsCount: s.questionsCount,
      questions: s.questions,
      answers: s.answers,
      resultItems: s.result?.items || [],
      suggestedVocab: s.result?.suggestedVocab || [],
      score: s.result?.score || 0,
      points: s.result?.points || 0,
      feedback: s.result?.feedback || "",
      createdAt: s.createdAt
    })),
    stats
  });
}
