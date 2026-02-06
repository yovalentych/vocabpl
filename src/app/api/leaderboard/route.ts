import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
export const dynamic = "force-dynamic";


export async function GET() {
  const auth = await getAuthUser();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = await getDb();
  const users = await db
    .collection("users")
    .find({ role: { $ne: "admin" } }, { projection: { username: 1, name: 1, stats: 1 } })
    .sort({ "stats.points": -1 })
    .limit(50)
    .toArray();

  const items = users.map((user, index) => ({
    rank: index + 1,
    username: user.username,
    name: user.name || "",
    points: user.stats?.points || 0,
    wordsStudied: user.stats?.wordsStudied || 0,
    testsTaken: user.stats?.testsTaken || 0
  }));

  return NextResponse.json({ leaderboard: items });
}
