import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { ObjectId } from "mongodb";

export const dynamic = "force-dynamic";

// GET /api/teacher/assignments - всі завдання вчителя по всіх класах
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
      .project({ _id: 1, name: 1 })
      .toArray();

    if (classes.length === 0) {
      return NextResponse.json({ assignments: [] });
    }

    const classIds = classes.map((c) => c._id);
    const classMap = Object.fromEntries(
      classes.map((c) => [c._id.toString(), c.name as string])
    );

    const assignments = await db
      .collection("class_assignments")
      .find({ classId: { $in: classIds } })
      .sort({ createdAt: -1 })
      .toArray();

    const enriched = assignments.map((a) => ({
      ...a,
      _id: a._id.toString(),
      classId: a.classId.toString(),
      className: classMap[a.classId.toString()] ?? "",
    }));

    return NextResponse.json({ assignments: enriched });
  } catch (error) {
    console.error("Failed to load teacher assignments:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
