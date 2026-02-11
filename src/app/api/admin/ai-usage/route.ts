import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { ObjectId } from "mongodb";
import { getPlanById, DEFAULT_PLAN_ID } from "@/lib/plans";

export async function GET() {
  const auth = await getAuthUser();
  if (!auth || !auth.isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = await getDb();
  const monthKey = new Date().toISOString().slice(0, 7);
  const users = await db
    .collection("users")
    .find({})
    .project({ username: 1, email: 1, subscription: 1, aiUsage: 1 })
    .toArray();

  const rows = users.map((user) => {
    const planId = user.subscription?.planId || DEFAULT_PLAN_ID;
    const plan = getPlanById(planId);
    const used = user.aiUsage?.month === monthKey ? Number(user.aiUsage?.usedCredits || 0) : 0;
    return {
      id: user._id?.toString?.() || "",
      username: user.username,
      email: user.email,
      planId,
      usedCredits: used,
      limit: plan.aiCreditsMonthly
    };
  });

  rows.sort((a, b) => b.usedCredits - a.usedCredits);

  return NextResponse.json({ month: monthKey, users: rows });
}
