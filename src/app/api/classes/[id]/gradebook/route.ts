import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getAuthUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { isTeacherOfClass, type Class } from "@/lib/classes";

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

    // 1. Студенти
    const students = classDoc.students || [];

    // 2. Завдання (тільки опубліковані)
    const assignments = await db
      .collection("class_assignments")
      .find({
        classId,
        $or: [{ publishAt: { $exists: false } }, { publishAt: { $lte: now } }],
      })
      .sort({ createdAt: 1 })
      .project({ title: 1, maxScore: 1, dueDate: 1, createdAt: 1 })
      .toArray();

    // 3. Всі submissions для цього класу
    const submissions = await db
      .collection("class_submissions")
      .find({ classId })
      .project({ studentId: 1, assignmentId: 1, status: 1, score: 1, percentage: 1, submittedAt: 1 })
      .toArray();

    // 4. Індекс submissions: studentId_assignmentId → submission
    const submissionMap = new Map<string, any>();
    for (const sub of submissions) {
      const key = `${sub.studentId}_${sub.assignmentId.toString()}`;
      submissionMap.set(key, sub);
    }

    // 5. Будуємо grades матрицю
    const grades: Record<string, Record<string, {
      status: string;
      score?: number;
      percentage?: number;
      submittedAt?: Date;
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
    console.error("[gradebook] Error:", error);
    return NextResponse.json({ error: "Failed to load gradebook" }, { status: 500 });
  }
}
