import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { defaultAboutContent } from "@/lib/about-content";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await getAuthUser();
  if (!auth || !auth.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const db = await getDb();
  const doc = await db.collection("settings").findOne({ key: "about_pvs" });
  return NextResponse.json({ content: doc?.value || defaultAboutContent });
}

export async function PUT(request: Request) {
  const auth = await getAuthUser();
  if (!auth || !auth.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const payload = await request.json().catch(() => null);
  if (!payload?.content) {
    return NextResponse.json({ error: "Missing content" }, { status: 400 });
  }
  const db = await getDb();
  const content = {
    ...payload.content,
    updatedAt: new Date().toISOString()
  };
  await db.collection("settings").updateOne(
    { key: "about_pvs" },
    { $set: { key: "about_pvs", value: content } },
    { upsert: true }
  );
  return NextResponse.json({ ok: true, content });
}
