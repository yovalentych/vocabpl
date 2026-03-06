import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { ObjectId } from "mongodb";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await getAuthUser();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await getDb();
  const userId = new ObjectId(auth.id);
  const now = new Date();
  const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  try {
    // 1. Отримати всі класи де користувач студент
    const classes = await db
      .collection("classes")
      .find({
        studentIds: userId,
        archivedAt: { $exists: false },
      })
      .toArray();

    if (classes.length === 0) {
      return NextResponse.json({
        stats: {
          totalClasses: 0,
          activeAssignments: 0,
          upcomingDeadlines: 0,
          averageGrade: null,
        },
        classes: [],
        upcomingDeadlines: [],
        recentGrades: [],
      });
    }

    const classIds = classes.map((c) => c._id);

    // 2. Отримати всі assignments для цих класів
    const assignments = await db
      .collection("class_assignments")
      .find({
        classId: { $in: classIds },
        $or: [{ publishAt: { $exists: false } }, { publishAt: { $lte: now } }],
      })
      .toArray();

    // 3. Отримати всі submissions студента
    const submissions = await db
      .collection("class_submissions")
      .find({
        studentId: userId,
        classId: { $in: classIds },
      })
      .toArray();

    // 4. Агрегувати статистику
    let totalActiveAssignments = 0;
    let totalUpcomingDeadlines = 0;
    let totalGradeSum = 0;
    let totalGradedCount = 0;

    const upcomingDeadlines: any[] = [];
    const recentGrades: any[] = [];
    const classSummaries: any[] = [];

    for (const cls of classes) {
      const classAssignments = assignments.filter((a) =>
        a.classId.toString() === cls._id.toString()
      );
      const classSubmissions = submissions.filter((s) =>
        s.classId.toString() === cls._id.toString()
      );

      let completedInClass = 0;
      let gradeSum = 0;
      let gradedCount = 0;
      let upcomingInClass = 0;

      for (const assignment of classAssignments) {
        const submission = classSubmissions.find(
          (s) => s.assignmentId.toString() === assignment._id.toString()
        );

        // Рахувати completed
        if (submission?.status === "submitted" || submission?.status === "graded") {
          completedInClass++;
        }

        // Рахувати grades
        if (submission?.status === "graded" && submission.percentage != null) {
          gradeSum += submission.percentage;
          gradedCount++;
          totalGradeSum += submission.percentage;
          totalGradedCount++;

          // Додати до recentGrades
          recentGrades.push({
            assignmentId: assignment._id.toString(),
            assignmentTitle: assignment.title,
            className: cls.name,
            classId: cls._id.toString(),
            score: submission.score || 0,
            percentage: submission.percentage,
            gradedAt: submission.feedback?.gradedAt || submission.updatedAt,
          });
        }

        // Рахувати upcoming deadlines
        if (assignment.dueAt && new Date(assignment.dueAt) <= weekFromNow) {
          const status = submission
            ? submission.status
            : "not_started";

          if (status !== "submitted" && status !== "graded") {
            upcomingInClass++;
            totalUpcomingDeadlines++;

            const daysRemaining = Math.ceil(
              (new Date(assignment.dueAt).getTime() - now.getTime()) / (24 * 60 * 60 * 1000)
            );

            upcomingDeadlines.push({
              assignmentId: assignment._id.toString(),
              assignmentTitle: assignment.title,
              className: cls.name,
              classId: cls._id.toString(),
              dueAt: assignment.dueAt,
              status,
              daysRemaining,
            });
          }
        }

        // Рахувати active assignments (не здано)
        if (!submission || (submission.status !== "submitted" && submission.status !== "graded")) {
          totalActiveAssignments++;
        }
      }

      classSummaries.push({
        _id: cls._id.toString(),
        name: cls.name,
        teacherName: cls.teacherName,
        totalAssignments: classAssignments.length,
        completedAssignments: completedInClass,
        myAverageGrade: gradedCount > 0 ? Math.round(gradeSum / gradedCount) : null,
        upcomingDeadlines: upcomingInClass,
      });
    }

    // 5. Сортувати та обмежити
    upcomingDeadlines.sort((a, b) => a.daysRemaining - b.daysRemaining);
    recentGrades.sort((a, b) =>
      new Date(b.gradedAt).getTime() - new Date(a.gradedAt).getTime()
    );

    return NextResponse.json({
      stats: {
        totalClasses: classes.length,
        activeAssignments: totalActiveAssignments,
        upcomingDeadlines: totalUpcomingDeadlines,
        averageGrade: totalGradedCount > 0
          ? Math.round(totalGradeSum / totalGradedCount)
          : null,
      },
      classes: classSummaries,
      upcomingDeadlines: upcomingDeadlines.slice(0, 10),
      recentGrades: recentGrades.slice(0, 5),
    });
  } catch (error) {
    console.error("[student-dashboard] Error:", error);
    return NextResponse.json(
      { error: "Failed to load dashboard" },
      { status: 500 }
    );
  }
}
