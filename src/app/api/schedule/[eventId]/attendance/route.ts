import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getAuthUser } from "@/lib/auth";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET /api/schedule/[eventId]/attendance?date=... — отримати відвідуваність для конкретного заняття
export async function GET(
  request: Request,
  { params }: { params: { eventId: string } }
) {
  const auth = await getAuthUser();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const dateStr = searchParams.get("date");

    const db = await getDb();
    const eventId = new ObjectId(params.eventId);

    const query: any = { eventId };
    if (dateStr) {
      const date = new Date(dateStr);
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);
      query.occurrenceDate = { $gte: dayStart, $lte: dayEnd };
    }

    const attendance = await db.collection("attendance_records").findOne(query, {
      sort: { createdAt: -1 },
    });

    return NextResponse.json({ attendance });
  } catch (error) {
    console.error("[attendance GET] Error:", error);
    return NextResponse.json({ error: "Failed to load attendance" }, { status: 500 });
  }
}

// POST /api/schedule/[eventId]/attendance — зберегти/оновити відвідуваність
export async function POST(
  request: Request,
  { params }: { params: { eventId: string } }
) {
  const auth = await getAuthUser();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (auth.role !== "tutor" && auth.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const db = await getDb();
    const eventId = new ObjectId(params.eventId);

    const event = await db.collection("schedule_events").findOne({ _id: eventId });
    if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

    if (event.teacherId.toString() !== auth.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { occurrenceDate, conducted, students, notes } = body;

    const occDate = new Date(occurrenceDate);
    const dayStart = new Date(occDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(occDate);
    dayEnd.setHours(23, 59, 59, 999);

    const now = new Date();
    const record = {
      eventId,
      classId: event.classId,
      teacherId: new ObjectId(auth.id),
      occurrenceDate: occDate,
      conducted: conducted ?? true,
      students: students || [],
      notes: notes?.trim() || "",
      updatedAt: now,
    };

    await db.collection("attendance_records").updateOne(
      { eventId, occurrenceDate: { $gte: dayStart, $lte: dayEnd } },
      { $set: record, $setOnInsert: { createdAt: now } },
      { upsert: true }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[attendance POST] Error:", error);
    return NextResponse.json({ error: "Failed to save attendance" }, { status: 500 });
  }
}
