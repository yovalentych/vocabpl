import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { ObjectId } from "mongodb";

export async function GET() {
  const auth = await getAuthUser();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = await getDb();
  const user = await db.collection("users").findOne({ _id: new ObjectId(auth.id) });

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
      subscription: user?.subscription || { status: "free", expiresAt: null, promoCode: null }
    }
  });
}
