import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { ObjectId } from "mongodb";

export async function GET() {
  const auth = await getAuthUser();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = await getDb();
  const user = await db.collection("users").findOne({ _id: new ObjectId(auth.id) });
  return NextResponse.json({ favorites: user?.favorites || [] });
}

export async function POST(request: Request) {
  const auth = await getAuthUser();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { wordId } = await request.json();
  if (!wordId) return NextResponse.json({ error: "Missing wordId" }, { status: 400 });

  const db = await getDb();
  await db
    .collection("users")
    .updateOne({ _id: new ObjectId(auth.id) }, { $addToSet: { favorites: wordId } });

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const auth = await getAuthUser();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { wordId } = await request.json();
  if (!wordId) return NextResponse.json({ error: "Missing wordId" }, { status: 400 });

  const db = await getDb();
  await db
    .collection("users")
    .updateOne({ _id: new ObjectId(auth.id) }, { $pull: { favorites: wordId } } as any);

  return NextResponse.json({ ok: true });
}
