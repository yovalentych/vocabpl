import { NextResponse } from "next/server";
import crypto from "crypto";
import { getAuthUser, getJwtSecret } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { ObjectId } from "mongodb";
import { sendPasswordResetEmail } from "@/lib/mailer";

const CODE_TTL_MINUTES = 15;
const RESEND_COOLDOWN_MS = 60 * 1000;

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function hashCode(code: string) {
  return crypto.createHash("sha256").update(`${code}:${getJwtSecret()}`).digest("hex");
}

export async function POST() {
  const auth = await getAuthUser();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = await getDb();
  const user = await db.collection("users").findOne({ _id: new ObjectId(auth.id) });
  const email = String(user?.email || "").toLowerCase();
  if (!email) {
    return NextResponse.json({ error: "Email not set" }, { status: 400 });
  }
  if (user?.emailVerified === false) {
    return NextResponse.json({ error: "Email not verified" }, { status: 403 });
  }

  const existing = await db.collection("password_resets").findOne({ userId: new ObjectId(auth.id) });
  if (existing?.sentAt && new Date(existing.sentAt).getTime() > Date.now() - RESEND_COOLDOWN_MS) {
    return NextResponse.json({ error: "Please wait before resending" }, { status: 429 });
  }

  const code = generateCode();
  const codeHash = hashCode(code);
  const expiresAt = new Date(Date.now() + CODE_TTL_MINUTES * 60 * 1000);

  await db.collection("password_resets").updateOne(
    { userId: new ObjectId(auth.id) },
    {
      $set: {
        userId: new ObjectId(auth.id),
        codeHash,
        expiresAt,
        sentAt: new Date(),
        attempts: 0
      }
    },
    { upsert: true }
  );

  try {
    await sendPasswordResetEmail(email, code);
  } catch (error) {
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
