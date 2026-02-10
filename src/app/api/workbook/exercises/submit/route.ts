import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getDb } from "@/lib/db";

export async function POST(request: Request) {
  const auth = await getAuthUser();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { exerciseType, level, items, additionalData } = body;

    if (!exerciseType || !items || !Array.isArray(items)) {
      return NextResponse.json(
        { error: "Missing required fields: exerciseType, items" },
        { status: 400 }
      );
    }

    const db = await getDb();

    // Create submission
    const submission = {
      userId: auth.id,
      username: auth.username,
      exerciseType,
      level: level || "A2",
      items,
      additionalData: additionalData || {},
      status: "pending", // pending, reviewed, approved, rejected
      feedback: null,
      rating: null,
      reviewedBy: null,
      reviewedAt: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection("exercise_submissions").insertOne(submission);

    return NextResponse.json({
      success: true,
      submissionId: result.insertedId.toString(),
      message: "Submission received. You will get feedback soon."
    });
  } catch (error) {
    console.error("Submission error:", error);
    return NextResponse.json(
      { error: "Failed to submit exercise" },
      { status: 500 }
    );
  }
}
