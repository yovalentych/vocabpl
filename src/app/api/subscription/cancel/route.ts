import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getAuthUser } from "@/lib/auth";
import { getDb } from "@/lib/db";

export async function POST() {
  const auth = await getAuthUser();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = await getDb();
  await db.collection("users").updateOne(
    { _id: new ObjectId(auth.id) },
    {
      $set: {
        "subscription.autoRenew": false,
        "subscription.cancelAtPeriodEnd": true,
        "subscription.canceledAt": new Date()
      }
    }
  );

  return NextResponse.json({ ok: true });
}
