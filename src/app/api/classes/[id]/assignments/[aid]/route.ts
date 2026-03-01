import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { ObjectId } from "mongodb";
import {
  isTeacherOfClass,
  canAccessClass,
  type Class,
  type Assignment,
  type Submission
} from "@/lib/classes";

// GET /api/classes/[id]/assignments/[aid] — Get single assignment with submission(s)
export async function GET(
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

    if (!canAccessClass(auth.id, classDoc)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const assignment = await db
      .collection<Assignment>("class_assignments")
      .findOne({ _id: assignmentId, classId });

    if (!assignment) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }

    const isTeacher = isTeacherOfClass(auth.id, classDoc);

    const assignmentData = {
      ...assignment,
      _id: assignment._id.toString(),
      classId: assignment.classId.toString(),
      teacherId: assignment.teacherId.toString()
    };

    if (isTeacher) {
      // Teacher sees all submissions
      const submissions = await db
        .collection<Submission>("class_submissions")
        .find({ assignmentId })
        .sort({ studentName: 1 })
        .toArray();

      return NextResponse.json({
        assignment: assignmentData,
        submissions: submissions.map(s => ({
          ...s,
          _id: s._id.toString(),
          assignmentId: s.assignmentId.toString(),
          classId: s.classId.toString(),
          studentId: s.studentId.toString()
        })),
        role: "teacher"
      });
    } else {
      // Student sees only their submission
      const submission = await db
        .collection<Submission>("class_submissions")
        .findOne({
          assignmentId,
          studentId: new ObjectId(auth.id)
        });

      return NextResponse.json({
        assignment: assignmentData,
        submission: submission
          ? {
              ...submission,
              _id: submission._id.toString(),
              assignmentId: submission.assignmentId.toString(),
              classId: submission.classId.toString(),
              studentId: submission.studentId.toString()
            }
          : null,
        role: "student"
      });
    }
  } catch (error) {
    console.error("Error fetching assignment:", error);
    return NextResponse.json(
      { error: "Failed to fetch assignment" },
      { status: 500 }
    );
  }
}
