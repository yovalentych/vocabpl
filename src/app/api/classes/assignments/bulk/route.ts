import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { ObjectId } from "mongodb";
import { isTeacherOfClass, type Class, type Assignment } from "@/lib/classes";
import { notifyAssignmentsBulkCopied } from "@/lib/notifications";
import type { ScheduleEvent } from "@/lib/schedule";

// POST /api/classes/assignments/bulk - Bulk operations on assignments
export async function POST(request: Request) {
  const auth = await getAuthUser();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { operation, assignmentIds, classId, targetClassId, updates } = body;

    if (!operation || !assignmentIds || !Array.isArray(assignmentIds) || assignmentIds.length === 0) {
      return NextResponse.json(
        { error: "Operation and assignmentIds are required" },
        { status: 400 }
      );
    }

    if (!classId || !ObjectId.isValid(classId)) {
      return NextResponse.json({ error: "Invalid class ID" }, { status: 400 });
    }

    const db = await getDb();
    const classObjectId = new ObjectId(classId);

    // Verify teacher access to source class
    const classDoc = await db.collection<Class>("classes").findOne({ _id: classObjectId });
    if (!classDoc) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    if (!isTeacherOfClass(auth.id, classDoc)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const assignmentObjectIds = assignmentIds.map((id: string) => new ObjectId(id));

    // Verify all assignments belong to this class
    const assignments = await db
      .collection<Assignment>("class_assignments")
      .find({ _id: { $in: assignmentObjectIds }, classId: classObjectId })
      .toArray();

    if (assignments.length !== assignmentIds.length) {
      return NextResponse.json(
        { error: "Some assignments not found or don't belong to this class" },
        { status: 400 }
      );
    }

    switch (operation) {
      case "copy": {
        if (!targetClassId || !ObjectId.isValid(targetClassId)) {
          return NextResponse.json({ error: "Invalid target class ID" }, { status: 400 });
        }

        const targetClassObjectId = new ObjectId(targetClassId);
        const targetClass = await db.collection<Class>("classes").findOne({ _id: targetClassObjectId });

        if (!targetClass) {
          return NextResponse.json({ error: "Target class not found" }, { status: 404 });
        }

        if (!isTeacherOfClass(auth.id, targetClass)) {
          return NextResponse.json({ error: "No access to target class" }, { status: 403 });
        }

        const now = new Date();
        const copiedAssignments = assignments.map(a => ({
          ...a,
          _id: new ObjectId(),
          classId: targetClassObjectId,
          teacherId: new ObjectId(auth.id),
          assignedAt: now,
          createdAt: now,
          updatedAt: now
        }));

        await db.collection<Assignment>("class_assignments").insertMany(copiedAssignments as any);

        // Update target class stats
        await db.collection("classes").updateOne(
          { _id: targetClassObjectId },
          {
            $inc: { 'stats.totalAssignments': copiedAssignments.length },
            $set: { updatedAt: now }
          }
        );

        // Create submissions for students in target class
        for (const assignment of copiedAssignments) {
          const studentIds = assignment.assignedTo === 'all'
            ? targetClass.studentIds
            : (Array.isArray(assignment.assignedTo) ? assignment.assignedTo : []);

          if (studentIds.length > 0) {
            const submissions = studentIds.map((studentId: ObjectId) => {
              const student = targetClass.students.find((s: any) => s.id === studentId.toString());
              return {
                assignmentId: assignment._id,
                classId: targetClassObjectId,
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
          }

          // Copy schedule event if exists
          if (assignment.dueAt) {
            const originalAssignmentId = assignments.find(a =>
              a.title === assignment.title && a.classId.toString() === classObjectId.toString()
            )?._id;

            if (originalAssignmentId) {
              const scheduleEvent = await db
                .collection<ScheduleEvent>("schedule_events")
                .findOne({ assignmentId: originalAssignmentId });

              if (scheduleEvent) {
                const { _id, ...eventData } = scheduleEvent;
                const copiedEvent: Omit<ScheduleEvent, '_id'> = {
                  ...eventData,
                  classId: targetClassObjectId,
                  teacherId: new ObjectId(auth.id),
                  assignmentId: assignment._id,
                  participants: assignment.assignedTo === 'all' ? 'all' : assignment.assignedTo,
                  createdAt: now,
                  updatedAt: now
                };

                await db.collection<ScheduleEvent>("schedule_events").insertOne(copiedEvent as any);
              }
            }
          }
        }

        // Створюємо notification для викладача
        try {
          const teacher = await db.collection("users").findOne({ _id: new ObjectId(auth.id) });
          if (teacher) {
            await notifyAssignmentsBulkCopied({
              teacherId: new ObjectId(auth.id),
              teacherRole: teacher.role || "user",
              sourceClassId: classObjectId,
              sourceClassName: classDoc.name,
              targetClassId: targetClassObjectId,
              targetClassName: targetClass.name,
              assignmentCount: copiedAssignments.length
            });
          }
        } catch (notifError) {
          console.error("Failed to create notification:", notifError);
        }

        return NextResponse.json({
          success: true,
          message: `Copied ${copiedAssignments.length} assignment(s)`,
          count: copiedAssignments.length
        });
      }

      case "archive": {
        const now = new Date();
        await db.collection<Assignment>("class_assignments").updateMany(
          { _id: { $in: assignmentObjectIds } },
          { $set: { archivedAt: now, updatedAt: now } }
        );

        return NextResponse.json({
          success: true,
          message: `Archived ${assignments.length} assignment(s)`,
          count: assignments.length
        });
      }

      case "delete": {
        // Delete submissions first
        await db.collection("class_submissions").deleteMany({
          assignmentId: { $in: assignmentObjectIds }
        });

        // Delete assignments
        await db.collection<Assignment>("class_assignments").deleteMany({
          _id: { $in: assignmentObjectIds }
        });

        // Update class stats
        await db.collection("classes").updateOne(
          { _id: classObjectId },
          {
            $inc: { 'stats.totalAssignments': -assignments.length },
            $set: { updatedAt: new Date() }
          }
        );

        return NextResponse.json({
          success: true,
          message: `Deleted ${assignments.length} assignment(s)`,
          count: assignments.length
        });
      }

      case "update": {
        if (!updates || typeof updates !== 'object') {
          return NextResponse.json({ error: "Updates object required" }, { status: 400 });
        }

        const allowedUpdates: any = { updatedAt: new Date() };

        if (updates.dueAt !== undefined) {
          allowedUpdates.dueAt = updates.dueAt ? new Date(updates.dueAt) : null;
        }

        if (updates.publishAt !== undefined) {
          allowedUpdates.publishAt = updates.publishAt ? new Date(updates.publishAt) : null;
        }

        await db.collection<Assignment>("class_assignments").updateMany(
          { _id: { $in: assignmentObjectIds } },
          { $set: allowedUpdates }
        );

        return NextResponse.json({
          success: true,
          message: `Updated ${assignments.length} assignment(s)`,
          count: assignments.length
        });
      }

      default:
        return NextResponse.json({ error: "Invalid operation" }, { status: 400 });
    }
  } catch (error) {
    console.error("Error in bulk operation:", error);
    return NextResponse.json(
      { error: "Failed to perform bulk operation" },
      { status: 500 }
    );
  }
}
