import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getAuthUser();
  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = await getDb();

    // Get all attempts for user
    const attempts = await db
      .collection("describe_attempts")
      .find({ userId: user.id })
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();

    // Calculate stats
    const totalAttempts = attempts.length;
    const scores = attempts.map((a) => a.points);
    const averageScore = totalAttempts > 0
      ? scores.reduce((sum, s) => sum + s, 0) / totalAttempts
      : 0;
    const bestScore = totalAttempts > 0 ? Math.max(...scores) : 0;
    const accuracy = totalAttempts > 0 ? Math.round((averageScore / 10) * 100) : 0;

    return NextResponse.json({
      attempts: attempts.map((a) => ({
        _id: a._id.toString(),
        prompt: a.prompt,
        level: a.level,
        imageUrl: a.imageUrl,
        imageAlt: a.imageAlt,
        description: a.description,
        score: a.score,
        points: a.points,
        feedback: a.feedback,
        improvedPl: a.improvedPl,
        translationUk: a.translationUk,
        createdAt: a.createdAt.toISOString()
      })),
      stats: {
        totalAttempts,
        averageScore: Number(averageScore.toFixed(1)),
        bestScore,
        accuracy
      }
    });
  } catch (error) {
    console.error("Describe attempts error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
