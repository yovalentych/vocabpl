import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const level = searchParams.get("level");
  const query: Record<string, string> = {};
  if (type) query.type = type;
  if (level) query.level = level;
  const db = await getDb();
  const items = await db.collection("exercise_materials").find(query).sort({ createdAt: -1 }).toArray();
  return NextResponse.json({ items });
}
