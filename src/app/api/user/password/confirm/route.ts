import { NextResponse } from "next/server";
import crypto from "crypto";
import { getAuthUser, getJwtSecret, hashPassword } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { ObjectId } from "mongodb";

function hashCode(code: string) {
  return crypto.createHash("sha256").update(`${code}:${getJwtSecret()}`).digest("hex");
}

export async function POST(request: Request) {
  const auth = await getAuthUser();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { code, newPassword, confirmPassword } = await request.json();
  if (!code || !newPassword || !confirmPassword) {
    return NextResponse.json({ error: "Missing data" }, { status: 400 });
  }
  if (newPassword !== confirmPassword) {
    return NextResponse.json({ error: "Passwords do not match" }, { status: 400 });
  }

  const db = await getDb();
  const record = await db.collection("password_resets").findOne({ userId: new ObjectId(auth.id) });
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
    await db.collection("password_resets").updateOne({ userId: new ObjectId(auth.id) }, { $inc: { attempts: 1 } });
    return NextResponse.json({ error: "Invalid code" }, { status: 400 });
  }

  const passwordHash = await hashPassword(String(newPassword));
  await db.collection("users").updateOne(
    { _id: new ObjectId(auth.id) },
    { $set: { passwordHash } }
  );
  await db.collection("password_resets").deleteOne({ userId: new ObjectId(auth.id) });

  return NextResponse.json({ ok: true });
}
