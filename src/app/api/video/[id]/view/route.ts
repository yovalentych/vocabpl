import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { ObjectId } from "mongodb";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const auth = await getAuthUser();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = params;
  if (!id) return NextResponse.json({ error: "Missing video ID" }, { status: 400 });

  const db = await getDb();

  // Check if video exists
  const video = await db.collection("videos").findOne({ _id: new ObjectId(id) });
  if (!video) {
    return NextResponse.json({ error: "Video not found" }, { status: 404 });
  }

  // Add to watched videos (using $addToSet to avoid duplicates)
  await db
    .collection("users")
    .updateOne(
      { _id: new ObjectId(auth.id) },
      { $addToSet: { watchedVideos: id } } as any
    );

  // Increment view count on video
  await db
    .collection("videos")
    .updateOne(
      { _id: new ObjectId(id) },
      { $inc: { views: 1 } } as any
    );

  return NextResponse.json({ ok: true });
}
