import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
export const dynamic = "force-dynamic";


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

const prefixMap: Record<string, string> = {
  verbs: "verb_",
  adverbs: "adv_",
  adjectives: "adj_",
  slang: "slang_",
  others: "other_",
  soft_swears: "soft_",
  clean_emotions: "emo_",
  abbreviations: "abbr_"
};

export async function GET(request: NextRequest) {
  const auth = await getAuthUser();
  if (!auth || !auth.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const kind = searchParams.get("kind") || "";
  const type = typeMap[kind];
  if (!type) {
    return NextResponse.json({ error: "Invalid kind" }, { status: 400 });
  }

  const db = await getDb();
  const ids = await db
    .collection("words")
    .find({ type }, { projection: { _id: 0, id: 1 } })
    .toArray();

  let lastId = "";
  let maxNum = 0;
  for (const entry of ids) {
    const match = String(entry.id || "").match(/(.*?)(\d+)\s*$/);
    if (!match) continue;
    const num = Number(match[2]);
    if (Number.isFinite(num) && num > maxNum) {
      maxNum = num;
      lastId = String(entry.id || "");
    }
  }

  const prefix = lastId ? lastId.replace(/\d+\s*$/, "") : prefixMap[kind] || "";
  const nextNum = maxNum ? maxNum + 1 : 1;
  const nextId = prefix ? `${prefix}${String(nextNum).padStart(3, "0")}` : "";

  return NextResponse.json({ lastId, nextId, type });
}
