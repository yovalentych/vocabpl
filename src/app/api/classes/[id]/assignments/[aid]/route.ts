import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { ObjectId } from "mongodb";
import {
  isTeacherOfClass,
  canAccessClass,
  type Class,
  type Assignment,
  type Submission
} from "@/lib/classes";
import type { ScheduleEvent } from "@/lib/schedule";

// GET /api/classes/[id]/assignments/[aid] — Get single assignment with submission(s)
export async function GET(
  request: Request,
  { params }: { params: { id: string; aid: string } }
) {
  const auth = await getAuthUser();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const classId = new ObjectId(params.id);
    const assignmentId = new ObjectId(params.aid);
    const db = await getDb();

    const classDoc = await db.collection<Class>("classes").findOne({ _id: classId });
    if (!classDoc) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    if (!canAccessClass(auth.id, classDoc)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const assignment = await db
      .collection<Assignment>("class_assignments")
      .findOne({ _id: assignmentId, classId });

    if (!assignment) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }

    const isTeacher = isTeacherOfClass(auth.id, classDoc);

    // Перевіряємо доступ студентів до scheduled assignments
    if (!isTeacher) {
      const now = new Date();
      if (assignment.publishAt && assignment.publishAt > now) {
        return NextResponse.json(
          { error: "Assignment not published yet" },
          { status: 403 }
        );
      }
    }

    const assignmentData = {
      ...assignment,
      _id: assignment._id.toString(),
      classId: assignment.classId.toString(),
      teacherId: assignment.teacherId.toString()
    };

    if (isTeacher) {
      // Teacher sees all submissions
      const submissions = await db
        .collection<Submission>("class_submissions")
        .find({ assignmentId })
        .sort({ studentName: 1 })
        .toArray();

      return NextResponse.json({
        assignment: assignmentData,
        submissions: submissions.map(s => ({
          ...s,
          _id: s._id.toString(),
          assignmentId: s.assignmentId.toString(),
          classId: s.classId.toString(),
          studentId: s.studentId.toString()
        })),
        role: "teacher"
      });
    } else {
      // Student sees only their submission
      const studentId = new ObjectId(auth.id);
      let submission = await db
        .collection<Submission>("class_submissions")
        .findOne({ assignmentId, studentId });

      // Auto-create submission record on first view (enables submit route to work)
      if (!submission) {
        const student = (classDoc as any).students?.find((s: any) => s.id === auth.id);
        const studentName = student?.name || student?.username || auth.username;
        const now = new Date();
        const newDoc = {
          assignmentId,
          classId,
          studentId,
          studentName,
          status: "not_started" as const,
          attemptNumber: 0,
          isLate: false,
          createdAt: now,
          updatedAt: now,
        };
        const result = await db.collection("class_submissions").insertOne(newDoc);
        submission = { ...newDoc, _id: result.insertedId } as any;
      }

      return NextResponse.json({
        assignment: assignmentData,
        submission: {
          ...(submission as any),
          _id: (submission as any)._id.toString(),
          assignmentId: (submission as any).assignmentId.toString(),
          classId: (submission as any).classId.toString(),
          studentId: (submission as any).studentId.toString(),
        },
        role: "student"
      });
    }
  } catch (error) {
    console.error("Error fetching assignment:", error);
    return NextResponse.json(
      { error: "Failed to fetch assignment" },
      { status: 500 }
    );
  }
}

