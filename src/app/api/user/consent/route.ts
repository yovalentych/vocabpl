import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { ObjectId } from "mongodb";
import { isCsrfValid } from "@/lib/csrf";

export async function POST(request: Request) {
  if (!isCsrfValid(request)) {
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
  }
  const auth = await getAuthUser();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { marketingOptIn } = await request.json().catch(() => ({}));
  const consentAt = marketingOptIn ? new Date() : null;

  const db = await getDb();
  await db.collection("users").updateOne(
    { _id: new ObjectId(auth.id) },
    { $set: { "consent.marketingAt": consentAt } }
  );

  return NextResponse.json({ ok: true, marketingAt: consentAt });
}
