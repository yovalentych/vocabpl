import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getAuthUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { isSubscriptionActive } from "@/lib/subscription";
export const dynamic = "force-dynamic";


const typeMap: Record<string, string> = {
  verbs: "verb",
  adverbs: "adverb",
  adjectives: "adjective",
  slang: "slang",
  others: "others",
  soft_swears: "soft_swears",
  clean_emotions: "clean_emotions",
  abbreviations: "abbreviations",
  aspect_pairs: "aspect_pairs"
};

function shuffle<T>(list: T[]) {
  const copy = list.slice();
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export async function GET(request: NextRequest) {
  const auth = await getAuthUser();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const typesParam = searchParams.get("types") || "";
  const countParam = Math.min(Number(searchParams.get("count") || 5), 50);
  const selected = typesParam
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  const db = await getDb();
  const user = await db.collection("users").findOne({ _id: new ObjectId(auth.id) });
  const active = isSubscriptionActive(user?.subscription, auth.isAdmin);
  const limit = active ? countParam : Math.min(countParam, 2);

  const includeFavorites = selected.includes("favorites");
  const includeMyWords = selected.includes("my_words");
  const wordTypes = selected.filter((type) => typeMap[type]).map((type) => typeMap[type]);

  const pool: any[] = [];

  if (wordTypes.length) {
    const baseWords = await db
      .collection("words")
      .aggregate([{ $match: { type: { $in: wordTypes } } }, { $sample: { size: 500 } }, { $project: { _id: 0 } }])
      .toArray();
    pool.push(...baseWords);
  }

  if (includeFavorites) {
    const favoriteIds = Array.isArray(user?.favorites) ? user?.favorites : [];
    if (favoriteIds.length) {
      const favorites = await db
        .collection("words")
        .find({ id: { $in: favoriteIds } })
        .project({ _id: 0 })
        .toArray();
      pool.push(...favorites);
    }
  }

  if (includeMyWords) {
    const myWords = await db
      .collection("user_words")
      .find({ userId: new ObjectId(auth.id) })
      .project({ _id: 0 })
      .toArray();
    pool.push(...myWords);
  }

  const unique = new Map<string, any>();
  for (const item of pool) {
    const key = `${item.id || ""}|${item.pl}|${item.uk}|${item.type}`;
    if (!unique.has(key)) unique.set(key, item);
  }

  const items = shuffle(Array.from(unique.values())).slice(0, limit);
  return NextResponse.json({ items, locked: !active });
}
