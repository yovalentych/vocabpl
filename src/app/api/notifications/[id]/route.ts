import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getAuthUser } from "@/lib/auth";
import { getDb } from "@/lib/db";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await getAuthUser();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = params;
  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid notification ID" }, { status: 400 });
  }

  const body = await request.json();
  const { status } = body;

  if (!status || !["read", "unread", "archived"].includes(status)) {
    return NextResponse.json(
      { error: "Invalid status. Must be read, unread, or archived" },
      { status: 400 }
    );
  }

  const db = await getDb();
  const notificationsCol = db.collection("notifications");

  const updateData: Record<string, unknown> = { status };

  if (status === "read") {
    updateData.readAt = new Date();
  } else if (status === "unread") {
    updateData.readAt = null;
  }

  const result = await notificationsCol.updateOne(
    {
      _id: new ObjectId(id),
      userId: new ObjectId(auth.id)
    },
    {
      $set: updateData
    }
  );

  if (result.matchedCount === 0) {
    return NextResponse.json(
      { error: "Notification not found or access denied" },
      { status: 404 }
    );
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await getAuthUser();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = params;
  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid notification ID" }, { status: 400 });
  }

  const db = await getDb();
  const notificationsCol = db.collection("notifications");

  const result = await notificationsCol.deleteOne({
    _id: new ObjectId(id),
    userId: new ObjectId(auth.id)
  });

  if (result.deletedCount === 0) {
    return NextResponse.json(
      { error: "Notification not found or access denied" },
      { status: 404 }
    );
  }

  return NextResponse.json({ ok: true });
}
