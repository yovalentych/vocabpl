import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getAuthUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { isCsrfValid } from "@/lib/csrf";

export const dynamic = "force-dynamic";

// GET: list conversations + available contacts
export async function GET() {
  const auth = await getAuthUser();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = await getDb();
  const userId = auth.id;

  const conversations = await db
    .collection("conversations")
    .find({ "participants.id": userId })
    .sort({ lastMessageAt: -1 })
    .toArray();

  // Collect contacts from shared classes
  const userClasses = await db
    .collection("classes")
    .find({
      $or: [
        { teacherId: new ObjectId(userId) },
        { studentIds: new ObjectId(userId) },
      ],
      archivedAt: { $exists: false },
    })
    .toArray();

  const contactMap = new Map<string, { id: string; name: string; role: string }>();
  for (const cls of userClasses) {
    const isTeacher = cls.teacherId.toString() === userId;
    if (isTeacher) {
      for (const s of cls.students || []) {
        if (s.id !== userId && !contactMap.has(s.id)) {
          contactMap.set(s.id, { id: s.id, name: s.name || s.username, role: "student" });
        }
      }
    } else {
      const tid = cls.teacherId.toString();
      if (!contactMap.has(tid)) {
        contactMap.set(tid, { id: tid, name: cls.teacherName, role: "teacher" });
      }
    }
  }

  return NextResponse.json({
    conversations: conversations.map((c) => ({
      ...c,
      _id: c._id.toString(),
      unreadCount: c.unreadCounts?.[userId] || 0,
      otherParticipant: c.participants.find((p: any) => p.id !== userId),
    })),
    contacts: Array.from(contactMap.values()),
  });
}

// POST: find or create conversation with another user
export async function POST(request: Request) {
  const auth = await getAuthUser();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!isCsrfValid(request)) {
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
  }

  const { recipientId } = await request.json();
  if (!recipientId) return NextResponse.json({ error: "recipientId required" }, { status: 400 });

  const db = await getDb();
  const userId = auth.id;

  // Find existing
  const existing = await db.collection("conversations").findOne({
    "participants.id": { $all: [userId, recipientId] },
  });
  if (existing) {
    return NextResponse.json({ conversationId: existing._id.toString() });
  }

  // Get recipient info
  let recipientName = recipientId;
  try {
    const recipient = await db.collection("users").findOne({ _id: new ObjectId(recipientId) });
    recipientName = recipient?.username || recipient?.name || recipientId;
  } catch {}

  const now = new Date();
  const result = await db.collection("conversations").insertOne({
    participants: [
      { id: userId, name: auth.username },
      { id: recipientId, name: recipientName },
    ],
    lastMessageText: "",
    lastMessageAt: now,
    unreadCounts: { [userId]: 0, [recipientId]: 0 },
    createdAt: now,
  });

  return NextResponse.json({ conversationId: result.insertedId.toString() });
}
