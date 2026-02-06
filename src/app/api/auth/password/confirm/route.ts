import { NextResponse } from "next/server";
import crypto from "crypto";
import { getJwtSecret, getUserByEmail, hashPassword } from "@/lib/auth";
import { getDb } from "@/lib/db";
export const dynamic = "force-dynamic";


function hashCode(code: string) {
  return crypto.createHash("sha256").update(`${code}:${getJwtSecret()}`).digest("hex");
}

export async function POST(request: Request) {
  const { email, code, newPassword, confirmPassword } = await request.json();
  const normalizedEmail = String(email || "").trim().toLowerCase();
  if (!normalizedEmail || !code || !newPassword || !confirmPassword) {
    return NextResponse.json({ error: "Missing data" }, { status: 400 });
  }
  if (newPassword !== confirmPassword) {
    return NextResponse.json({ error: "Passwords do not match" }, { status: 400 });
  }

  const user = await getUserByEmail(normalizedEmail);
  if (!user) {
    return NextResponse.json({ error: "Invalid code" }, { status: 400 });
  }

  const db = await getDb();
  const record = await db.collection("password_resets").findOne({ userId: user._id });
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

  const incomingHash = hashCode(String(code).trim());
  if (incomingHash !== record.codeHash) {
    await db.collection("password_resets").updateOne({ userId: user._id }, { $inc: { attempts: 1 } });
    return NextResponse.json({ error: "Invalid code" }, { status: 400 });
  }

  const passwordHash = await hashPassword(String(newPassword));
  await db.collection("users").updateOne({ _id: user._id }, { $set: { passwordHash } });
  await db.collection("password_resets").deleteOne({ userId: user._id });

  return NextResponse.json({ ok: true });
}
