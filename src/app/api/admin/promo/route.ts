import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { generatePromoCode, getExpiryDate, PromoDuration } from "@/lib/promo";
export const dynamic = "force-dynamic";


export async function GET() {
  const auth = await getAuthUser();
  if (!auth || !auth.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await getDb();
  const items = await db
    .collection("promo_codes")
    .find({}, { projection: { _id: 0 } })
    .sort({ createdAt: -1 })
    .limit(200)
    .toArray();

  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const auth = await getAuthUser();
  if (!auth || !auth.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { durationDays, customCode } = await request.json();
  const duration = durationDays === null ? null : Number(durationDays);
  const allowed: PromoDuration[] = [null, 7, 30, 182, 365];
  if (!allowed.includes(duration as PromoDuration)) {
    return NextResponse.json({ error: "Invalid duration" }, { status: 400 });
  }

  const code = (customCode || generatePromoCode()).toString().trim().toUpperCase();
  if (!code) {
    return NextResponse.json({ error: "Missing code" }, { status: 400 });
  }

  const db = await getDb();
  const exists = await db.collection("promo_codes").findOne({ code });
  if (exists) {
    return NextResponse.json({ error: "Code already exists" }, { status: 409 });
  }

  const doc = {
    code,
    durationDays: duration,
    createdAt: new Date(),
    createdBy: auth.username,
    redeemedBy: null,
    redeemedAt: null,
    expiresAt: getExpiryDate(duration as PromoDuration)
  };

  await db.collection("promo_codes").insertOne(doc);
  return NextResponse.json({ item: doc });
}
