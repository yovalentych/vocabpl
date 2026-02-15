import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { legalContent } from "@/lib/legal-content";

export const dynamic = "force-dynamic";

export async function GET() {
  const db = await getDb();
  const doc = await db.collection("settings").findOne({ key: "legal_content" });
  const content = doc?.value || legalContent;
  return NextResponse.json({ content });
}
