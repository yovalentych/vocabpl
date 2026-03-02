import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getAuthUser } from "@/lib/auth";
import { getDb } from "@/lib/db";

export async function GET() {
  const auth = await getAuthUser();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await getDb();
  const notificationsCol = db.collection("notifications");

  // Get total unread count
  const unreadCount = await notificationsCol.countDocuments({
    userId: new ObjectId(auth.id),
    status: "unread"
  });

  // Get unread count by category
  const unreadByCategory = await notificationsCol
    .aggregate([
      {
        $match: {
          userId: new ObjectId(auth.id),
          status: "unread"
        }
      },
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 }
        }
      }
    ])
    .toArray();

  const unreadByCategoryMap: Record<string, number> = {};
  for (const item of unreadByCategory) {
    unreadByCategoryMap[item._id] = item.count;
  }

  return NextResponse.json({
    unreadCount,
    unreadByCategory: unreadByCategoryMap
  });
}
