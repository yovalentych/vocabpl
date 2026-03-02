import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getAuthUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { canAccessClass, type Class, type Assignment, type Submission } from "@/lib/classes";

// GET /api/classes/[id]/student/stats - Get student's stats for this class
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

    // Calculate stats
    const totalAssignments = assignedAssignments.length;
    const completedAssignments = submissions.filter(s =>
      s.status === 'submitted' || s.status === 'graded'
    ).length;
    const gradedSubmissions = submissions.filter(s => s.status === 'graded');
    const gradedAssignments = gradedSubmissions.length;

    // Calculate average score using percentage from submissions
    const totalPercentage = gradedSubmissions.reduce((sum, s) => sum + (s.percentage || 0), 0);
    const averageScore = gradedAssignments > 0 ? totalPercentage / gradedAssignments : 0;

    // Get upcoming deadlines (assignments with due dates in the future)
    const upcomingDeadlines = assignedAssignments
      .filter(a => a.dueAt && new Date(a.dueAt) > now)
      .sort((a, b) => new Date(a.dueAt!).getTime() - new Date(b.dueAt!).getTime())
      .slice(0, 5)
      .map(a => {
        const submission = submissions.find(s => s.assignmentId.toString() === a._id.toString());
        return {
          id: a._id.toString(),
          title: a.title,
          dueAt: a.dueAt,
          status: submission?.status || 'not_started'
        };
      });

    // Get recent grades (recently graded submissions)
    const recentGrades = gradedSubmissions
      .sort((a, b) => {
        const dateA = a.feedback?.gradedAt || a.updatedAt;
        const dateB = b.feedback?.gradedAt || b.updatedAt;
        return dateB.getTime() - dateA.getTime();
      })
      .slice(0, 5)
      .map(s => {
        const assignment = assignedAssignments.find(a => a._id.toString() === s.assignmentId.toString());
        const maxScore = assignment?.pointsTotal || 100;
        return {
          id: s._id?.toString(),
          assignmentTitle: assignment?.title || 'Unknown',
          score: s.score || 0,
          maxScore: maxScore,
          gradedAt: s.feedback?.gradedAt || s.updatedAt
        };
      });

    return NextResponse.json({
      stats: {
        totalAssignments,
        completedAssignments,
        gradedAssignments,
        averageScore: Math.round(averageScore * 10) / 10,
        upcomingDeadlines,
        recentGrades
      }
    });
  } catch (error) {
    console.error("Error fetching student stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch student stats" },
      { status: 500 }
    );
  }
}
