import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { ObjectId } from "mongodb";

export async function POST(request: Request) {
  const auth = await getAuthUser();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { words } = await request.json();
  if (!Array.isArray(words) || words.length === 0) {
    return NextResponse.json({ error: "Invalid words array" }, { status: 400 });
  }

  const db = await getDb();
  let added = 0;
  let skipped = 0;
  const addedWords: string[] = [];

  for (const word of words) {
    if (!word.pl || !word.uk) {
      skipped++;
      continue;
    }

    // Try to find existing word in words collection
    const existing = await db.collection("words").findOne({
      pl: { $regex: new RegExp(`^${word.pl}$`, "i") }
    });

    let wordId: string;

    if (existing) {
      // Use existing word ID
      wordId = existing.id || existing._id.toString();
    } else {
      // Create custom word (save to user's custom vocabulary)
      // For now, skip if not found in main words collection
      // TODO: Implement custom vocabulary collection if needed
      skipped++;
      continue;
    }

    // Add to favorites
    const result = await db
      .collection("users")
      .updateOne(
        { _id: new ObjectId(auth.id) },
        { $addToSet: { favorites: wordId } }
      );

    if (result.modifiedCount > 0) {
      added++;
      addedWords.push(wordId);
    } else {
      skipped++;
    }
  }

  return NextResponse.json({
    ok: true,
    added,
    skipped,
    addedWords
  });
}
