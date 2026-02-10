import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { mergeBillingPlans } from "@/lib/billing";

export const dynamic = "force-dynamic";

export async function GET() {
  const db = await getDb();
  const doc = await db.collection("settings").findOne({ key: "billing" });
  const blurPlans = Boolean(doc?.blurPlans);
  const plans = mergeBillingPlans(doc?.plans);
  return NextResponse.json({ blurPlans, plans });
}
