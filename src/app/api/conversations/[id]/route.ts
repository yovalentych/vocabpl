import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getAuthUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { isCsrfValid } from "@/lib/csrf";

export const dynamic = "force-dynamic";

// GET: messages in conversation (marks as read)
export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await getAuthUser();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const db = await getDb();
    const convId = new ObjectId(params.id);
    const userId = auth.id;

    const conv = await db.collection("conversations").findOne({ _id: convId });
    if (!conv) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const isParticipant = conv.participants.some((p: any) => p.id === userId);
    if (!isParticipant) return NextResponse.json({ error: "Access denied" }, { status: 403 });

    const messages = await db
      .collection("messages")
      .find({ conversationId: convId })
      .sort({ createdAt: 1 })
      .limit(100)
      .toArray();

    // Mark as read
    await db.collection("conversations").updateOne(
      { _id: convId },
      { $set: { [`unreadCounts.${userId}`]: 0 } }
    );

    return NextResponse.json({
      conversation: {
        ...conv,
        _id: conv._id.toString(),
        otherParticipant: conv.participants.find((p: any) => p.id !== userId),
      },
      messages: messages.map((m) => ({
        ...m,
        _id: m._id.toString(),
        conversationId: m.conversationId.toString(),
      })),
    });
  } catch (error) {
    console.error("[conversations GET]", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// POST: send a message
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await getAuthUser();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!isCsrfValid(request)) {
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
  }

  try {
    const { text } = await request.json();
    if (!text?.trim()) return NextResponse.json({ error: "text required" }, { status: 400 });

    const db = await getDb();
    const convId = new ObjectId(params.id);
    const userId = auth.id;

    const conv = await db.collection("conversations").findOne({ _id: convId });
    if (!conv) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const isParticipant = conv.participants.some((p: any) => p.id === userId);
    if (!isParticipant) return NextResponse.json({ error: "Access denied" }, { status: 403 });

    const senderName = conv.participants.find((p: any) => p.id === userId)?.name || auth.username;
    const recipient = conv.participants.find((p: any) => p.id !== userId);
    const now = new Date();

    const result = await db.collection("messages").insertOne({
      conversationId: convId,
      senderId: userId,
      senderName,
      text: text.trim(),
      createdAt: now,
    });

    const updateOp: any = {
      $set: {
        lastMessageText: text.trim().slice(0, 120),
        lastMessageAt: now,
      },
    };
    if (recipient) {
      updateOp.$inc = { [`unreadCounts.${recipient.id}`]: 1 };
    }
    await db.collection("conversations").updateOne({ _id: convId }, updateOp);

    return NextResponse.json({
      message: {
        _id: result.insertedId.toString(),
        conversationId: params.id,
        senderId: userId,
        senderName,
        text: text.trim(),
        createdAt: now.toISOString(),
      },
    });
  } catch (error) {
    console.error("[conversations POST]", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
