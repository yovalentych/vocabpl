import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { ObjectId } from "mongodb";
import {
  isStudentOfClass,
  type Class,
  type Assignment,
  type Submission
} from "@/lib/classes";
import { notifySubmissionReceived } from "@/lib/notifications";

// POST /api/classes/[id]/assignments/[aid]/submit — Student submits exercise results
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
    const assignmentId = new ObjectId(params.aid);
    const db = await getDb();

    const classDoc = await db.collection<Class>("classes").findOne({ _id: classId });
    if (!classDoc) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    if (!isStudentOfClass(auth.id, classDoc)) {
      return NextResponse.json({ error: "Only students can submit" }, { status: 403 });
    }

    const assignment = await db
      .collection<Assignment>("class_assignments")
      .findOne({ _id: assignmentId, classId });

    if (!assignment) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }

    const studentId = new ObjectId(auth.id);

    // Find the student's submission
    const submission = await db
      .collection<Submission>("class_submissions")
      .findOne({ assignmentId, studentId });

    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    // Check if already submitted/graded (unless retake allowed)
    if (
      (submission.status === "submitted" || submission.status === "graded") &&
      !assignment.settings.allowRetake
    ) {
      return NextResponse.json(
        { error: "Already submitted and retake is not allowed" },
        { status: 400 }
      );
    }

    if (
      assignment.settings.allowRetake &&
      assignment.settings.maxAttempts &&
      submission.attemptNumber >= assignment.settings.maxAttempts
    ) {
      return NextResponse.json(
        { error: "Maximum attempts reached" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { score, points, exerciseData } = body;

    const now = new Date();
    const isLate = assignment.dueAt ? now > new Date(assignment.dueAt as any) : false;
    const percentage = Math.round((score ?? 0) * 100);
    const passed = assignment.passingScore
      ? (score ?? 0) * (assignment.pointsTotal ?? 100) >= assignment.passingScore
      : percentage >= 60;

    const isFirstSubmission =
      submission.status === "not_started" || submission.status === "in_progress";

    await db.collection("class_submissions").updateOne(
      { _id: submission._id },
      {
        $set: {
          status: "submitted",
          submittedAt: now,
          score: points ?? 0,
          percentage,
          passed,
          exerciseData: exerciseData || undefined,
          isLate,
          attemptNumber: submission.attemptNumber + 1,
          updatedAt: now
        }
      }
    );

    // Update class stats if first submission
    if (isFirstSubmission) {
      await db.collection("classes").updateOne(
        { _id: classId },
        {
          $inc: { "stats.completedAssignments": 1 },
          $set: { updatedAt: now }
        }
      );
    }

    // Створюємо notification для викладача
    try {
      const teacher = await db.collection("users").findOne({ _id: assignment.teacherId });
      if (teacher) {
        const student = classDoc.students.find(s => s.id === auth.id);
        await notifySubmissionReceived({
          teacherId: assignment.teacherId,
          teacherRole: teacher.role || "user",
          studentId,
          studentName: student?.name || student?.username || auth.username,
          classId,
          assignmentId,
          assignmentTitle: assignment.title,
          submissionId: submission._id
        });
      }
    } catch (notifError) {
      console.error("Failed to create notification:", notifError);
    }

    return NextResponse.json({
      success: true,
      submission: {
        _id: submission._id.toString(),
        status: "submitted",
        score: points ?? 0,
        percentage,
        passed
      }
    });
  } catch (error) {
    console.error("Error submitting assignment:", error);
    return NextResponse.json(
      { error: "Failed to submit assignment" },
      { status: 500 }
    );
  }
}
