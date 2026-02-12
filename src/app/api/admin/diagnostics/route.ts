import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { plans } from "@/lib/plans";
import { hasMailConfig } from "@/lib/mailer";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await getAuthUser();
  if (!auth || !auth.isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const mongoPresent = Boolean(process.env.MONGODB_URI);
  const pvsPresent = Boolean(process.env.PVS_OPENAI_API_KEY || process.env.OPENAI_API_KEY);
  const smtpPresent = hasMailConfig();
  let dbOk = false;
  try {
    const db = await getDb();
    await db.command({ ping: 1 });
    dbOk = true;
  } catch {
    dbOk = false;
  }

  return NextResponse.json({
    time: new Date().toISOString(),
    env: {
      mongo: mongoPresent,
      pvsKey: pvsPresent,
      smtp: smtpPresent
    },
    db: {
      ok: dbOk
    },
    ai: {
      model: "gpt-4.1-mini",
      maxTokens: 220
    },
    plans: plans.map((plan) => ({
      id: plan.id,
      priceUah: plan.priceUah,
      credits: plan.aiCreditsMonthly
    }))
  });
}
