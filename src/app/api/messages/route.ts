import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getAuthUser } from "@/lib/auth";
import { getDb } from "@/lib/db";

export async function GET() {
  const auth = await getAuthUser();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = await getDb();
  const submissions = await db
    .collection("workbook_submissions")
    .find({ userId: new ObjectId(auth.id) }, { projection: { _id: 0 } })
    .sort({ updatedAt: -1 })
    .toArray();

  return NextResponse.json({ submissions });
}

export async function POST(request: Request) {
  const auth = await getAuthUser();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, message } = await request.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const db = await getDb();
  await db.collection("workbook_submissions").updateOne(
    { id: String(id), userId: new ObjectId(auth.id) },
    {
      $set: {
        clarificationRequested: true,
        clarificationMessage: String(message || ""),
        updatedAt: new Date()
      }
    }
  );

  return NextResponse.json({ ok: true });
}
