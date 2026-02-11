import { NextResponse } from "next/server";
import crypto from "crypto";
import { getJwtSecret, getUserByEmail } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { sendVerificationEmail } from "@/lib/mailer";
import { checkRateLimit, getRequestIp } from "@/lib/rate-limit";

const CODE_TTL_MINUTES = 15;
const RESEND_COOLDOWN_MS = 60 * 1000;

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function hashCode(code: string) {
  return crypto.createHash("sha256").update(`${code}:${getJwtSecret()}`).digest("hex");
}

export async function POST(request: Request) {
  const ip = getRequestIp(request);
  const rate = await checkRateLimit(`auth:resend-code:${ip}`, 5, 60_000);
  if (!rate.ok) {
    return NextResponse.json({ error: "Rate limit" }, { status: 429 });
  }

  const { email } = await request.json();
  if (!email) {
    return NextResponse.json({ error: "Missing email" }, { status: 400 });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const user = await getUserByEmail(normalizedEmail);
  if (!user) {
    return NextResponse.json({ error: "Email not found" }, { status: 404 });
  }

  if (user.emailVerified) {
    return NextResponse.json({ error: "Email already verified" }, { status: 400 });
  }

  const db = await getDb();
  const existing = await db.collection("email_verifications").findOne({ userId: user._id });
  if (existing?.sentAt && new Date(existing.sentAt).getTime() > Date.now() - RESEND_COOLDOWN_MS) {
    return NextResponse.json({ error: "Please wait before resending" }, { status: 429 });
  }

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
    await sendVerificationEmail(normalizedEmail, code);
  } catch (error) {
    return NextResponse.json({ error: "Failed to send verification email" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
