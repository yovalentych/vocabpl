import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getAuthUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import type { ScheduleEvent, EventOverride } from "@/lib/schedule";

// POST /api/schedule/[eventId]/occurrence - Reschedule or cancel a specific occurrence
export async function POST(
  request: Request,
  { params }: { params: { eventId: string } }
) {
  const auth = await getAuthUser();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const eventId = new ObjectId(params.eventId);
    const db = await getDb();

    const event = await db
      .collection<ScheduleEvent>("schedule_events")
      .findOne({ _id: eventId });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Only teacher who created the event can modify it
    if (event.teacherId.toString() !== auth.id) {
      return NextResponse.json(
        { error: "Only event creator can modify occurrences" },
        { status: 403 }
      );
    }

    if (!event.isRecurring) {
      return NextResponse.json(
        { error: "Can only override occurrences of recurring events" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { originalDate, cancelled, newStartTime, newEndTime, title, description, location, meetingLink, reason } = body;

    if (!originalDate) {
      return NextResponse.json(
        { error: "originalDate is required" },
        { status: 400 }
      );
    }

    const newOverride: EventOverride = {
      originalDate: new Date(originalDate),
      cancelled: cancelled || false,
      newStartTime: newStartTime ? new Date(newStartTime) : undefined,
      newEndTime: newEndTime ? new Date(newEndTime) : undefined,
      title: title?.trim(),
      description: description?.trim(),
      location: location?.trim(),
      meetingLink: meetingLink?.trim(),
      reason: reason?.trim(),
      createdAt: new Date()
    };

    // Remove existing override for this date if any
    const existingOverrides = event.overrides || [];
    const originalDateStr = newOverride.originalDate.toDateString();
    const filteredOverrides = existingOverrides.filter(
      o => o.originalDate.toDateString() !== originalDateStr
    );

    // Add new override
    const updatedOverrides = [...filteredOverrides, newOverride];

    await db
      .collection<ScheduleEvent>("schedule_events")
      .updateOne(
        { _id: eventId },
        {
          $set: {
            overrides: updatedOverrides,
            updatedAt: new Date()
          }
        }
      );

    return NextResponse.json({
      success: true,
      override: newOverride
    });
  } catch (error) {
    console.error("Error creating occurrence override:", error);
    return NextResponse.json(
      { error: "Failed to create occurrence override" },
      { status: 500 }
    );
  }
}

// DELETE /api/schedule/[eventId]/occurrence - Remove override for a specific occurrence
export async function DELETE(
  request: Request,
  { params }: { params: { eventId: string } }
) {
  const auth = await getAuthUser();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const eventId = new ObjectId(params.eventId);
    const { searchParams } = new URL(request.url);
    const originalDate = searchParams.get("date");

    if (!originalDate) {
      return NextResponse.json(
        { error: "date query parameter is required" },
        { status: 400 }
      );
    }

    const db = await getDb();

    const event = await db
      .collection<ScheduleEvent>("schedule_events")
      .findOne({ _id: eventId });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Only teacher who created the event can modify it
    if (event.teacherId.toString() !== auth.id) {
      return NextResponse.json(
        { error: "Only event creator can remove overrides" },
        { status: 403 }
      );
    }

    const dateToRemove = new Date(originalDate).toDateString();
    const updatedOverrides = (event.overrides || []).filter(
      o => o.originalDate.toDateString() !== dateToRemove
    );

    await db
      .collection<ScheduleEvent>("schedule_events")
      .updateOne(
        { _id: eventId },
        {
          $set: {
            overrides: updatedOverrides,
            updatedAt: new Date()
          }
        }
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing occurrence override:", error);
    return NextResponse.json(
      { error: "Failed to remove occurrence override" },
      { status: 500 }
    );
  }
}
