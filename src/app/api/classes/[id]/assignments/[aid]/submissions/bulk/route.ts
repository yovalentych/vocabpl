import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { ObjectId } from "mongodb";
import {
  isTeacherOfClass,
  type Class
} from "@/lib/classes";

// POST /api/classes/[id]/assignments/[aid]/submissions/bulk - Bulk grade submissions
export async function POST(
  request: Request,
  { params }: { params: { id: string; aid: string } }
) {
  const auth = await getAuthUser();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const classId = new ObjectId(params.id);
    const db = await getDb();

    const classDoc = await db.collection<Class>("classes").findOne({ _id: classId });
    if (!classDoc) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    // Only teacher can grade submissions
    if (!isTeacherOfClass(auth.id, classDoc)) {
      return NextResponse.json(
        { error: "Only teacher can grade submissions" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { submissionIds, feedback, score, status } = body;

    if (!submissionIds || !Array.isArray(submissionIds) || submissionIds.length === 0) {
      return NextResponse.json(
        { error: "submissionIds array is required" },
        { status: 400 }
      );
    }

    // Convert to ObjectIds
    const objectIds = submissionIds.map((id: string) => new ObjectId(id));

    // Build update fields
    const updateFields: any = {
      updatedAt: new Date()
    };

    if (feedback !== undefined) {
      updateFields.teacherFeedback = feedback;
    }

    if (score !== undefined && score !== null) {
      updateFields.scoreOverride = score;
    }

    if (status === "graded") {
      updateFields.status = "graded";
      updateFields.gradedAt = new Date();
    }

    // Update multiple submissions
    const result = await db.collection("class_submissions").updateMany(
      {
        _id: { $in: objectIds },
        classId
      },
      { $set: updateFields }
    );

    return NextResponse.json({
      success: true,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error("Error bulk grading submissions:", error);
    return NextResponse.json(
      { error: "Failed to bulk grade submissions" },
      { status: 500 }
    );
  }
}
