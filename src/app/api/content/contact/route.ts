import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { defaultContactContent } from "@/lib/contact-content";

export const dynamic = "force-dynamic";

export async function GET() {
  const db = await getDb();
  const doc = await db.collection("settings").findOne({ key: "contact_content" });
  const content = doc?.value || defaultContactContent;
  return NextResponse.json({ content });
}
