import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getAuthUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import type { ScheduleEvent } from "@/lib/schedule";

// GET /api/schedule/my - Get personal schedule (all classes for current user)
export async function GET(request: Request) {
  const auth = await getAuthUser();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("start");
    const endDate = searchParams.get("end");
    const classId = searchParams.get("classId"); // Optional filter by class

    const db = await getDb();
    const userId = new ObjectId(auth.id);

    // Get user's classes
    const user = await db.collection("users").findOne({ _id: userId });
    const classIds: ObjectId[] = [];

    // Add classes where user is teacher
    if (user?.classes?.asTeacher) {
      classIds.push(...user.classes.asTeacher);
    }

    // Add classes where user is student
    if (user?.classes?.asStudent) {
      classIds.push(...user.classes.asStudent);
    }

    if (classIds.length === 0) {
      return NextResponse.json({ events: [], classes: [] });
    }

    // Build query
    const query: any = {
      classId: { $in: classIds }
    };

    // Filter by specific class if provided
    if (classId && ObjectId.isValid(classId)) {
      query.classId = new ObjectId(classId);
    }

    // Filter by date range if provided
    if (startDate && endDate) {
      query.$or = [
        {
          startTime: {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
          }
        },
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

    // Check if user should see this event (participant filter)
    const events = await db
      .collection<ScheduleEvent>("schedule_events")
      .find(query)
      .sort({ startTime: 1 })
      .toArray();

    // Filter events by participants (if not "all", check if user is included)
    const filteredEvents = events.filter(event => {
      if (event.participants === "all") return true;
      if (Array.isArray(event.participants)) {
        return event.participants.some(id => id.toString() === auth.id);
      }
      return false;
    });

    // Get class info for events
    const classes = await db
      .collection("classes")
      .find({ _id: { $in: classIds } })
      .project({ name: 1, teacherName: 1 })
      .toArray();

    // Create a map for quick class name lookup
    const classMap = new Map(
      classes.map(c => [c._id.toString(), c.name])
    );

    // Add className to each event
    const eventsWithClassName = filteredEvents.map(event => ({
      ...event,
      className: classMap.get(event.classId.toString())
    }));

    return NextResponse.json({
      events: eventsWithClassName,
      classes
    });
  } catch (error) {
    console.error("Error fetching personal schedule:", error);
    return NextResponse.json(
      { error: "Failed to fetch schedule" },
      { status: 500 }
    );
  }
}
