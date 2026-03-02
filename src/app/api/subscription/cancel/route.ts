import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getAuthUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { isCsrfValid } from "@/lib/csrf";
import { notifySubscriptionCancelled } from "@/lib/notifications";

export async function POST(request: Request) {
  if (!isCsrfValid(request)) {
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
  }
  const auth = await getAuthUser();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = await getDb();
  const user = await db.collection("users").findOne({ _id: new ObjectId(auth.id) });

  await db.collection("users").updateOne(
    { _id: new ObjectId(auth.id) },
    {
      $set: {
        "subscription.autoRenew": false,
        "subscription.cancelAtPeriodEnd": true,
        "subscription.canceledAt": new Date()
      }
    }
  );

  // Notification
  if (user) {
    try {
      await notifySubscriptionCancelled({
        userId: new ObjectId(auth.id),
        userRole: user.role || "user",
        planName: user.subscription?.planId || "Основний",
        expiresAt: user.subscription?.expiresAt
      });
    } catch (err) {
      console.error("Failed to notify:", err);
    }
  }

  return NextResponse.json({ ok: true });
}
