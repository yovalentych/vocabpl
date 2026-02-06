import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getAuthUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { isSubscriptionActive } from "@/lib/subscription";
export const dynamic = "force-dynamic";


function normalizeText(value: string) {
  return value
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function makeId() {
  return `my_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
}

export async function GET(request: NextRequest) {
  const auth = await getAuthUser();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search")?.trim()?.toLowerCase();
  const limit = Math.min(Number(searchParams.get("limit") || 200), 200);
  const offset = Math.max(Number(searchParams.get("offset") || 0), 0);

  const db = await getDb();
  const userId = new ObjectId(auth.id);
  const user = await db.collection("users").findOne({ _id: userId });
  const active = isSubscriptionActive(user?.subscription, auth.isAdmin);
  if (!active) return NextResponse.json({ error: "Subscription required" }, { status: 403 });
  const query: Record<string, unknown> = { userId };
  if (search) {
    query.$or = [
      { pl: { $regex: search, $options: "i" } },
      { uk: { $regex: search, $options: "i" } }
    ];
  }

  const itemsRaw = await db
    .collection("user_words")
    .find(query, { projection: { _id: 0 } })
    .skip(offset)
    .limit(limit)
    .sort({ createdAt: -1 })
    .toArray();

  const items = itemsRaw.map((item) => ({
    ...item,
    pl: normalizeText(String(item.pl || "")),
    uk: normalizeText(String(item.uk || ""))
  }));

  const matchPairs = items.map((item) => ({
    pl: { $regex: `^${escapeRegex(item.pl)}$`, $options: "i" },
    uk: { $regex: `^${escapeRegex(item.uk)}$`, $options: "i" }
  }));
  const dupMap = new Map<string, boolean>();
  if (matchPairs.length) {
    const matches = await db
      .collection("words")
      .find({ $or: matchPairs }, { projection: { _id: 0, pl: 1, uk: 1 } })
      .toArray();
    for (const match of matches) {
      dupMap.set(`${match.pl}|||${match.uk}`, true);
    }
  }

  const enriched = items.map((item) => ({
    ...item,
    duplicate: dupMap.get(`${item.pl}|||${item.uk}`) === true
  }));

  return NextResponse.json({ items: enriched });
}

export async function POST(request: Request) {
  const auth = await getAuthUser();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { pl, uk } = await request.json();
  if (!pl || !uk) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const db = await getDb();
  const userId = new ObjectId(auth.id);
  const user = await db.collection("users").findOne({ _id: userId });
  const active = isSubscriptionActive(user?.subscription, auth.isAdmin);
  if (!active) return NextResponse.json({ error: "Subscription required" }, { status: 403 });
  const normalizedPl = normalizeText(String(pl));
  const normalizedUk = normalizeText(String(uk));
  const exists = await db.collection("user_words").findOne({
    userId,
    pl: normalizedPl,
    uk: normalizedUk
  });
  if (exists) {
    return NextResponse.json({ error: "Already exists" }, { status: 409 });
  }

  const item = {
    id: makeId(),
    userId,
    pl: normalizedPl,
    uk: normalizedUk,
    type: "my_words",
    pos: "custom",
    source: "user",
    createdAt: new Date()
  };

  await db.collection("user_words").insertOne(item);
  await db.collection("users").updateOne(
    { _id: userId },
    { $inc: { "stats.points": 2, "stats.wordsStudied": 1 } }
  );

  return NextResponse.json({ item });
}

export async function DELETE(request: NextRequest) {
  const auth = await getAuthUser();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const db = await getDb();
  const userId = new ObjectId(auth.id);
  const user = await db.collection("users").findOne({ _id: userId });
  const active = isSubscriptionActive(user?.subscription, auth.isAdmin);
  if (!active) return NextResponse.json({ error: "Subscription required" }, { status: 403 });
  await db.collection("user_words").deleteOne({ userId, id });
  return NextResponse.json({ ok: true });
}

export async function PUT(request: Request) {
  const auth = await getAuthUser();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, pl, uk } = await request.json();
  if (!id || !pl || !uk) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const db = await getDb();
  const userId = new ObjectId(auth.id);
  const user = await db.collection("users").findOne({ _id: userId });
  const active = isSubscriptionActive(user?.subscription, auth.isAdmin);
  if (!active) return NextResponse.json({ error: "Subscription required" }, { status: 403 });
  const normalizedPl = normalizeText(String(pl));
  const normalizedUk = normalizeText(String(uk));

  const exists = await db.collection("user_words").findOne({
    userId,
    id: { $ne: id },
    pl: normalizedPl,
    uk: normalizedUk
  });
  if (exists) {
    return NextResponse.json({ error: "Already exists" }, { status: 409 });
  }

  await db.collection("user_words").updateOne(
    { userId, id },
    { $set: { pl: normalizedPl, uk: normalizedUk, updatedAt: new Date() } }
  );

  return NextResponse.json({ ok: true });
}
