import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { ObjectId } from "mongodb";

// GET all videos
export async function GET() {
  const auth = await getAuthUser();
  if (!auth || !auth.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await getDb();
  const videos = await db
    .collection("videos")
    .find({})
    .sort({ createdAt: -1 })
    .toArray();

  return NextResponse.json({ videos });
}

// POST create new video
export async function POST(request: Request) {
  const auth = await getAuthUser();
  if (!auth || !auth.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const {
    title,
    titleUk,
    description,
    descriptionUk,
    videoUrl,
    provider,
    thumbnail,
    duration,
    level,
    categoryId,
    tags,
    transcript,
    transcriptUk,
    transcriptSource,
    vocabulary,
    flashcards,
    mythFacts,
    openQuestions,
    order,
    active
  } = body;

  if (!title || !titleUk || !videoUrl || !categoryId) {
    return NextResponse.json(
      { error: "Title, videoUrl, and categoryId are required" },
      { status: 400 }
    );
  }

  const db = await getDb();
  const result = await db.collection("videos").insertOne({
    title,
    titleUk,
    description: description || "",
    descriptionUk: descriptionUk || "",
    videoUrl,
    provider: provider || "youtube",
    thumbnail: thumbnail || "",
    duration: duration || 0,
    level: level || "A1",
    categoryId,
    tags: tags || [],
    transcript: transcript || "",
    transcriptUk: transcriptUk || "",
    transcriptSource: transcriptSource || "manual",
    vocabulary: vocabulary || [],
    flashcards: flashcards || [],
    mythFacts: mythFacts || [],
    openQuestions: openQuestions || [],
    order: order || 0,
    active: active !== false,
    views: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  });

  return NextResponse.json({ ok: true, id: result.insertedId.toString() });
}

// PUT update video
export async function PUT(request: Request) {
  const auth = await getAuthUser();
  if (!auth || !auth.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const {
    id,
    title,
    titleUk,
    description,
    descriptionUk,
    videoUrl,
    provider,
    thumbnail,
    duration,
    level,
    categoryId,
    tags,
    transcript,
    transcriptUk,
    transcriptSource,
    vocabulary,
    flashcards,
    mythFacts,
    openQuestions,
    order,
    active
  } = body;

  if (!id) {
    return NextResponse.json({ error: "ID is required" }, { status: 400 });
  }

  const db = await getDb();
  await db.collection("videos").updateOne(
    { _id: new ObjectId(id) },
    {
      $set: {
        title,
        titleUk,
        description,
        descriptionUk,
        videoUrl,
        provider,
        thumbnail,
        duration,
        level,
        categoryId,
        tags,
        transcript,
        transcriptUk,
        transcriptSource,
        vocabulary,
        flashcards,
        mythFacts,
        openQuestions,
        order,
        active,
        updatedAt: new Date()
      }
    }
  );

  return NextResponse.json({ ok: true });
}

// DELETE video
export async function DELETE(request: Request) {
  const auth = await getAuthUser();
  if (!auth || !auth.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await request.json();

  if (!id) {
    return NextResponse.json({ error: "ID is required" }, { status: 400 });
  }

  const db = await getDb();
  await db.collection("videos").deleteOne({ _id: new ObjectId(id) });

  return NextResponse.json({ ok: true });
}
