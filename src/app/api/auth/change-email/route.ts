import { NextResponse } from "next/server";
import crypto from "crypto";
import { getJwtSecret, getUserByEmail } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { sendVerificationEmail } from "@/lib/mailer";

const CODE_TTL_MINUTES = 15;

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function hashCode(code: string) {
  return crypto.createHash("sha256").update(`${code}:${getJwtSecret()}`).digest("hex");
}

export async function POST(request: Request) {
  const { oldEmail, newEmail } = await request.json();
  if (!oldEmail || !newEmail) {
    return NextResponse.json({ error: "Missing email" }, { status: 400 });
  }

  const normalizedOld = String(oldEmail).trim().toLowerCase();
  const normalizedNew = String(newEmail).trim().toLowerCase();

  if (!isValidEmail(normalizedNew)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  const user = await getUserByEmail(normalizedOld);
  if (!user) {
    return NextResponse.json({ error: "Email not found" }, { status: 404 });
  }

  if (user.emailVerified) {
    return NextResponse.json({ error: "Email already verified" }, { status: 400 });
  }

  const existing = await getUserByEmail(normalizedNew);
  if (existing && existing._id.toString() !== user._id.toString()) {
    return NextResponse.json({ error: "Email already exists" }, { status: 409 });
  }

  const db = await getDb();
  await db.collection("users").updateOne(
    { _id: user._id },
    {
      $set: {
        email: normalizedNew,
        emailLower: normalizedNew,
        emailVerified: false
      }
    }
  );

  const code = generateCode();
  const codeHash = hashCode(code);
  const expiresAt = new Date(Date.now() + CODE_TTL_MINUTES * 60 * 1000);

  await db.collection("email_verifications").updateOne(
    { userId: user._id },
    {
      $set: {
        userId: user._id,
        codeHash,
        expiresAt,
        sentAt: new Date(),
        attempts: 0
      }
    },
    { upsert: true }
  );

  try {
    await sendVerificationEmail(normalizedNew, code);
  } catch (error) {
    return NextResponse.json({ error: "Failed to send verification email" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, email: normalizedNew });
}
