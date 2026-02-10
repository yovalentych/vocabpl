import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { ObjectId } from "mongodb";

// GET all categories (including inactive)
export async function GET() {
  const auth = await getAuthUser();
  if (!auth || !auth.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await getDb();
  const categories = await db
    .collection("videoCategories")
    .find({})
    .sort({ order: 1 })
    .toArray();

  return NextResponse.json({ categories });
}

// POST create new category
export async function POST(request: Request) {
  const auth = await getAuthUser();
  if (!auth || !auth.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { name, nameUk, description, descriptionUk, icon, order, active } = body;

  if (!name || !nameUk) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const db = await getDb();
  const result = await db.collection("videoCategories").insertOne({
    name,
    nameUk,
    description: description || "",
    descriptionUk: descriptionUk || "",
    icon: icon || "Video",
    order: order || 0,
    active: active !== false,
    createdAt: new Date(),
    updatedAt: new Date()
  });

  return NextResponse.json({ ok: true, id: result.insertedId.toString() });
}

// PUT update category
export async function PUT(request: Request) {
  const auth = await getAuthUser();
  if (!auth || !auth.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { id, name, nameUk, description, descriptionUk, icon, order, active } = body;

  if (!id) {
    return NextResponse.json({ error: "ID is required" }, { status: 400 });
  }

  const db = await getDb();
  await db.collection("videoCategories").updateOne(
    { _id: new ObjectId(id) },
    {
      $set: {
        name,
        nameUk,
        description,
        descriptionUk,
        icon,
        order,
        active,
        updatedAt: new Date()
      }
    }
  );

  return NextResponse.json({ ok: true });
}

// DELETE category
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
  await db.collection("videoCategories").deleteOne({ _id: new ObjectId(id) });

  return NextResponse.json({ ok: true });
}
