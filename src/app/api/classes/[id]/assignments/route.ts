import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { ObjectId } from "mongodb";
import {
  isTeacherOfClass,
  canAccessClass,
  getDefaultAssignmentSettings,
  type Class,
  type Assignment
} from "@/lib/classes";
import { notifyAssignmentCreated } from "@/lib/notifications";
import type { ScheduleEvent } from "@/lib/schedule";

// GET /api/classes/[id]/assignments - Отримати список завдань класу
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

    // Перевірка доступу
    if (!canAccessClass(auth.id, classDoc)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const assignments = await db
      .collection<Assignment>("class_assignments")
      .find({ classId })
      .sort({ createdAt: -1 })
      .toArray();

    const isTeacher = isTeacherOfClass(auth.id, classDoc);
    const now = new Date();

    // Фільтруємо assignments для студентів (приховуємо scheduled)
    const visibleAssignments = isTeacher
      ? assignments
      : assignments.filter(a => !a.publishAt || a.publishAt <= now);

    // Агрегація статистики submissions (тільки для вчителів)
    let statsMap = new Map<string, { total: number; submitted: number; graded: number }>();

    if (isTeacher && assignments.length > 0) {
      const assignmentIds = assignments.map(a => a._id);

      const submissionStats = await db.collection("class_submissions")
        .aggregate([
          { $match: { assignmentId: { $in: assignmentIds } } },
          {
            $group: {
              _id: "$assignmentId",
              total: { $sum: 1 },
              submitted: {
                $sum: { $cond: [{ $in: ["$status", ["submitted", "graded"]] }, 1, 0] }
              },
              graded: {
                $sum: { $cond: [{ $eq: ["$status", "graded"] }, 1, 0] }
              }
            }
          }
        ])
        .toArray();

      statsMap = new Map(
        submissionStats.map(s => [
          s._id.toString(),
          { total: s.total, submitted: s.submitted, graded: s.graded }
        ])
      );
    }

    return NextResponse.json({
      assignments: visibleAssignments.map(a => ({
        ...a,
        _id: a._id.toString(),
        classId: a.classId.toString(),
        teacherId: a.teacherId.toString(),
        stats: isTeacher ? (statsMap.get(a._id.toString()) || { total: 0, submitted: 0, graded: 0 }) : undefined
      }))
    });
  } catch (error) {
    console.error("Error fetching assignments:", error);
    return NextResponse.json(
      { error: "Failed to fetch assignments" },
      { status: 500 }
    );
  }
}

