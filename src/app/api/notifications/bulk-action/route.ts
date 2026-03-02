import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getAuthUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import type { NotificationCategory } from "@/lib/notifications";

export async function POST(request: Request) {
  const auth = await getAuthUser();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { action, ids, category } = body;

  if (!action || !["mark_read", "mark_unread", "archive", "delete"].includes(action)) {
    return NextResponse.json(
      { error: "Invalid action. Must be mark_read, mark_unread, archive, or delete" },
      { status: 400 }
    );
  }

  const db = await getDb();
  const notificationsCol = db.collection("notifications");

  // Build base query
  const query: Record<string, unknown> = {
    userId: new ObjectId(auth.id)
  };

  // If specific IDs provided, use them
  if (ids && Array.isArray(ids) && ids.length > 0) {
    const objectIds = ids
      .filter((id: string) => ObjectId.isValid(id))
      .map((id: string) => new ObjectId(id));

    if (objectIds.length === 0) {
      return NextResponse.json({ error: "No valid notification IDs" }, { status: 400 });
    }

    query._id = { $in: objectIds };
  }
  // Otherwise, if category provided, filter by category
  else if (category) {
    query.category = category as NotificationCategory;
  }

  // Execute bulk action
  let result;

  if (action === "delete") {
    result = await notificationsCol.deleteMany(query);
    return NextResponse.json({
      ok: true,
      deletedCount: result.deletedCount
    });
  }

  // For mark_read, mark_unread, archive
  const updateData: Record<string, unknown> = {};

  switch (action) {
    case "mark_read":
      updateData.status = "read";
      updateData.readAt = new Date();
      break;
    case "mark_unread":
      updateData.status = "unread";
      updateData.readAt = null;
      break;
    case "archive":
      updateData.status = "archived";
      break;
  }

  result = await notificationsCol.updateMany(query, {
    $set: updateData
  });

  return NextResponse.json({
    ok: true,
    modifiedCount: result.modifiedCount
  });
}
