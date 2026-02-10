import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { ObjectId } from "mongodb";

// GET all channels
export async function GET() {
  const auth = await getAuthUser();
  if (!auth || !auth.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await getDb();
  const channels = await db
    .collection("videoChannels")
    .find({})
    .sort({ order: 1 })
    .toArray();

  return NextResponse.json({ channels });
}

// POST create new channel
export async function POST(request: Request) {
  const auth = await getAuthUser();
  if (!auth || !auth.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { name, nameUk, description, descriptionUk, channelUrl, thumbnail, order, recommended } = body;

  if (!name || !nameUk || !channelUrl) {
    return NextResponse.json({ error: "Name and channelUrl are required" }, { status: 400 });
  }

  const db = await getDb();
  const result = await db.collection("videoChannels").insertOne({
    name,
    nameUk,
    description: description || "",
    descriptionUk: descriptionUk || "",
    channelUrl,
    thumbnail: thumbnail || "",
    order: order || 0,
    recommended: recommended !== false,
    createdAt: new Date(),
    updatedAt: new Date()
  });

  return NextResponse.json({ ok: true, id: result.insertedId.toString() });
}

// PUT update channel
export async function PUT(request: Request) {
  const auth = await getAuthUser();
  if (!auth || !auth.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { id, name, nameUk, description, descriptionUk, channelUrl, thumbnail, order, recommended } = body;

  if (!id) {
    return NextResponse.json({ error: "ID is required" }, { status: 400 });
  }

  const db = await getDb();
  await db.collection("videoChannels").updateOne(
    { _id: new ObjectId(id) },
    {
      $set: {
        name,
        nameUk,
        description,
        descriptionUk,
        channelUrl,
        thumbnail,
        order,
        recommended,
        updatedAt: new Date()
      }
    }
  );

  return NextResponse.json({ ok: true });
}

// DELETE channel
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
  await db.collection("videoChannels").deleteOne({ _id: new ObjectId(id) });

  return NextResponse.json({ ok: true });
}
