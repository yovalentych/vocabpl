import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { ObjectId } from "mongodb";

export async function GET() {
  const auth = await getAuthUser();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = await getDb();
  const user = await db.collection("users").findOne({ _id: new ObjectId(auth.id) });
  const monthKey = new Date().toISOString().slice(0, 7);
  const aiUsage = user?.aiUsage || { month: null, usedCredits: 0 };
  if (aiUsage.month !== monthKey) {
    await db.collection("users").updateOne(
      { _id: new ObjectId(auth.id) },
      { $set: { "aiUsage.month": monthKey, "aiUsage.usedCredits": 0 } }
    );
  }

  return NextResponse.json({
    user: {
      id: auth.id,
      username: auth.username,
      name: user?.name || "",
      email: user?.email || "",
      emailVerified: user?.emailVerified ?? false,
      role: auth.role || (auth.isAdmin ? "admin" : "user"),
      isAdmin: auth.isAdmin || auth.role === "admin",
      stats: user?.stats || { wordsStudied: 0, sessions: 0, testsTaken: 0, points: 0 },
      favorites: user?.favorites || [],
      wordProgress: user?.wordProgress || [],
      testHistory: user?.testHistory || [],
      subscription: user?.subscription || { status: "free", expiresAt: null, promoCode: null, planId: null },
      aiUsage: aiUsage.month === monthKey ? aiUsage : { month: monthKey, usedCredits: 0 },
      consent: user?.consent || {}
    }
  });
}
