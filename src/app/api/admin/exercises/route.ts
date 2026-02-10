import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { ObjectId } from "mongodb";

export const dynamic = "force-dynamic";

function validateCloze(content: any) {
  if (!content || !Array.isArray(content.items) || content.items.length === 0) return false;
  for (const item of content.items) {
    if (typeof item.text !== "string" || !Array.isArray(item.gaps)) return false;
    for (const gap of item.gaps) {
      if (typeof gap.index !== "number" || !Array.isArray(gap.answers) || gap.answers.length === 0) return false;
      if (!gap.answers.every((ans: any) => typeof ans === "string" && ans.trim().length > 0)) return false;
    }
  }
  return true;
}

function validateMatch(content: any) {
  if (!content || !Array.isArray(content.pairs) || content.pairs.length === 0) return false;
  for (const pair of content.pairs) {
    if (typeof pair.left !== "string" || typeof pair.right !== "string") return false;
    if (!pair.left.trim() || !pair.right.trim()) return false;
  }
  return true;
}

function validateDialogue(content: any) {
  if (!content || !Array.isArray(content.dialogs) || content.dialogs.length === 0) return false;
  for (const dialog of content.dialogs) {
    if (!Array.isArray(dialog.turns) || dialog.turns.length < 4) return false;
    for (const turn of dialog.turns) {
      if (typeof turn.pl !== "string" || !turn.pl.trim()) return false;
      if (typeof turn.who !== "string" || !turn.who.trim()) return false;
    }
  }
  return true;
}

function validateParaphrase(content: any) {
  if (!content || !Array.isArray(content.items) || content.items.length === 0) return false;
  for (const item of content.items) {
    if (typeof item.sourcePl !== "string" || !item.sourcePl.trim()) return false;
    if (item.constraints && typeof item.constraints !== "object") return false;
  }
  return true;
}

export async function GET() {
  const auth = await getAuthUser();
  if (!auth || !auth.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const db = await getDb();
  const items = await db
    .collection("exercise_materials")
    .find({})
    .sort({ createdAt: -1 })
    .toArray();
  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const auth = await getAuthUser();
  if (!auth || !auth.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const payload = await request.json().catch(() => ({}));
  const type = String(payload?.type || "");
  const level = String(payload?.level || "A1");
  const title = String(payload?.title || "");
  const content = payload?.content;

  if (!type || !content) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  if (type === "cloze" && !validateCloze(content)) {
    return NextResponse.json({ error: "Invalid content" }, { status: 400 });
  }
  if (type === "match" && !validateMatch(content)) {
    return NextResponse.json({ error: "Invalid content" }, { status: 400 });
  }
  if (type === "dialogue" && !validateDialogue(content)) {
    return NextResponse.json({ error: "Invalid content" }, { status: 400 });
  }
  if (type === "paraphrase" && !validateParaphrase(content)) {
    return NextResponse.json({ error: "Invalid content" }, { status: 400 });
  }

  const doc = {
    type,
    level,
    title,
    content,
    createdAt: new Date()
  };
  const db = await getDb();
  const result = await db.collection("exercise_materials").insertOne(doc);
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
  await db.collection("exercise_materials").deleteOne({ _id: new ObjectId(id) });
  return NextResponse.json({ ok: true });
}
