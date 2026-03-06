import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getAuthUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { isTeacherOfClass, type Class } from "@/lib/classes";
import { notifyAssignmentGraded } from "@/lib/notifications";

export const dynamic = "force-dynamic";

// GET /api/classes/[id]/gradebook — Журнал оцінок класу (тільки для вчителя)
export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await getAuthUser();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const classId = new ObjectId(params.id);
    const db = await getDb();

    const classDoc = await db.collection<Class>("classes").findOne({ _id: classId });
    if (!classDoc) return NextResponse.json({ error: "Class not found" }, { status: 404 });

    if (!isTeacherOfClass(auth.id, classDoc)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const now = new Date();

    const students = classDoc.students || [];

    const assignments = await db
      .collection("class_assignments")
      .find({
        classId,
        $or: [{ publishAt: { $exists: false } }, { publishAt: { $lte: now } }],
      })
      .sort({ createdAt: 1 })
      .project({ title: 1, maxScore: 1, dueDate: 1, createdAt: 1 })
      .toArray();

    const submissions = await db
      .collection("class_submissions")
      .find({ classId })
      .project({ studentId: 1, assignmentId: 1, status: 1, score: 1, percentage: 1, submittedAt: 1 })
      .toArray();

    const submissionMap = new Map<string, any>();
    for (const sub of submissions) {
      const key = `${sub.studentId}_${sub.assignmentId.toString()}`;
      submissionMap.set(key, sub);
    }

    const grades: Record<string, Record<string, {
      status: string;
      score?: number;
      percentage?: number;
      submittedAt?: Date;
      submissionId?: string;
    }>> = {};

    for (const student of students) {
      grades[student.id] = {};
      for (const assignment of assignments) {
        const key = `${student.id}_${assignment._id.toString()}`;
        const sub = submissionMap.get(key);
        if (sub) {
          grades[student.id][assignment._id.toString()] = {
            status: sub.status,
            score: sub.score,
            percentage: sub.percentage,
            submittedAt: sub.submittedAt,
            submissionId: sub._id.toString(),
          };
        } else {
          grades[student.id][assignment._id.toString()] = { status: "not_started" };
        }
      }
    }

    return NextResponse.json({
      students: students.map(s => ({ id: s.id, name: s.name || s.username, username: s.username })),
      assignments: assignments.map(a => ({
        id: a._id.toString(),
        title: a.title,
        maxScore: a.maxScore,
        dueDate: a.dueDate,
      })),
      grades,
    });
  } catch (error) {
    console.error("[gradebook GET] Error:", error);
    return NextResponse.json({ error: "Failed to load gradebook" }, { status: 500 });
  }
}

// PATCH /api/classes/[id]/gradebook — Quick inline grade from gradebook
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await getAuthUser();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const classId = new ObjectId(params.id);
    const db = await getDb();

    const classDoc = await db.collection<Class>("classes").findOne({ _id: classId });
    if (!classDoc) return NextResponse.json({ error: "Class not found" }, { status: 404 });

    if (!isTeacherOfClass(auth.id, classDoc)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { submissionId, score, feedback } = await request.json();
    if (!submissionId) return NextResponse.json({ error: "submissionId required" }, { status: 400 });

    const submission = await db.collection("class_submissions").findOne({
      _id: new ObjectId(submissionId),
      classId,
    });
    if (!submission) return NextResponse.json({ error: "Submission not found" }, { status: 404 });

    const assignment = await db.collection("class_assignments").findOne({
      _id: submission.assignmentId,
    });

    const maxScore = assignment?.maxScore;
    let percentage: number | undefined;
    if (score !== undefined) {
      percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : score;
    }

    const now = new Date();
    const updateFields: any = {
      status: "graded",
      updatedAt: now,
    };
    if (score !== undefined) {
      updateFields.score = score;
      if (percentage !== undefined) updateFields.percentage = percentage;
    }
    if (feedback) {
      updateFields.feedback = {
        comment: feedback,
        gradedAt: now,
        gradedBy: new ObjectId(auth.id),
      };
    }

    await db.collection("class_submissions").updateOne(
      { _id: new ObjectId(submissionId) },
      { $set: updateFields }
    );

    // Notify student
    try {
      if (assignment) {
        const student = await db.collection("users").findOne({ _id: submission.studentId });
        if (student) {
          await notifyAssignmentGraded({
            studentId: submission.studentId,
            studentRole: student.role || "user",
            classId,
            assignmentId: submission.assignmentId,
            assignmentTitle: assignment.title,
            grade: score,
            teacherName: classDoc.teacherName,
          });
        }
      }
    } catch (notifError) {
      console.error("Failed to send notification:", notifError);
    }

    return NextResponse.json({ success: true, score, percentage });
  } catch (error) {
    console.error("[gradebook PATCH] Error:", error);
    return NextResponse.json({ error: "Failed to grade" }, { status: 500 });
  }
}