// POST /api/classes/[id]/assignments - Створити завдання (тільки викладач)
export async function POST(
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

    // Тільки викладач може створювати завдання
    if (!isTeacherOfClass(auth.id, classDoc)) {
      return NextResponse.json(
        { error: "Only teacher can create assignments" },
        { status: 403 }
      );
    }

    // Check teacher limits
    if (auth.role === "tutor") {
      const { canCreateAssignment } = await import("@/lib/teacher-limits");
      const limitCheck = await canCreateAssignment(new ObjectId(auth.id));
      if (!limitCheck.allowed) {
        return NextResponse.json(
          {
            error: limitCheck.reason || "Assignment creation limit reached",
            code: "TEACHER_LIMIT_REACHED",
            current: limitCheck.current,
            limit: limitCheck.limit,
          },
          { status: 403 }
        );
      }
    }

    const body = await request.json();
    const {
      type,
      title,
      description,
      instructions,
      exerciseType,
      exerciseConfig,
      testId,
      readingId,
      publishAt,
      dueAt,
      pointsTotal,
      passingScore,
      assignedTo,
      settings
    } = body;

    if (!type || !title) {
      return NextResponse.json(
        { error: "Type and title are required" },
        { status: 400 }
      );
    }

    if (!['exercise', 'test', 'reading', 'custom'].includes(type)) {
      return NextResponse.json(
        { error: "Invalid assignment type" },
        { status: 400 }
      );
    }

    // Валідація exercise type
    if (type === 'exercise' && !exerciseType) {
      return NextResponse.json(
        { error: "Exercise type is required for exercise assignments" },
        { status: 400 }
      );
    }

    const now = new Date();

    const newAssignment: Omit<Assignment, '_id'> = {
      classId,
      teacherId: new ObjectId(auth.id),
      type,
      title: title.trim(),
      description: description?.trim(),
      instructions: instructions?.trim(),
      exerciseType,
      exerciseConfig,
      testId: testId ? new ObjectId(testId) : undefined,
      readingId: readingId ? new ObjectId(readingId) : undefined,
      assignedAt: now,
      publishAt: publishAt ? new Date(publishAt) : undefined,
      dueAt: dueAt ? new Date(dueAt) : undefined,
      pointsTotal,
      passingScore,
      settings: {
        ...getDefaultAssignmentSettings(),
        ...settings
      },
      assignedTo: assignedTo || 'all',
      createdAt: now,
      updatedAt: now
    };

    const result = await db.collection<Assignment>("class_assignments").insertOne(newAssignment as any);

    // Оновлюємо статистику класу
    await db.collection("classes").updateOne(
      { _id: classId },
      {
        $inc: { 'stats.totalAssignments': 1 },
        $set: { updatedAt: new Date() }
      }
    );

    // Створюємо submissions для студентів
    const studentIds = assignedTo === 'all'
      ? classDoc.studentIds
      : assignedTo.map((id: string) => new ObjectId(id));

    if (studentIds.length > 0) {
      const submissions = studentIds.map((studentId: ObjectId) => {
        const student = classDoc.students.find(s => s.id === studentId.toString());
        return {
          assignmentId: result.insertedId,
          classId,
          studentId,
          studentName: student?.name || student?.username || 'Unknown',
          status: 'not_started',
          attemptNumber: 0,
          isLate: false,
          createdAt: now,
          updatedAt: now
        };
      });

      await db.collection("class_submissions").insertMany(submissions);

      // Створюємо notifications для студентів (тільки якщо завдання вже опубліковане)
      const shouldNotify = !publishAt || new Date(publishAt) <= now;

      if (shouldNotify) {
        try {
          await notifyAssignmentCreated({
            studentIds,
            classId,
            className: classDoc.name,
            assignmentId: result.insertedId,
            assignmentTitle: title.trim(),
            dueDate: dueAt ? new Date(dueAt) : undefined,
            teacherName: classDoc.teacherName
          });
        } catch (notifError) {
          console.error("Failed to create notifications:", notifError);
        }
      }

      // Створюємо schedule event для deadline (якщо є dueAt)
      if (dueAt) {
        try {
          const dueDate = new Date(dueAt);
          const startTime = new Date(dueDate.getTime() - 60 * 60 * 1000); // 1 година до deadline

          const scheduleEvent: Omit<ScheduleEvent, '_id'> = {
            classId,
            teacherId: new ObjectId(auth.id),
            type: 'assignment_deadline',
            title: `${title.trim()} - Deadline`,
            description: description?.trim() || `Deadline for assignment: ${title.trim()}`,
            startTime,
            endTime: dueDate,
            isRecurring: false,
            assignmentId: result.insertedId,
            participants: assignedTo === 'all' ? 'all' : assignedTo.map((id: string) => new ObjectId(id)),
            createdAt: now,
            updatedAt: now
          };

          await db.collection<ScheduleEvent>("schedule_events").insertOne(scheduleEvent as any);
        } catch (scheduleError) {
          console.error("Failed to create schedule event:", scheduleError);
        }
      }
    }

    return NextResponse.json({
      success: true,
      assignmentId: result.insertedId.toString()
    });
  } catch (error) {
    console.error("Error creating assignment:", error);
    return NextResponse.json(
      { error: "Failed to create assignment" },
      { status: 500 }
    );
  }
}
