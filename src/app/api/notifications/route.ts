import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getAuthUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import type { NotificationCategory, NotificationStatus } from "@/lib/notifications";

export async function GET(request: Request) {
  const auth = await getAuthUser();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category") as NotificationCategory | null;
  const status = searchParams.get("status") as NotificationStatus | null;
  const limit = parseInt(searchParams.get("limit") || "50", 10);
  const offset = parseInt(searchParams.get("offset") || "0", 10);
  const since = searchParams.get("since"); // ISO timestamp for polling

  const db = await getDb();
  const notificationsCol = db.collection("notifications");

  // Build query
  const query: Record<string, unknown> = {
    userId: new ObjectId(auth.id)
  };

  if (category) {
    query.category = category;
  }

  if (status) {
    query.status = status;
  } else {
    // By default, exclude archived
    query.status = { $ne: "archived" };
  }

  if (since) {
    query.createdAt = { $gt: new Date(since) };
  }

  // Execute query
  const [notifications, total, unreadCount] = await Promise.all([
    notificationsCol
      .find(query)
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .toArray(),
    notificationsCol.countDocuments(query),
    notificationsCol.countDocuments({
      userId: new ObjectId(auth.id),
      status: "unread"
    })
  ]);

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
    notifications,
    pagination: {
      total,
      limit,
      offset,
      hasMore: offset + notifications.length < total
    },
    stats: {
      unreadCount,
      unreadByCategory: unreadByCategoryMap
    }
  });
}
