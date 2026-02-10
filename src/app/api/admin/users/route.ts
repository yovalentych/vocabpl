import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getDb } from "@/lib/db";

export async function GET() {
  const auth = await getAuthUser();
  if (!auth || !auth.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await getDb();
  const users = await db
    .collection("users")
    .find({}, { projection: { username: 1, name: 1, role: 1, stats: 1, favorites: 1, createdAt: 1 } })
    .toArray();

  const items = users.map((user) => ({
    id: user._id.toString(),
    username: user.username,
    name: user.name || "",
    role: user.role || "user",
    stats: user.stats || { wordsStudied: 0, sessions: 0, testsTaken: 0 },
    favoritesCount: Array.isArray(user.favorites) ? user.favorites.length : 0,
    createdAt: user.createdAt || null
  }));

  return NextResponse.json({ users: items });
}
