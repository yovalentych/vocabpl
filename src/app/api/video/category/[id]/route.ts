import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { ObjectId } from "mongodb";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const auth = await getAuthUser();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = params;
  if (!id) return NextResponse.json({ error: "Missing category ID" }, { status: 400 });

  const db = await getDb();

  // Get category info
  const category = await db.collection("videoCategories").findOne({ _id: new ObjectId(id) });
  if (!category) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }

  // Get videos in this category
  // Try both string ID and ObjectId for compatibility
  const videos = await db
    .collection("videos")
    .find({
      $or: [
        { categoryId: id },
        { categoryId: new ObjectId(id) }
      ],
      active: true
    })
    .sort({ order: 1, createdAt: -1 })
    .toArray();

  // Get user data to mark watched and favorite videos
  const user = await db.collection("users").findOne({ _id: new ObjectId(auth.id) });
  const watchedVideos = user?.watchedVideos || [];
  const favoriteVideos = user?.favoriteVideos || [];

  // Add user-specific flags to videos
  const videosWithFlags = videos.map(video => ({
    id: video._id.toString(),
    title: video.title,
    titleUk: video.titleUk,
    description: video.description,
    descriptionUk: video.descriptionUk,
    thumbnail: video.thumbnail,
    duration: video.duration,
    level: video.level,
    views: video.views || 0,
    isWatched: watchedVideos.includes(video._id.toString()),
    isFavorite: favoriteVideos.includes(video._id.toString())
  }));

  return NextResponse.json({ category, videos: videosWithFlags });
}
