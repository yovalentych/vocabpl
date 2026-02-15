import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getAuthUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { isCsrfValid } from "@/lib/csrf";

export async function POST(request: Request) {
  if (!isCsrfValid(request)) {
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
  }
  const auth = await getAuthUser();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = await getDb();
  const user = await db.collection("users").findOne({ _id: new ObjectId(auth.id) });
  if (!user?.subscription?.cardToken) {
    return NextResponse.json({ error: "Missing saved payment method" }, { status: 400 });
  }

  await db.collection("users").updateOne(
    { _id: new ObjectId(auth.id) },
    {
      $set: {
        "subscription.autoRenew": true,
        "subscription.cancelAtPeriodEnd": false
      }
    }
  );

  return NextResponse.json({ ok: true });
}
