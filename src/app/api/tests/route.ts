import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { isSubscriptionActive } from "@/lib/subscription";
import { ObjectId } from "mongodb";

export async function GET(request: NextRequest) {
  const auth = await getAuthUser();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  const db = await getDb();
  const user = await db.collection("users").findOne({ _id: new ObjectId(auth.id) });
  const active = isSubscriptionActive(user?.subscription, auth.isAdmin);

  if (id) {
    if (!active) {
      return NextResponse.json({ error: "Locked", locked: true }, { status: 403 });
    }
    const test = await db.collection("tests").findOne({ id }, { projection: { _id: 0 } });
    return NextResponse.json({ test });
  }

  if (!active) {
    return NextResponse.json({ tests: [], locked: true });
  }
  const tests = await db
    .collection("tests")
    .find({}, { projection: { _id: 0, questions: 0 } })
    .toArray();

  return NextResponse.json({ tests });
}
