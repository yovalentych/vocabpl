import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "";
  const db = await getDb();
  const query = type ? { type } : {};
  const items = await db.collection("workbookContent").find(query).sort({ createdAt: -1 }).toArray();
  return NextResponse.json({ items });
}
