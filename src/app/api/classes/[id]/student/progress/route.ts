import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getAuthUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { canAccessClass, type Class, type Assignment, type Submission } from "@/lib/classes";

// GET /api/classes/[id]/student/progress - Get student's full progress for this class
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
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

    // Check if user has access to this class
    if (!canAccessClass(auth.id, classDoc)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const studentId = new ObjectId(auth.id);
    const now = new Date();

    // Get all assignments for this class that are visible to student
    const allAssignments = await db
      .collection<Assignment>("class_assignments")
      .find({
        classId,
        $or: [
          { publishAt: { $exists: false } },
          { publishAt: { $lte: now } }
        ]
      })
      .sort({ createdAt: -1 })
      .toArray();

    // Filter assignments assigned to this student
    const assignedAssignments = allAssignments.filter(a => {
      if (a.assignedTo === 'all') return true;
      if (Array.isArray(a.assignedTo)) {
        return a.assignedTo.some((id: any) => id.toString() === auth.id);
      }
      return false;
    });

    const assignmentIds = assignedAssignments.map(a => a._id);

    // Get all submissions for this student in this class
    const submissions = await db
      .collection<Submission>("class_submissions")
      .find({
        classId,
        studentId,
        assignmentId: { $in: assignmentIds }
      })
      .toArray();

    // Create a map of submissions by assignmentId
    const submissionMap = new Map(
      submissions.map(s => [s.assignmentId.toString(), s])
    );

    // Combine assignments with submissions
    const assignmentsWithProgress = assignedAssignments.map(assignment => {
      const submission = submissionMap.get(assignment._id.toString());

      return {
        assignmentId: assignment._id.toString(),
        title: assignment.title,
        type: assignment.type,
        dueAt: assignment.dueAt,
        status: submission?.status || 'not_started',
        score: submission?.score,
        percentage: submission?.percentage,
        maxScore: assignment.pointsTotal || 100,
        submittedAt: submission?.submittedAt,
        gradedAt: submission?.feedback?.gradedAt || submission?.updatedAt,
        feedback: submission?.feedback?.comment,
        isLate: submission?.isLate || false
      };
    });

    return NextResponse.json({
      assignments: assignmentsWithProgress
    });
  } catch (error) {
    console.error("Error fetching student progress:", error);
    return NextResponse.json(
      { error: "Failed to fetch student progress" },
      { status: 500 }
    );
  }
}
