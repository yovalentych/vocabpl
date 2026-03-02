import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { ObjectId } from "mongodb";
import crypto from "crypto";
import { getJwtSecret } from "@/lib/auth";
import { isCsrfValid } from "@/lib/csrf";
import { checkRateLimit, getRequestIp } from "@/lib/rate-limit";

const MAX_VERIFICATION_ATTEMPTS = 5;

function hashCode(code: string) {
  return crypto.createHash("sha256").update(`${code}:${getJwtSecret()}`).digest("hex");
}

export async function POST(request: Request) {
  // CSRF validation
  if (!isCsrfValid(request)) {
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
  }

  // Rate limiting
  const requestIp = getRequestIp(request);
  const rate = await checkRateLimit(`teacher:verify:${requestIp}`, 10, 60_000);
  if (!rate.ok) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  // Auth check
  const auth = await getAuthUser();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { code } = await request.json();

  if (!code || String(code).length !== 6) {
    return NextResponse.json({ error: "Invalid code format" }, { status: 400 });
  }

  const db = await getDb();
  const user = await db.collection("users").findOne({ _id: new ObjectId(auth.id) });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (!user.teacherProfile) {
    return NextResponse.json({ error: "Teacher profile not found" }, { status: 404 });
  }

  const { teacherProfile } = user;

  // Check status
  if (teacherProfile.status !== "verifying_email") {
    return NextResponse.json(
      { error: "Not in verification state", code: "INVALID_STATE" },
      { status: 400 }
    );
  }

  // Check if verification code exists
  if (!teacherProfile.emailVerificationCode || !teacherProfile.emailVerificationExpiresAt) {
    return NextResponse.json({ error: "No verification pending" }, { status: 400 });
  }

  // Check max attempts
  const attempts = teacherProfile.emailVerificationAttempts || 0;
  if (attempts >= MAX_VERIFICATION_ATTEMPTS) {
    return NextResponse.json(
      { error: "Maximum verification attempts exceeded", code: "MAX_ATTEMPTS" },
      { status: 429 }
    );
  }

  // Check expiration
  if (new Date(teacherProfile.emailVerificationExpiresAt).getTime() <= Date.now()) {
    return NextResponse.json(
      { error: "Verification code expired", code: "CODE_EXPIRED" },
      { status: 400 }
    );
  }

  // Verify code
  const codeHash = hashCode(String(code));
  if (codeHash !== teacherProfile.emailVerificationCode) {
    // Increment attempts
    await db.collection("users").updateOne(
      { _id: new ObjectId(auth.id) },
      {
        $inc: { "teacherProfile.emailVerificationAttempts": 1 },
        $set: { updatedAt: new Date() },
      }
    );

    return NextResponse.json(
      {
        error: "Invalid verification code",
        code: "INVALID_CODE",
        attemptsRemaining: MAX_VERIFICATION_ATTEMPTS - attempts - 1,
      },
      { status: 400 }
    );
  }

  // Success - update status to pending_payment
  await db.collection("users").updateOne(
    { _id: new ObjectId(auth.id) },
    {
      $set: {
        "teacherProfile.status": "pending_payment",
        "teacherProfile.updatedAt": new Date(),
        updatedAt: new Date(),
      },
      $unset: {
        "teacherProfile.emailVerificationCode": "",
        "teacherProfile.emailVerificationExpiresAt": "",
        "teacherProfile.emailVerificationAttempts": "",
      },
    }
  );

  return NextResponse.json({
    success: true,
    status: "pending_payment",
  });
}
