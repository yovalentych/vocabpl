import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getAuthUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { canAccessClass, isTeacherOfClass, type Class } from "@/lib/classes";
import type { ScheduleEvent, CreateScheduleEventInput } from "@/lib/schedule";
import { getEventColor } from "@/lib/schedule";

// GET /api/classes/[id]/schedule - Get all schedule events for a class
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
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("start");
    const endDate = searchParams.get("end");

    const db = await getDb();
    const classDoc = await db.collection<Class>("classes").findOne({ _id: classId });

    if (!classDoc) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    if (!canAccessClass(auth.id, classDoc)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Build query
    const query: any = { classId };

    // Filter by date range if provided
    if (startDate && endDate) {
      query.$or = [
        // Events that start in range
        {
          startTime: {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
          }
        },
        // Recurring events that might occur in range
        {
          isRecurring: true,
          startTime: { $lte: new Date(endDate) },
          $or: [
            { "recurrence.endDate": { $gte: new Date(startDate) } },
            { "recurrence.endDate": { $exists: false } }
          ]
        }
      ];
    }

    const events = await db
      .collection<ScheduleEvent>("schedule_events")
      .find(query)
      .sort({ startTime: 1 })
      .toArray();

    return NextResponse.json({ events });
  } catch (error) {
    console.error("Error fetching schedule:", error);
    return NextResponse.json(
      { error: "Failed to fetch schedule" },
      { status: 500 }
    );
  }
}

// POST /api/classes/[id]/schedule - Create a new schedule event
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

    // Only teacher can create schedule events
    if (!isTeacherOfClass(auth.id, classDoc)) {
      return NextResponse.json(
        { error: "Only teacher can create schedule events" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      type,
      title,
      description,
      startTime,
      endTime,
      isRecurring,
      recurrence,
      assignmentId,
      participants,
      location,
      meetingLink,
      reminders,
      color
    } = body;

    if (!type || !title || !startTime || !endTime) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const now = new Date();
    const newEvent: Omit<ScheduleEvent, '_id'> = {
      classId,
      teacherId: new ObjectId(auth.id),
      type,
      title: title.trim(),
      description: description?.trim(),
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      isRecurring: isRecurring || false,
      recurrence: isRecurring ? recurrence : undefined,
      assignmentId: assignmentId ? new ObjectId(assignmentId) : undefined,
      participants: participants || "all",
      location: location?.trim(),
      meetingLink: meetingLink?.trim(),
      reminders: reminders || [],
      color: color || getEventColor(type),
      createdAt: now,
      updatedAt: now
    };

    const result = await db
      .collection<ScheduleEvent>("schedule_events")
      .insertOne(newEvent as any);

    return NextResponse.json({
      success: true,
      eventId: result.insertedId.toString(),
      event: { ...newEvent, _id: result.insertedId }
    });
  } catch (error) {
    console.error("Error creating schedule event:", error);
    return NextResponse.json(
      { error: "Failed to create schedule event" },
      { status: 500 }
    );
  }
}
