import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { ObjectId } from "mongodb";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const auth = await getAuthUser();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = params;
  if (!id) return NextResponse.json({ error: "Missing video ID" }, { status: 400 });

  const db = await getDb();

  // Get video
  const video = await db.collection("videos").findOne({ _id: new ObjectId(id) });
  if (!video) {
    return NextResponse.json({ error: "Video not found" }, { status: 404 });
  }

  // Get user data to mark watched and favorite
  const user = await db.collection("users").findOne({ _id: new ObjectId(auth.id) });
  const watchedVideos = user?.watchedVideos || [];
  const favoriteVideos = user?.favoriteVideos || [];

  // Format video data
  const videoData = {
    id: video._id.toString(),
    title: video.title,
    titleUk: video.titleUk,
    description: video.description,
    descriptionUk: video.descriptionUk,
    videoUrl: video.videoUrl,
    provider: video.provider,
    duration: video.duration,
    level: video.level,
    tags: video.tags || [],
    transcript: video.transcript,
    transcriptUk: video.transcriptUk,
    transcriptSource: video.transcriptSource || "manual",
    vocabulary: video.vocabulary || [],
    flashcards: video.flashcards || [],
    mythFacts: video.mythFacts || [],
    openQuestions: video.openQuestions || [],
    isWatched: watchedVideos.includes(id),
    isFavorite: favoriteVideos.includes(id)
  };

  return NextResponse.json({ video: videoData });
}
