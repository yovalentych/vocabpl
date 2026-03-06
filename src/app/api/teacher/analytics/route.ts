import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { ObjectId } from "mongodb";

export const dynamic = "force-dynamic";

// GET /api/teacher/analytics - Агрегована аналітика вчителя по всіх класах
export async function GET() {
  const auth = await getAuthUser();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (auth.role !== "tutor" && auth.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const db = await getDb();
  const teacherId = new ObjectId(auth.id);

  try {
    // 1. Отримати всі класи вчителя
    const classes = await db
      .collection("classes")
      .find({ teacherId, archivedAt: { $exists: false } })
      .toArray();

    if (classes.length === 0) {
      return NextResponse.json({
        analytics: {
          totalClasses: 0,
          totalStudents: 0,
          totalAssignments: 0,
          gradedSubmissions: 0,
          completionRate: 0,
          averageScore: 0,
          activeStudents: 0,
          recentActivity: [],
        },
      });
    }

    const classIds = classes.map((c) => c._id);

    // 2. Отримати всі завдання
    const assignments = await db
      .collection("class_assignments")
      .find({ classId: { $in: classIds } })
      .toArray();

    // 3. Агрегувати submissions
    const submissionAgg = await db
      .collection("class_submissions")
      .aggregate([
        { $match: { classId: { $in: classIds } } },
        {
          $group: {
            _id: null,
            totalSubmissions: { $sum: 1 },
            gradedSubmissions: {
              $sum: { $cond: [{ $eq: ["$status", "graded"] }, 1, 0] },
            },
            submittedSubmissions: {
              $sum: {
                $cond: [{ $in: ["$status", ["submitted", "graded"]] }, 1, 0],
              },
            },
            avgScore: {
              $avg: {
                $cond: [
                  { $eq: ["$status", "graded"] },
                  "$percentage",
                  null,
                ],
              },
            },
            uniqueStudents: { $addToSet: "$studentId" },
          },
        },
      ])
      .toArray();

    // 4. Активні студенти (здали хоч щось за останні 30 днів)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const activeStudentAgg = await db
      .collection("class_submissions")
      .aggregate([
        {
          $match: {
            classId: { $in: classIds },
            updatedAt: { $gte: thirtyDaysAgo },
            status: { $in: ["submitted", "graded"] },
          },
        },
        { $group: { _id: "$studentId" } },
        { $count: "count" },
      ])
      .toArray();

    // 5. Остання активність (5 нещодавно оцінених)
    const recentGrades = await db
      .collection("class_submissions")
      .find({ classId: { $in: classIds }, status: "graded" })
      .sort({ updatedAt: -1 })
      .limit(5)
      .toArray();

    const assignmentMap = new Map(
      assignments.map((a) => [a._id.toString(), a])
    );
    const classMap = new Map(classes.map((c) => [c._id.toString(), c]));

    const recentActivity = recentGrades.map((sub) => {
      const assignment = assignmentMap.get(sub.assignmentId.toString());
      const cls = classMap.get(sub.classId.toString());
      return {
        studentName: sub.studentName,
        assignmentTitle: assignment?.title || "",
        className: cls?.name || "",
        percentage: sub.percentage,
        gradedAt: sub.updatedAt,
      };
    });

    // Totals
    const totalStudents = classes.reduce(
      (sum, c) => sum + (c.studentIds?.length || 0),
      0
    );
    const agg = submissionAgg[0] || {};
    const totalExpectedSubmissions =
      assignments.length * totalStudents || 1;
    const submittedCount = agg.submittedSubmissions || 0;
    const completionRate = Math.min(
      100,
      Math.round((submittedCount / totalExpectedSubmissions) * 100)
    );

    return NextResponse.json({
      analytics: {
        totalClasses: classes.length,
        totalStudents,
        totalAssignments: assignments.length,
        gradedSubmissions: agg.gradedSubmissions || 0,
        completionRate,
        averageScore: agg.avgScore ? Math.round(agg.avgScore) : 0,
        activeStudents: activeStudentAgg[0]?.count || 0,
        recentActivity,
      },
    });
  } catch (error) {
    console.error("[teacher-analytics] Error:", error);
    return NextResponse.json(
      { error: "Failed to load analytics" },
      { status: 500 }
    );
  }
}
