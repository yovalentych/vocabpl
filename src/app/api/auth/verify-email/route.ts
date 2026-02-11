import { NextResponse } from "next/server";
import crypto from "crypto";
import { getCookieOptions, getJwtSecret, getUserByEmail, signToken } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { checkRateLimit, getRequestIp } from "@/lib/rate-limit";

function hashCode(code: string) {
  return crypto.createHash("sha256").update(`${code}:${getJwtSecret()}`).digest("hex");
}

export async function POST(request: Request) {
  const ip = getRequestIp(request);
  const rate = await checkRateLimit(`auth:verify-email:${ip}`, 10, 60_000);
  if (!rate.ok) {
    return NextResponse.json({ error: "Rate limit" }, { status: 429 });
  }

  const { email, code } = await request.json();
  if (!email || !code) {
    return NextResponse.json({ error: "Missing data" }, { status: 400 });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const user = await getUserByEmail(normalizedEmail);
  if (!user) {
    return NextResponse.json({ error: "Invalid code" }, { status: 400 });
  }

  if (user.emailVerified) {
    const role = user.role || "user";
    const token = signToken({ id: user._id.toString(), username: user.username, role, isAdmin: role === "admin" });
    const response = NextResponse.json({
      user: { id: user._id.toString(), username: user.username, role, isAdmin: role === "admin" }
    });
    response.cookies.set("auth_token", token, getCookieOptions());
    return response;
  }

  const db = await getDb();
  const record = await db.collection("email_verifications").findOne({ userId: user._id });
  if (!record) {
    return NextResponse.json({ error: "Verification code expired" }, { status: 400 });
  }

  if (record.expiresAt && new Date(record.expiresAt).getTime() < Date.now()) {
    return NextResponse.json({ error: "Verification code expired" }, { status: 400 });
  }

  const maxAttempts = 5;
  if (Number(record.attempts || 0) >= maxAttempts) {
    return NextResponse.json({ error: "Too many attempts" }, { status: 429 });
  }

  const expectedHash = record.codeHash;
  const incomingHash = hashCode(String(code).trim());
  if (incomingHash !== expectedHash) {
    await db.collection("email_verifications").updateOne({ userId: user._id }, { $inc: { attempts: 1 } });
    return NextResponse.json({ error: "Invalid code" }, { status: 400 });
  }

  const postVerifyRole = user.role || "user";
  await db.collection("users").updateOne(
    { _id: user._id },
    {
      $set: {
        emailVerified: true,
        emailVerifiedAt: new Date(),
        role: postVerifyRole
      }
    }
  );
  await db.collection("email_verifications").deleteOne({ userId: user._id });

  const role = postVerifyRole;
  const token = signToken({ id: user._id.toString(), username: user.username, role, isAdmin: role === "admin" });
  const response = NextResponse.json({
    user: { id: user._id.toString(), username: user.username, role, isAdmin: role === "admin" }
  });
  response.cookies.set("auth_token", token, getCookieOptions());
  return response;
}
