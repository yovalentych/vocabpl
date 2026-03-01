import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { ObjectId } from "mongodb";
import { isTeacherOfClass } from "@/lib/classes";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await getAuthUser();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const classId = params.id;
  if (!classId || !ObjectId.isValid(classId)) {
    return NextResponse.json({ error: "Invalid class ID" }, { status: 400 });
  }

  try {
    const db = await getDb();
    const classObjectId = new ObjectId(classId);

    // Get class and verify teacher access
    const classDoc = await db.collection("classes").findOne({ _id: classObjectId });
    if (!classDoc) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    if (!isTeacherOfClass(auth.id, classDoc as any)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get all assignments for this class
    const assignments = await db
      .collection("class_assignments")
      .find({ classId: classObjectId })
      .toArray();

    const assignmentIds = assignments.map(a => a._id);

    // Get all submissions for these assignments
    const submissions = await db
      .collection("class_submissions")
      .find({ assignmentId: { $in: assignmentIds } })
      .toArray();

    // Calculate student statistics
    const studentStats = new Map<string, {
      studentId: string;
      studentName: string;
      totalAssignments: number;
      completedAssignments: number;
      averageScore: number;
      totalScore: number;
      scores: number[];
    }>();

    classDoc.students.forEach((student: any) => {
      studentStats.set(student.id, {
        studentId: student.id,
        studentName: student.name || student.username,
        totalAssignments: assignments.length,
        completedAssignments: 0,
        averageScore: 0,
        totalScore: 0,
        scores: []
      });
    });

    submissions.forEach((sub: any) => {
      const stat = studentStats.get(sub.studentId.toString());
      if (stat && sub.status === 'graded' && sub.percentage != null) {
        stat.completedAssignments++;
        stat.scores.push(sub.percentage);
        stat.totalScore += sub.percentage;
      }
    });

    // Calculate averages
    studentStats.forEach(stat => {
      if (stat.scores.length > 0) {
        stat.averageScore = Math.round(stat.totalScore / stat.scores.length);
      }
    });

    // Calculate assignment statistics
    const assignmentStats = assignments.map((assignment: any) => {
      const assignmentSubs = submissions.filter(
        (s: any) => s.assignmentId.toString() === assignment._id.toString()
      );
      const gradedSubs = assignmentSubs.filter(
        (s: any) => s.status === 'graded' && s.percentage != null
      );

      const averageScore = gradedSubs.length > 0
        ? Math.round(
            gradedSubs.reduce((sum: number, s: any) => sum + (s.percentage || 0), 0) / gradedSubs.length
          )
        : 0;

      return {
        assignmentId: assignment._id.toString(),
        title: assignment.title,
        totalSubmissions: assignmentSubs.length,
        gradedSubmissions: gradedSubs.length,
        averageScore,
        difficulty: averageScore < 50 ? 'hard' : averageScore < 70 ? 'medium' : 'easy'
      };
    });

    // Top performers (sorted by average score)
    const topStudents = Array.from(studentStats.values())
      .filter(s => s.completedAssignments > 0)
      .sort((a, b) => b.averageScore - a.averageScore)
      .slice(0, 5);

    // Students needing help (completed some assignments but low scores)
    const studentsNeedingHelp = Array.from(studentStats.values())
      .filter(s => s.completedAssignments > 0 && s.averageScore < 60)
      .sort((a, b) => a.averageScore - b.averageScore)
      .slice(0, 5);

    // Most difficult assignments
    const difficultAssignments = assignmentStats
      .filter(a => a.gradedSubmissions > 0)
      .sort((a, b) => a.averageScore - b.averageScore)
      .slice(0, 5);

    // Score distribution (buckets: 0-20, 21-40, 41-60, 61-80, 81-100)
    const scoreDistribution = {
      '0-20': 0,
      '21-40': 0,
      '41-60': 0,
      '61-80': 0,
      '81-100': 0
    };

    submissions.forEach((sub: any) => {
      if (sub.status === 'graded' && sub.percentage != null) {
        const score = sub.percentage;
        if (score <= 20) scoreDistribution['0-20']++;
        else if (score <= 40) scoreDistribution['21-40']++;
        else if (score <= 60) scoreDistribution['41-60']++;
        else if (score <= 80) scoreDistribution['61-80']++;
        else scoreDistribution['81-100']++;
      }
    });

    // Overall class statistics
    const gradedSubmissions = submissions.filter(
      (s: any) => s.status === 'graded' && s.percentage != null
    );
    const classAverageScore = gradedSubmissions.length > 0
      ? Math.round(
          gradedSubmissions.reduce((sum: number, s: any) => sum + (s.percentage || 0), 0) /
            gradedSubmissions.length
        )
      : 0;

    const completionRate = assignments.length > 0 && classDoc.students.length > 0
      ? Math.round(
          (submissions.filter((s: any) => s.status === 'graded').length /
            (assignments.length * classDoc.students.length)) *
            100
        )
      : 0;

    return NextResponse.json({
      statistics: {
        classAverageScore,
        completionRate,
        totalStudents: classDoc.students.length,
        totalAssignments: assignments.length,
        totalSubmissions: submissions.length,
        gradedSubmissions: gradedSubmissions.length,
        topStudents,
        studentsNeedingHelp,
        difficultAssignments,
        scoreDistribution,
        allStudentStats: Array.from(studentStats.values()).sort((a, b) =>
          b.averageScore - a.averageScore
        )
      }
    });
  } catch (error) {
    console.error("Error fetching class statistics:", error);
    return NextResponse.json(
      { error: "Failed to fetch statistics" },
      { status: 500 }
    );
  }
}
