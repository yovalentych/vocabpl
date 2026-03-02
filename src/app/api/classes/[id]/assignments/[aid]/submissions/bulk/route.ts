import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { ObjectId } from "mongodb";
import {
  isTeacherOfClass,
  type Class
} from "@/lib/classes";
import { notifyAssignmentBulkGraded } from "@/lib/notifications";

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

    // Створюємо notifications для студентів якщо graded
    if (status === "graded") {
      try {
        const assignmentId = new ObjectId(params.aid);
        const assignment = await db.collection("class_assignments").findOne({ _id: assignmentId });

        if (assignment) {
          const submissions = await db.collection("class_submissions")
            .find({ _id: { $in: objectIds } })
            .toArray();

          const studentIds = submissions.map(s => s.studentId as ObjectId);
          const students = await db.collection("users")
            .find({ _id: { $in: studentIds } })
            .toArray();

          const studentIdsWithRoles = students.map(s => ({
            id: s._id as ObjectId,
            role: s.role || "user" as "admin" | "tutor" | "user"
          }));

          await notifyAssignmentBulkGraded({
            studentIds: studentIdsWithRoles,
            classId,
            assignmentId,
            assignmentTitle: assignment.title,
            teacherName: classDoc.teacherName
          });
        }
      } catch (notifError) {
        console.error("Failed to create notifications:", notifError);
      }
    }

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
