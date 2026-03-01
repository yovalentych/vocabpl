import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { ObjectId } from "mongodb";
import {
  isTeacherOfClass,
  type Class,
  type Submission
} from "@/lib/classes";

// GET /api/classes/[id]/assignments/[aid]/submissions/[sid] — Get a submission
export async function GET(
  request: Request,
  { params }: { params: { id: string; aid: string; sid: string } }
) {
  const auth = await getAuthUser();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const classId = new ObjectId(params.id);
    const submissionId = new ObjectId(params.sid);
    const db = await getDb();

    const classDoc = await db.collection<Class>("classes").findOne({ _id: classId });
    if (!classDoc) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    if (!isTeacherOfClass(auth.id, classDoc)) {
      return NextResponse.json({ error: "Only teacher can view submissions" }, { status: 403 });
    }

    const submission = await db
      .collection<Submission>("class_submissions")
      .findOne({ _id: submissionId, classId });

    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    return NextResponse.json({
      submission: {
        ...submission,
        _id: submission._id.toString(),
        assignmentId: submission.assignmentId.toString(),
        classId: submission.classId.toString(),
        studentId: submission.studentId.toString()
      }
    });
  } catch (error) {
    console.error("Error fetching submission:", error);
    return NextResponse.json(
      { error: "Failed to fetch submission" },
      { status: 500 }
    );
  }
}

// PATCH /api/classes/[id]/assignments/[aid]/submissions/[sid] — Teacher grades a submission
export async function PATCH(
  request: Request,
  { params }: { params: { id: string; aid: string; sid: string } }
) {
  const auth = await getAuthUser();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const classId = new ObjectId(params.id);
    const submissionId = new ObjectId(params.sid);
    const db = await getDb();

    const classDoc = await db.collection<Class>("classes").findOne({ _id: classId });
    if (!classDoc) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    if (!isTeacherOfClass(auth.id, classDoc)) {
      return NextResponse.json({ error: "Only teacher can grade" }, { status: 403 });
    }

    const submission = await db
      .collection<Submission>("class_submissions")
      .findOne({ _id: submissionId, classId });

    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    const body = await request.json();
    const { feedback, score, status } = body;

    const now = new Date();
    const updateFields: any = { updatedAt: now };

    if (feedback?.comment !== undefined) {
      updateFields.feedback = {
        comment: feedback.comment,
        gradedAt: now,
        gradedBy: new ObjectId(auth.id)
      };
    }

    if (score !== undefined) {
      updateFields.score = score;
    }

    if (status === "graded") {
      updateFields.status = "graded";
    }

    await db.collection("class_submissions").updateOne(
      { _id: submissionId },
      { $set: updateFields }
    );

    return NextResponse.json({
      success: true,
      submission: {
        _id: submission._id.toString(),
        ...updateFields,
        feedback: updateFields.feedback
          ? {
              ...updateFields.feedback,
              gradedBy: updateFields.feedback.gradedBy?.toString()
            }
          : submission.feedback
      }
    });
  } catch (error) {
    console.error("Error grading submission:", error);
    return NextResponse.json(
      { error: "Failed to grade submission" },
      { status: 500 }
    );
  }
}
