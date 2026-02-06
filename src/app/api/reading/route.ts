import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { isSubscriptionActive } from "@/lib/subscription";
import { ObjectId } from "mongodb";
export const dynamic = "force-dynamic";


export async function GET() {
  const auth = await getAuthUser();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = await getDb();
  const user = await db.collection("users").findOne({ _id: new ObjectId(auth.id) });
  const active = isSubscriptionActive(user?.subscription, auth.isAdmin);
  const limit = active ? 200 : 1;
  const items = await db
    .collection("reading")
    .find({}, { projection: { _id: 0 } })
    .limit(limit)
    .toArray();

  return NextResponse.json({ items, locked: !active });
}
