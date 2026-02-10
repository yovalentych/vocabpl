import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { isSubscriptionActive } from "@/lib/subscription";
import { ObjectId } from "mongodb";

const typeMap: Record<
  string,
  "verb" | "adverb" | "adjective" | "slang" | "others" | "soft_swears" | "clean_emotions" | "abbreviations"
> = {
  verbs: "verb",
  adverbs: "adverb",
  adjectives: "adjective",
  slang: "slang",
  others: "others",
  soft_swears: "soft_swears",
  clean_emotions: "clean_emotions",
  abbreviations: "abbreviations"
};

export async function GET(request: NextRequest) {
  const auth = await getAuthUser();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const typesParam = searchParams.get("types");
  let count = Math.min(Number(searchParams.get("count") || 10), 50);

  const db = await getDb();
  const user = await db.collection("users").findOne({ _id: new ObjectId(auth.id) });
  const active = isSubscriptionActive(user?.subscription, auth.isAdmin);
  if (!active) {
    count = Math.min(count, 2);
  }
  const match: Record<string, unknown> = {};

  if (typesParam) {
    const mapped = typesParam
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => typeMap[item])
      .filter(Boolean);
    if (mapped.length > 0) {
      match.type = { $in: mapped };
    }
  } else if (type && typeMap[type]) {
    match.type = typeMap[type];
  }

  const items = await db
    .collection("words")
    .aggregate([{ $match: match }, { $sample: { size: count } }, { $project: { _id: 0 } }])
    .toArray();

  return NextResponse.json({ items, locked: !active });
}
