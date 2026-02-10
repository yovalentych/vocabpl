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
      prompt,
      level,
      imageUrl,
      imageAlt,
      description,
      score,
      points,
      feedback,
      improvedPl,
      translationUk
    } = body;

    if (!prompt || !level || !imageUrl || !description || score === undefined || points === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const db = await getDb();

    // Save attempt
    const result = await db.collection("describe_attempts").insertOne({
      userId: user.id,
      prompt,
      level,
      imageUrl,
      imageAlt: imageAlt || null,
      description,
      score,
      points,
      feedback: feedback || null,
      improvedPl: improvedPl || null,
      translationUk: translationUk || null,
      createdAt: new Date()
    });

    return NextResponse.json({
      success: true,
      attemptId: result.insertedId.toString()
    });
  } catch (error) {
    console.error("Describe submit error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
