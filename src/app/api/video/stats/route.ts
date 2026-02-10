import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { ObjectId } from "mongodb";

export async function GET() {
  const auth = await getAuthUser();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = await getDb();
  const user = await db.collection("users").findOne({ _id: new ObjectId(auth.id) });

  // Count watched videos
  const watchedCount = user?.watchedVideos?.length || 0;

  // Count favorites
  const favoritesCount = user?.favoriteVideos?.length || 0;

  // Calculate total watch time (sum of durations of watched videos)
  let totalWatchTime = 0;
  if (user?.watchedVideos && user.watchedVideos.length > 0) {
    const videos = await db
      .collection("videos")
      .find({ _id: { $in: user.watchedVideos.map((id: string) => new ObjectId(id)) } })
      .toArray();
    totalWatchTime = videos.reduce((sum, v) => sum + (v.duration || 0), 0);
  }

  return NextResponse.json({
    watched: watchedCount,
    favorites: favoritesCount,
    watchTime: totalWatchTime
  });
}
