import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getAuthUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { isTeacherOfClass, type Class } from "@/lib/classes";

export const dynamic = "force-dynamic";

// GET /api/classes/[id]/students/[studentId]/report — Звіт по студенту
export async function GET(
  _request: Request,
  { params }: { params: { id: string; studentId: string } }
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

    const student = (classDoc.students || []).find(s => s.id === params.studentId);
    if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 });

    const now = new Date();

    // 1. Завдання
    const assignments = await db
      .collection("class_assignments")
      .find({
        classId,
        $or: [{ publishAt: { $exists: false } }, { publishAt: { $lte: now } }],
      })
      .sort({ createdAt: 1 })
      .toArray();

    // 2. Submissions студента
    const submissions = await db
      .collection("class_submissions")
      .find({ classId, studentId: params.studentId })
      .toArray();

    const submissionByAssignment = new Map(
      submissions.map(s => [s.assignmentId.toString(), s])
    );

    const assignmentsWithGrades = assignments.map(a => {
      const sub = submissionByAssignment.get(a._id.toString());
      return {
        id: a._id.toString(),
        title: a.title,
        dueDate: a.dueDate,
        status: sub?.status || "not_started",
        score: sub?.score,
        percentage: sub?.percentage,
        submittedAt: sub?.submittedAt,
      };
    });

    // 3. Відвідуваність з attendance_records
    const attendanceRecords = await db
      .collection("attendance_records")
      .find({ classId })
      .sort({ occurrenceDate: -1 })
      .toArray();

    const attendance: {
      date: Date;
      eventId: string;
      eventTitle: string;
      status: string;
      note?: string;
    }[] = [];

    // Карта подій для назв
    const eventIds = [...new Set(attendanceRecords.map(r => r.eventId.toString()))];
    const events = eventIds.length > 0
      ? await db.collection("schedule_events")
          .find({ _id: { $in: eventIds.map(id => new ObjectId(id)) } })
          .project({ title: 1 })
          .toArray()
      : [];
    const eventMap = new Map(events.map(e => [e._id.toString(), e.title]));

    for (const record of attendanceRecords) {
      const studentEntry = record.students?.find((s: any) => s.studentId === params.studentId);
      if (!studentEntry) continue;
      attendance.push({
        date: record.occurrenceDate,
        eventId: record.eventId.toString(),
        eventTitle: eventMap.get(record.eventId.toString()) || "Заняття",
        status: studentEntry.status,
        note: studentEntry.note,
      });
    }

    // 4. Статистика
    const graded = submissions.filter(s => s.status === "graded");
    const submitted = submissions.filter(s => s.status === "submitted" || s.status === "graded");
    const avgScore = graded.length > 0
      ? Math.round(graded.reduce((sum, s) => sum + (s.percentage || 0), 0) / graded.length)
      : null;

    const totalLessons = attendance.length;
    const attendedLessons = attendance.filter(a => a.status === "present" || a.status === "late").length;
    const attendanceRate = totalLessons > 0
      ? Math.round((attendedLessons / totalLessons) * 100)
      : null;

    return NextResponse.json({
      student: {
        id: student.id,
        name: student.name || student.username,
        username: student.username,
        joinedAt: student.joinedAt,
      },
      className: classDoc.name,
      stats: {
        totalAssignments: assignments.length,
        submitted: submitted.length,
        graded: graded.length,
        averageScore: avgScore,
        totalLessons,
        attendedLessons,
        attendanceRate,
      },
      assignments: assignmentsWithGrades,
      attendance,
    });
  } catch (error) {
    console.error("[student-report] Error:", error);
    return NextResponse.json({ error: "Failed to load report" }, { status: 500 });
  }
}
