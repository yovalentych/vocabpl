import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { ObjectId } from "mongodb";

export const dynamic = "force-dynamic";

// GET /api/student/assignments - Отримати всі завдання студента з усіх класів
export async function GET(request: Request) {
  const auth = await getAuthUser();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const statusFilter = searchParams.get("status"); // 'pending' | 'submitted' | 'graded' | null

  const db = await getDb();
  const userId = new ObjectId(auth.id);
  const now = new Date();

  try {
    // 1. Знайти всі класи де користувач студент
    const classes = await db
      .collection("classes")
      .find({ studentIds: userId, archivedAt: { $exists: false } })
      .toArray();

    if (classes.length === 0) {
      return NextResponse.json({ assignments: [] });
    }

    const classIds = classes.map((c) => c._id);
    const classMap = new Map(classes.map((c) => [c._id.toString(), c]));

    // 2. Отримати всі видимі завдання
    const assignments = await db
      .collection("class_assignments")
      .find({
        classId: { $in: classIds },
        $or: [{ publishAt: { $exists: false } }, { publishAt: { $lte: now } }],
      })
      .sort({ createdAt: -1 })
      .toArray();

    if (assignments.length === 0) {
      return NextResponse.json({ assignments: [] });
    }

    // 3. Отримати submissions студента
    const assignmentIds = assignments.map((a) => a._id);
    const submissions = await db
      .collection("class_submissions")
      .find({ studentId: userId, assignmentId: { $in: assignmentIds } })
      .toArray();

    const submissionMap = new Map(
      submissions.map((s) => [s.assignmentId.toString(), s])
    );

    // 4. Об'єднати і додати інформацію
    const result = assignments.map((a) => {
      const submission = submissionMap.get(a._id.toString());
      const cls = classMap.get(a.classId.toString());
      const status = submission?.status || "not_started";

      return {
        _id: a._id.toString(),
        assignmentId: a._id.toString(),
        title: a.title,
        type: a.type,
        exerciseType: a.exerciseType,
        className: cls?.name || "",
        classId: a.classId.toString(),
        teacherName: cls?.teacherName || "",
        dueAt: a.dueAt,
        publishAt: a.publishAt,
        pointsTotal: a.pointsTotal,
        status,
        score: submission?.score,
        percentage: submission?.percentage,
        submittedAt: submission?.submittedAt,
        isLate: submission?.isLate || false,
        feedback: submission?.feedback?.comment,
      };
    });

    // 5. Фільтрація за статусом
    const filtered = statusFilter
      ? result.filter((a) => {
          if (statusFilter === "pending")
            return a.status === "not_started" || a.status === "in_progress";
          return a.status === statusFilter;
        })
      : result;

    return NextResponse.json({ assignments: filtered });
  } catch (error) {
    console.error("[student-assignments] Error:", error);
    return NextResponse.json(
      { error: "Failed to load assignments" },
      { status: 500 }
    );
  }
}
