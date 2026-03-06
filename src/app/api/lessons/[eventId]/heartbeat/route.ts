import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getAuthUser } from "@/lib/auth";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: { eventId: string } }
) {
  const auth = await getAuthUser();
  if (!auth) return NextResponse.json({ ok: false });

  const { searchParams } = new URL(request.url);
  const dateStr = searchParams.get("date");
  if (!dateStr) return NextResponse.json({ ok: false });

  try {
    const [y, m, d] = dateStr.split("-").map(Number);
    const occurrenceDate = new Date(Date.UTC(y, m - 1, d));
    const eventId = new ObjectId(params.eventId);
    const db = await getDb();

    const event = await db.collection("schedule_events").findOne({ _id: eventId });
    if (!event) return NextResponse.json({ ok: false });

    const classDoc = await db.collection("classes").findOne({ _id: event.classId });
    if (!classDoc) return NextResponse.json({ ok: false });

    const isTeacher = classDoc.teacherId.toString() === auth.id;
    const isStudent = (classDoc.students || []).some((s: any) => s.id === auth.id);
    if (!isTeacher && !isStudent) return NextResponse.json({ ok: false });

    const role = isTeacher ? "teacher" : "student";
    const name = isTeacher
      ? classDoc.teacherName
      : ((classDoc.students || []).find((s: any) => s.id === auth.id)?.name || auth.username);

    const now = new Date();

    // Update existing participant or push new one
    const updated = await db.collection("lesson_sessions").updateOne(
      { eventId, occurrenceDate, "participants.userId": auth.id },
      { $set: { "participants.$.lastSeenAt": now, updatedAt: now } }
    );

    if (updated.matchedCount === 0) {
      await db.collection("lesson_sessions").updateOne(
        { eventId, occurrenceDate },
        {
          $push: {
            participants: { userId: auth.id, name, role, joinedAt: now, lastSeenAt: now },
          },
          $set: { updatedAt: now },
        }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[heartbeat]", error);
    return NextResponse.json({ ok: false });
  }
}
