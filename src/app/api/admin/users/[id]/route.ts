import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getAuthUser } from "@/lib/auth";
import { getDb } from "@/lib/db";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const auth = await getAuthUser();
  if (!auth || !auth.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = params.id;
  if (!id || !ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid user id" }, { status: 400 });
  }

  const db = await getDb();
  const user = await db.collection("users").findOne(
    { _id: new ObjectId(id) },
    {
      projection: {
        username: 1,
        name: 1,
        role: 1,
        stats: 1,
        favorites: 1,
        wordProgress: 1,
        testHistory: 1,
        createdAt: 1
      }
    }
  );

  if (!user) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const favoriteIds = Array.isArray(user.favorites) ? user.favorites : [];
  const progressIds = Array.isArray(user.wordProgress) ? user.wordProgress.map((item: any) => item.wordId) : [];
  const ids = Array.from(new Set([...favoriteIds, ...progressIds].filter(Boolean)));

  const words = ids.length
    ? await db
        .collection("words")
        .find({ id: { $in: ids } })
        .project({ _id: 0, id: 1, pl: 1, uk: 1, type: 1 })
        .toArray()
    : [];

  const wordMap = new Map(words.map((word: any) => [word.id, word]));

  const wordProgress = (user.wordProgress || []).map((entry: any) => ({
    wordId: entry.wordId,
    seenCount: entry.seenCount || 0,
    correctCount: entry.correctCount || 0,
    lastSeen: entry.lastSeen || null,
    word: wordMap.get(entry.wordId) || null
  }));

  const favorites = favoriteIds.map((wordId: string) => wordMap.get(wordId)).filter(Boolean);

  return NextResponse.json({
    user: {
      id: user._id.toString(),
      username: user.username,
      name: user.name || "",
      role: user.role || "user",
      stats: user.stats || { wordsStudied: 0, sessions: 0, testsTaken: 0, points: 0 },
      createdAt: user.createdAt || null
    },
    wordProgress,
    testHistory: user.testHistory || [],
    favorites
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await getAuthUser();
  if (!auth || !auth.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = params.id;
  if (!id || !ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid user id" }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { role } = body;

    if (!role || !["user", "tutor"].includes(role)) {
      return NextResponse.json(
        { error: "Invalid role. Must be 'user' or 'tutor'" },
        { status: 400 }
      );
    }

    const db = await getDb();
    const targetUserId = new ObjectId(id);
    const targetUser = await db.collection("users").findOne({ _id: targetUserId });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Заборонити міняти роль admin
    if (targetUser.role === "admin") {
      return NextResponse.json(
        { error: "Cannot change admin role" },
        { status: 403 }
      );
    }

    await db.collection("users").updateOne(
      { _id: targetUserId },
      { $set: { role: role as "user" | "tutor" } }
    );

    return NextResponse.json({
      success: true,
      message: `User role updated to ${role}`
    });
  } catch (error) {
    console.error("Error updating user role:", error);
    return NextResponse.json(
      { error: "Failed to update user role" },
      { status: 500 }
    );
  }
}
