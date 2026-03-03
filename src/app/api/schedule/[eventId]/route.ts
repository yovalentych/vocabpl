import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getAuthUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import type { ScheduleEvent } from "@/lib/schedule";

// PATCH /api/schedule/[eventId] - Update a schedule event
export async function PATCH(
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

    // Only teacher who created the event can update it
    if (event.teacherId.toString() !== auth.id) {
      return NextResponse.json(
        { error: "Only event creator can update it" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const updateData: any = { updatedAt: new Date() };

    // Update allowed fields
    if (body.title !== undefined) updateData.title = body.title.trim();
    if (body.description !== undefined) updateData.description = body.description?.trim();
    if (body.startTime !== undefined) updateData.startTime = new Date(body.startTime);
    if (body.endTime !== undefined) updateData.endTime = new Date(body.endTime);
    if (body.location !== undefined) updateData.location = body.location?.trim();
    if (body.meetingLink !== undefined) updateData.meetingLink = body.meetingLink?.trim();
    if (body.participants !== undefined) updateData.participants = body.participants;
    if (body.color !== undefined) updateData.color = body.color;
    if (body.isRecurring !== undefined) updateData.isRecurring = body.isRecurring;
    if (body.recurrence !== undefined) updateData.recurrence = body.recurrence;
    if (body.reminders !== undefined) updateData.reminders = body.reminders;

    // Cancellation support
    if (body.isCancelled !== undefined) updateData.isCancelled = body.isCancelled;
    if (body.cancellationReason !== undefined) updateData.cancellationReason = body.cancellationReason?.trim();

    await db
      .collection<ScheduleEvent>("schedule_events")
      .updateOne({ _id: eventId }, { $set: updateData });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating schedule event:", error);
    return NextResponse.json(
      { error: "Failed to update schedule event" },
      { status: 500 }
    );
  }
}

// DELETE /api/schedule/[eventId] - Delete a schedule event
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
    const db = await getDb();

    const event = await db
      .collection<ScheduleEvent>("schedule_events")
      .findOne({ _id: eventId });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Only teacher who created the event can delete it
    if (event.teacherId.toString() !== auth.id) {
      return NextResponse.json(
        { error: "Only event creator can delete it" },
        { status: 403 }
      );
    }

    // Don't allow deleting auto-generated assignment deadline events
    if (event.type === "assignment_deadline" && event.assignmentId) {
      return NextResponse.json(
        { error: "Cannot delete assignment deadline events. Update the assignment instead." },
        { status: 400 }
      );
    }

    await db
      .collection<ScheduleEvent>("schedule_events")
      .deleteOne({ _id: eventId });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting schedule event:", error);
    return NextResponse.json(
      { error: "Failed to delete schedule event" },
      { status: 500 }
    );
  }
}
