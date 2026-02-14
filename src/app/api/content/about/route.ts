import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { defaultAboutContent } from "@/lib/about-content";

export const dynamic = "force-dynamic";

export async function GET() {
  const db = await getDb();
  const doc = await db.collection("settings").findOne({ key: "about_pvs" });
  const content = doc?.value || defaultAboutContent;
  return NextResponse.json({ content });
}
