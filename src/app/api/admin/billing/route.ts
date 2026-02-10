import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { mergeBillingPlans } from "@/lib/billing";
import { plans as defaultPlans, Plan } from "@/lib/plans";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await getAuthUser();
  if (!auth || !auth.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const db = await getDb();
  const doc = await db.collection("settings").findOne({ key: "billing" });
  return NextResponse.json({
    blurPlans: Boolean(doc?.blurPlans),
    plans: mergeBillingPlans(doc?.plans)
  });
}

export async function POST(request: Request) {
  const auth = await getAuthUser();
  if (!auth || !auth.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json();
  const blurPlans = Boolean(payload?.blurPlans);
  const prices = payload?.prices || {};
  const plans = defaultPlans.map((plan) => ({
    id: plan.id,
    priceUah: Number(prices[plan.id]) || plan.priceUah
  }));

  const db = await getDb();
  await db.collection("settings").updateOne(
    { key: "billing" },
    { $set: { key: "billing", blurPlans, plans } },
    { upsert: true }
  );

  return NextResponse.json({ ok: true, blurPlans, plans });
}
