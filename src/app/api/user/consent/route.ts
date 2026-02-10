import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { ObjectId } from "mongodb";

export async function POST(request: Request) {
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
