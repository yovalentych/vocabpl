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
  let limit = Math.min(Number(searchParams.get("limit") || 200), 2000);
  const offset = Math.max(Number(searchParams.get("offset") || 0), 0);
  const search = searchParams.get("search")?.trim();
  const idsParam = searchParams.get("ids");

  const db = await getDb();
  const user = await db.collection("users").findOne({ _id: new ObjectId(auth.id) });
  const active = isSubscriptionActive(user?.subscription, auth.isAdmin);
  if (!active) {
    limit = Math.min(limit, 2);
  }
  const query: Record<string, unknown> = {};

  if (type && typeMap[type]) {
    query.type = typeMap[type];
  }

  if (search) {
    query.$or = [
      { pl: { $regex: search, $options: "i" } },
      { uk: { $regex: search, $options: "i" } }
    ];
  }

  if (idsParam) {
    const ids = idsParam.split(",").map((id) => id.trim()).filter(Boolean);
    if (ids.length) {
      query.id = { $in: ids };
    }
  }

  const items = await db
    .collection("words")
    .find(query)
    .skip(offset)
    .limit(limit)
    .project({ _id: 0 })
    .toArray();

  return NextResponse.json({ items, locked: !active });
}
