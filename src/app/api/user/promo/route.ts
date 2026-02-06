import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getAuthUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { getExpiryDate, PromoDuration } from "@/lib/promo";
export const dynamic = "force-dynamic";


export async function POST(request: Request) {
  const auth = await getAuthUser();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { code } = await request.json();
  if (!code) return NextResponse.json({ error: "Missing code" }, { status: 400 });

  const db = await getDb();
  const promo = await db.collection("promo_codes").findOne({ code: String(code).trim().toUpperCase() });
  if (!promo) return NextResponse.json({ error: "Invalid code" }, { status: 404 });
  if (promo.redeemedBy) return NextResponse.json({ error: "Code already used" }, { status: 409 });
  if (promo.expiresAt && new Date(promo.expiresAt).getTime() < Date.now()) {
    return NextResponse.json({ error: "Code expired" }, { status: 410 });
  }

  const duration = promo.durationDays === null ? null : Number(promo.durationDays);
  const expiresAt = getExpiryDate(duration as PromoDuration);

  await db.collection("promo_codes").updateOne(
    { code: promo.code },
    { $set: { redeemedBy: auth.id, redeemedAt: new Date() } }
  );

  await db.collection("users").updateOne(
    { _id: new ObjectId(auth.id) },
    {
      $set: {
        subscription: {
          status: "active",
          expiresAt: expiresAt,
          promoCode: promo.code
        }
      }
    }
  );

  return NextResponse.json({ ok: true, subscription: { status: "active", expiresAt, promoCode: promo.code } });
}
