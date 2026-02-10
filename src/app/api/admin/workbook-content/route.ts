import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { ObjectId } from "mongodb";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await getAuthUser();
  if (!auth || !auth.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const db = await getDb();
  const items = await db.collection("workbookContent").find({}).sort({ createdAt: -1 }).toArray();
  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const auth = await getAuthUser();
  if (!auth || !auth.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const payload = await request.json();
  const type = String(payload?.type || "");
  const title = String(payload?.title || "");
  const prompt = String(payload?.prompt || "");
  if (!type || !prompt) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }
  const db = await getDb();
  const doc = {
    type,
    title,
    prompt,
    createdAt: new Date()
  };
  const result = await db.collection("workbookContent").insertOne(doc);
  return NextResponse.json({ item: { ...doc, _id: result.insertedId } });
}

export async function DELETE(request: Request) {
  const auth = await getAuthUser();
  if (!auth || !auth.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const db = await getDb();
  await db.collection("workbookContent").deleteOne({ _id: new ObjectId(id) });
  return NextResponse.json({ ok: true });
}
