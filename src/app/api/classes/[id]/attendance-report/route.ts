import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getAuthUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { isTeacherOfClass, type Class } from "@/lib/classes";

export const dynamic = "force-dynamic";

// GET /api/classes/[id]/attendance-report — повна матриця відвідуваності
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

    const students = (classDoc.students || []).map((s: any) => ({
      id: s.id,
      name: s.name || s.username,
      username: s.username,
    }));

    // Усі записи відвідуваності для класу
    const records = await db
      .collection("attendance_records")
      .find({ classId })
      .sort({ occurrenceDate: -1 })
      .toArray();

    if (records.length === 0) {
      return NextResponse.json({ students, lessons: [], studentStats: [] });
    }

    // Завантажити назви подій
    const eventIds = [...new Set(records.map((r) => r.eventId.toString()))];
    const events = await db
      .collection("schedule_events")
      .find({ _id: { $in: eventIds.map((id) => new ObjectId(id)) } })
      .project({ title: 1, startTime: 1 })
      .toArray();
    const eventMap = new Map(events.map((e) => [e._id.toString(), e]));

    // Побудувати список занять з матрицею студентів
    const lessons = records.map((record) => {
      const event = eventMap.get(record.eventId.toString());
      const studentStatuses: Record<string, { status: string; note?: string }> = {};

      for (const s of record.students || []) {
        studentStatuses[s.studentId] = { status: s.status, note: s.note };
      }

      const presentCount = Object.values(studentStatuses).filter(
        (s) => s.status === "present" || s.status === "late"
      ).length;

      return {
        recordId: record._id.toString(),
        eventId: record.eventId.toString(),
        eventTitle: event?.title || "Заняття",
        date: record.occurrenceDate,
        conducted: record.conducted ?? true,
        notes: record.notes || "",
        studentStatuses,
        presentCount,
        totalStudents: students.length,
      };
    });

    // Статистика по кожному студенту
    const studentStats = students.map((student) => {
      let present = 0;
      let absent = 0;
      let late = 0;
      let excused = 0;
      let noRecord = 0;

      for (const lesson of lessons) {
        if (!lesson.conducted) continue;
        const entry = lesson.studentStatuses[student.id];
        if (!entry) {
          noRecord++;
        } else if (entry.status === "present") {
          present++;
        } else if (entry.status === "absent") {
          absent++;
        } else if (entry.status === "late") {
          late++;
        } else if (entry.status === "excused") {
          excused++;
        }
      }

      const conductedLessons = lessons.filter((l) => l.conducted).length;
      const attendedCount = present + late;
      const rate =
        conductedLessons > 0
          ? Math.round((attendedCount / conductedLessons) * 100)
          : null;

      return {
        studentId: student.id,
        name: student.name,
        username: student.username,
        present,
        absent,
        late,
        excused,
        noRecord,
        total: conductedLessons,
        rate,
      };
    });

    return NextResponse.json({ students, lessons, studentStats });
  } catch (error) {
    console.error("[attendance-report] Error:", error);
    return NextResponse.json({ error: "Failed to load report" }, { status: 500 });
  }
}
