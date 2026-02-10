import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { sendFeedbackEmail } from "@/lib/mailer";
import { ObjectId } from "mongodb";

export async function POST(request: Request) {
  const auth = await getAuthUser();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { subject, message } = await request.json();
  if (!message || !String(message).trim()) {
    return NextResponse.json({ error: "Missing message" }, { status: 400 });
  }

  const db = await getDb();
  const user = await db.collection("users").findOne({ _id: new ObjectId(auth.id) });
  if (!user?.email) {
    return NextResponse.json({ error: "Email not set" }, { status: 400 });
  }

  const payload = {
    id: `feedback_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
    userId: new ObjectId(auth.id),
    username: user.username,
    name: user.name || "",
    email: user.email,
    subject: String(subject || ""),
    message: String(message || ""),
    createdAt: new Date()
  };

  await db.collection("feedback").insertOne(payload);

  try {
    await sendFeedbackEmail({
      fromName: payload.name || payload.username,
      fromEmail: payload.email,
      subject: payload.subject,
      message: payload.message
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to send" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
