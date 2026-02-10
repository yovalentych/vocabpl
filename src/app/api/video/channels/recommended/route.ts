import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getDb } from "@/lib/db";

export async function GET() {
  const auth = await getAuthUser();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = await getDb();
  const channels = await db
    .collection("videoChannels")
    .find({ recommended: true })
    .sort({ order: 1 })
    .toArray();

  return NextResponse.json({ channels });
}
