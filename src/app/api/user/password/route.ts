import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getAuthUser, hashPassword, verifyPassword } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { isCsrfValid } from "@/lib/csrf";

export async function POST(request: Request) {
  if (!isCsrfValid(request)) {
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
  }
  const auth = await getAuthUser();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { currentPassword, newPassword, confirmPassword } = await request.json();
  if (!currentPassword || !newPassword || !confirmPassword) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }
  if (newPassword !== confirmPassword) {
    return NextResponse.json({ error: "Passwords do not match" }, { status: 400 });
  }

  const db = await getDb();
  const user = await db.collection("users").findOne({ _id: new ObjectId(auth.id) });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const valid = await verifyPassword(currentPassword, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "Invalid current password" }, { status: 401 });
  }

  const passwordHash = await hashPassword(newPassword);
  await db.collection("users").updateOne(
    { _id: new ObjectId(auth.id) },
    { $set: { passwordHash } }
  );

  return NextResponse.json({ ok: true });
}
