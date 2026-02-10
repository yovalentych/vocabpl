import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { ObjectId } from "mongodb";
import { getPlanById } from "@/lib/plans";

export async function GET() {
  const auth = await getAuthUser();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = await getDb();
  const user = await db.collection("users").findOne({ _id: new ObjectId(auth.id) });
  const monthKey = new Date().toISOString().slice(0, 7);
  const planId = user?.subscription?.planId || "basic";
  const plan = getPlanById(planId);
  const usedCredits =
    user?.aiUsage?.month === monthKey ? Number(user?.aiUsage?.usedCredits || 0) : 0;

  const logs = await db
    .collection("ai_usage_logs")
    .find({ userId: new ObjectId(auth.id) })
    .sort({ createdAt: -1 })
    .limit(20)
    .toArray();

  return NextResponse.json({
    usage: {
      month: monthKey,
      usedCredits,
      limit: plan.aiCreditsMonthly
    },
    logs: logs.map((log) => ({
      id: log._id?.toString?.() || "",
      mode: log.mode,
      credits: log.credits,
      createdAt: log.createdAt
    }))
  });
}
