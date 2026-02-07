import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getAuthUser } from "@/lib/auth";
import { getDb } from "@/lib/db";

export async function POST(request: Request) {
  const auth = await getAuthUser();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { entryId } = await request.json();
  if (!entryId) return NextResponse.json({ error: "Missing entryId" }, { status: 400 });

  const db = await getDb();
  const userId = new ObjectId(auth.id);
  const entry = await db
    .collection("workbook_entries")
    .findOne({ userId, id: String(entryId) }, { projection: { _id: 0 } });
  if (!entry) return NextResponse.json({ error: "Entry not found" }, { status: 404 });

  const existing = await db.collection("workbook_submissions").findOne({ userId, entryId: entry.id });
  if (existing) return NextResponse.json({ error: "Already submitted" }, { status: 409 });

  const submission = {
    id: `submission_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
    entryId: entry.id,
    entryNumber: entry.number,
    userId,
    status: "pending",
    comment: "",
    rating: null,
    issues: [],
    repeats: [],
    praise: "",
    improve: "",
    focus: { grammar: false, vocab: false, style: false },
    reaction: "",
    clarificationRequested: false,
    clarificationReply: "",
    clarificationMessage: "",
    createdAt: new Date(),
    updatedAt: new Date(),
    entrySnapshot: {
      number: entry.number,
      createdAt: entry.createdAt,
      items: entry.items,
      formattedText: entry.formattedText,
      totalPoints: entry.totalPoints
    }
  };

  await db.collection("workbook_submissions").insertOne(submission);

  return NextResponse.json({ submission: { ...submission, userId: undefined } });
}
