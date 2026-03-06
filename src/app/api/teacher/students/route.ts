import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { ObjectId } from "mongodb";

export const dynamic = "force-dynamic";

// GET /api/teacher/students - Всі унікальні студенти вчителя з усіх класів
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
    const classes = await db
      .collection("classes")
      .find({ teacherId, archivedAt: { $exists: false } })
      .toArray();

    // Агрегуємо унікальних студентів з усіх класів
    const studentMap = new Map<string, {
      id: string;
      username: string;
      name: string;
      classes: { id: string; name: string }[];
      joinedAt?: Date;
    }>();

    for (const cls of classes) {
      for (const student of cls.students || []) {
        const key = student.id;
        if (!studentMap.has(key)) {
          studentMap.set(key, {
            id: student.id,
            username: student.username,
            name: student.name || student.username,
            classes: [{ id: cls._id.toString(), name: cls.name }],
            joinedAt: student.joinedAt,
          });
        } else {
          studentMap.get(key)!.classes.push({
            id: cls._id.toString(),
            name: cls.name,
          });
        }
      }
    }

    return NextResponse.json({
      students: Array.from(studentMap.values()),
    });
  } catch (error) {
    console.error("[teacher-students] Error:", error);
    return NextResponse.json(
      { error: "Failed to load students" },
      { status: 500 }
    );
  }
}