// PATCH /api/classes/[id]/assignments/[aid] — Update assignment (teacher only)
export async function PATCH(
  request: Request,
  { params }: { params: { id: string; aid: string } }
) {
  const auth = await getAuthUser();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const classId = new ObjectId(params.id);
    const assignmentId = new ObjectId(params.aid);
    const db = await getDb();

    const classDoc = await db.collection<Class>("classes").findOne({ _id: classId });
    if (!classDoc) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    if (!isTeacherOfClass(auth.id, classDoc)) {
      return NextResponse.json(
        { error: "Only teacher can update assignments" },
        { status: 403 }
      );
    }

    const assignment = await db
      .collection<Assignment>("class_assignments")
      .findOne({ _id: assignmentId, classId });

    if (!assignment) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }

    const body = await request.json();
    const updateData: any = { updatedAt: new Date() };

    // Update allowed fields
    if (body.title !== undefined) updateData.title = body.title.trim();
    if (body.description !== undefined) updateData.description = body.description?.trim();
    if (body.instructions !== undefined) updateData.instructions = body.instructions?.trim();
    if (body.publishAt !== undefined) updateData.publishAt = body.publishAt ? new Date(body.publishAt) : null;
    if (body.dueAt !== undefined) updateData.dueAt = body.dueAt ? new Date(body.dueAt) : null;
    if (body.pointsTotal !== undefined) updateData.pointsTotal = body.pointsTotal;
    if (body.passingScore !== undefined) updateData.passingScore = body.passingScore;
    if (body.settings !== undefined) updateData.settings = { ...assignment.settings, ...body.settings };

    await db.collection<Assignment>("class_assignments").updateOne(
      { _id: assignmentId },
      { $set: updateData }
    );

    // Update schedule event if dueAt changed
    if (body.dueAt !== undefined) {
      const existingEvent = await db
        .collection<ScheduleEvent>("schedule_events")
        .findOne({ assignmentId, classId });

      if (body.dueAt) {
        const dueDate = new Date(body.dueAt);
        const startTime = new Date(dueDate.getTime() - 60 * 60 * 1000);

        if (existingEvent) {
          // Update existing event
          await db.collection<ScheduleEvent>("schedule_events").updateOne(
            { _id: existingEvent._id },
            {
              $set: {
                title: body.title ? `${body.title.trim()} - Deadline` : existingEvent.title,
                description: body.description?.trim() || existingEvent.description,
                startTime,
                endTime: dueDate,
                updatedAt: new Date()
              }
            }
          );
        } else {
          // Create new event
          const scheduleEvent: Omit<ScheduleEvent, '_id'> = {
            classId,
            teacherId: new ObjectId(auth.id),
            type: 'assignment_deadline',
            title: `${body.title || assignment.title} - Deadline`,
            description: body.description || assignment.description || `Deadline for assignment`,
            startTime,
            endTime: dueDate,
            isRecurring: false,
            assignmentId,
            participants: assignment.assignedTo === 'all' ? 'all' : assignment.assignedTo.map((id: any) => new ObjectId(id)),
            createdAt: new Date(),
            updatedAt: new Date()
          };

          await db.collection<ScheduleEvent>("schedule_events").insertOne(scheduleEvent as any);
        }
      } else if (existingEvent) {
        // Delete event if dueAt removed
        await db.collection<ScheduleEvent>("schedule_events").deleteOne({ _id: existingEvent._id });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating assignment:", error);
    return NextResponse.json(
      { error: "Failed to update assignment" },
      { status: 500 }
    );
  }
}

// DELETE /api/classes/[id]/assignments/[aid] — Delete assignment (teacher only)
export async function DELETE(
  request: Request,
  { params }: { params: { id: string; aid: string } }
) {
  const auth = await getAuthUser();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const classId = new ObjectId(params.id);
    const assignmentId = new ObjectId(params.aid);
    const db = await getDb();

    const classDoc = await db.collection<Class>("classes").findOne({ _id: classId });
    if (!classDoc) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    if (!isTeacherOfClass(auth.id, classDoc)) {
      return NextResponse.json(
        { error: "Only teacher can delete assignments" },
        { status: 403 }
      );
    }

    const assignment = await db
      .collection<Assignment>("class_assignments")
      .findOne({ _id: assignmentId, classId });

    if (!assignment) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }

    // Delete assignment
    await db.collection<Assignment>("class_assignments").deleteOne({ _id: assignmentId });

    // Delete all submissions
    await db.collection<Submission>("class_submissions").deleteMany({ assignmentId });

    // Delete schedule event
    await db.collection<ScheduleEvent>("schedule_events").deleteOne({ assignmentId });

    // Update class stats
    await db.collection("classes").updateOne(
      { _id: classId },
      {
        $inc: { 'stats.totalAssignments': -1 },
        $set: { updatedAt: new Date() }
      }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting assignment:", error);
    return NextResponse.json(
      { error: "Failed to delete assignment" },
      { status: 500 }
    );
  }
}
