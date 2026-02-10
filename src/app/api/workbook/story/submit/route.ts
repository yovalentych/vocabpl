import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getDb } from "@/lib/db";

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      title,
      text,
      level,
      score,
      points,
      feedback
    } = body;

    if (!title || !text || score === undefined || points === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const db = await getDb();

    // Save attempt
    const result = await db.collection("story_attempts").insertOne({
      userId: user.id,
      title,
      text,
      level: level || "A2",
      score,
      points,
      feedback: feedback || null,
      createdAt: new Date()
    });

    return NextResponse.json({
      success: true,
      attemptId: result.insertedId.toString()
    });
  } catch (error) {
    console.error("Story submit error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
