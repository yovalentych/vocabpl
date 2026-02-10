import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getAuthUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { getExpiryDate, PromoDuration } from "@/lib/promo";

export async function POST(request: Request) {
  const auth = await getAuthUser();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { code } = await request.json();
  if (!code) return NextResponse.json({ error: "Missing code" }, { status: 400 });

  const db = await getDb();
  const codeUpper = String(code).trim().toUpperCase();

  // First try advanced promo codes
  const advancedPromo = await db.collection("promo_codes_advanced").findOne({ code: codeUpper });

  if (advancedPromo) {
    // Check if code is active
    if (!advancedPromo.active) {
      return NextResponse.json({ error: "Code is not active" }, { status: 403 });
    }

    // Check if code has expired
    if (advancedPromo.expiresAt && new Date(advancedPromo.expiresAt).getTime() < Date.now()) {
      return NextResponse.json({ error: "Code expired" }, { status: 410 });
    }

    // Check if max uses reached
    if (advancedPromo.maxUses !== null && advancedPromo.usedCount >= advancedPromo.maxUses) {
      return NextResponse.json({ error: "Code fully used" }, { status: 410 });
    }

    // Check if user already used this code
    if (advancedPromo.users && advancedPromo.users.includes(auth.id)) {
      return NextResponse.json({ error: "You already used this code" }, { status: 409 });
    }

    // Calculate subscription expiry
    const duration = advancedPromo.durationDays === null ? null : Number(advancedPromo.durationDays);
    const expiresAt = getExpiryDate(duration as PromoDuration);

    // Update promo code usage
    await db.collection("promo_codes_advanced").updateOne(
      { code: advancedPromo.code },
      {
        $inc: { usedCount: 1 },
        $push: { users: auth.id } as any
      }
    );

    // Update user subscription
    const subscription = {
      status: "active",
      expiresAt: expiresAt,
      promoCode: advancedPromo.code,
      planId: advancedPromo.planId || "basic",
      benefits: advancedPromo.benefits || []
    };

    await db.collection("users").updateOne(
      { _id: new ObjectId(auth.id) },
      {
        $set: { subscription }
      }
    );

    return NextResponse.json({
      ok: true,
      subscription,
      message: "Promo code applied successfully"
    });
  }

  // Fallback to old promo codes for backward compatibility
  const promo = await db.collection("promo_codes").findOne({ code: codeUpper });
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
          promoCode: promo.code,
          planId: "basic"
        }
      }
    }
  );

  return NextResponse.json({ ok: true, subscription: { status: "active", expiresAt, promoCode: promo.code } });
}
