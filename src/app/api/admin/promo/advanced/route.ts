import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { ObjectId } from "mongodb";
import { generatePromoCode, type PromoBenefit, type PromoCodeConfig } from "@/lib/promo";

export async function GET() {
  const auth = await getAuthUser();
  if (!auth || !auth.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await getDb();
  const promoCodes = await db
    .collection("promo_codes_advanced")
    .find({})
    .sort({ createdAt: -1 })
    .toArray();

  return NextResponse.json({ promoCodes });
}

export async function POST(request: Request) {
  const auth = await getAuthUser();
  if (!auth || !auth.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const {
    type = "random",
    customCode,
    prefix = "",
    suffix = "",
    durationDays,
    maxUses,
    benefits = [],
    planId,
    expiresAt,
    description = ""
  } = body;

  // Generate code
  const config: PromoCodeConfig = {
    type,
    prefix,
    suffix
  };

  let code = "";
  if (type === "custom" && customCode) {
    code = customCode.trim().toUpperCase();
  } else {
    code = generatePromoCode(config);
  }

  if (!code) {
    return NextResponse.json({ error: "Failed to generate code" }, { status: 400 });
  }

  // Check if code already exists
  const db = await getDb();
  const exists = await db.collection("promo_codes_advanced").findOne({ code });
  if (exists) {
    return NextResponse.json({ error: "Code already exists" }, { status: 409 });
  }

  // Calculate expiration date for the promo code itself (not user subscription)
  let expiresAtDate = null;
  if (expiresAt) {
    expiresAtDate = new Date(expiresAt);
  }

  // Create promo code document
  const promoCode = {
    code,
    durationDays: durationDays || null,
    maxUses: maxUses || null,
    usedCount: 0,
    benefits: benefits as PromoBenefit[],
    planId: planId || null,
    expiresAt: expiresAtDate,
    active: true,
    description,
    createdAt: new Date(),
    createdBy: auth.username,
    users: [] // Array of user IDs who used this code
  };

  await db.collection("promo_codes_advanced").insertOne(promoCode);

  return NextResponse.json({ ok: true, promoCode });
}

export async function PUT(request: Request) {
  const auth = await getAuthUser();
  if (!auth || !auth.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { id, active } = body;

  if (!id) {
    return NextResponse.json({ error: "Missing ID" }, { status: 400 });
  }

  const db = await getDb();
  await db.collection("promo_codes_advanced").updateOne(
    { _id: new ObjectId(id) },
    {
      $set: {
        active,
        updatedAt: new Date()
      }
    }
  );

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const auth = await getAuthUser();
  if (!auth || !auth.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await request.json();

  if (!id) {
    return NextResponse.json({ error: "Missing ID" }, { status: 400 });
  }

  const db = await getDb();
  await db.collection("promo_codes_advanced").deleteOne({ _id: new ObjectId(id) });

  return NextResponse.json({ ok: true });
}
