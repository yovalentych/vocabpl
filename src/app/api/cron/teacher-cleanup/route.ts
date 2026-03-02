import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

const GRACE_PERIOD_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

// Verify cron secret
function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.warn("[cron] CRON_SECRET not configured");
    return false;
  }

  const authHeader = request.headers.get("authorization");
  const cronHeader = request.headers.get("x-cron-secret");

  return authHeader === `Bearer ${secret}` || cronHeader === secret;
}

export async function POST(request: Request) {
  // Verify authorization
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await getDb();
  const now = new Date();
  const results = {
    warnings7d: 0,
    warnings3d: 0,
    warnings1d: 0,
    deleted: 0,
    errors: [] as string[],
  };

  try {
    // Find teachers in grace period
    const teachersInGrace = await db
      .collection("users")
      .find({
        "teacherProfile.status": "grace_period",
        "teacherProfile.gracePeriodEndsAt": { $exists: true },
      })
      .toArray();

    for (const teacher of teachersInGrace) {
      try {
        const { teacherProfile } = teacher;
        const graceEnds = new Date(teacherProfile.gracePeriodEndsAt);
        const daysRemaining = Math.ceil((graceEnds.getTime() - now.getTime()) / DAY_MS);
        const warnings = teacherProfile.gracePeriodWarningsSent || [];

        // Check if grace period expired - delete teacher
        if (daysRemaining <= 0) {
          // Archive classes and assignments
          await db.collection("classes").updateMany(
            { teacherId: teacher._id, archivedAt: { $exists: false } },
            {
              $set: {
                archivedAt: now,
                archivedReason: "teacher_deleted",
              },
            }
          );

          await db.collection("assignments").updateMany(
            { teacherId: teacher._id, archivedAt: { $exists: false } },
            {
              $set: {
                archivedAt: now,
                archivedReason: "teacher_deleted",
              },
            }
          );

          // Update teacher status to deleted
          await db.collection("users").updateOne(
            { _id: teacher._id },
            {
              $set: {
                role: "user", // Downgrade to regular user
                "teacherProfile.status": "deleted",
                "teacherProfile.updatedAt": now,
                updatedAt: now,
              },
            }
          );

          // Send deletion email
          try {
            const { sendTeacherDeletionEmail } = await import("@/lib/mailer");
            await sendTeacherDeletionEmail(teacher.email, teacherProfile.fullName);
          } catch (error) {
            console.error("[cron] Failed to send deletion email:", error);
          }

          console.log(`[cron] Deleted teacher ${teacher._id} after grace period`);
          results.deleted++;
          continue;
        }

        // Send warnings at 7, 3, and 1 days
        const { sendGracePeriodWarningEmail } = await import("@/lib/mailer");

        if (daysRemaining === 7 && !warnings.includes("7d")) {
          try {
            await sendGracePeriodWarningEmail(teacher.email, teacherProfile.fullName, 7);
          } catch (error) {
            console.error("[cron] Failed to send 7-day warning:", error);
          }
          await db.collection("users").updateOne(
            { _id: teacher._id },
            {
              $push: { "teacherProfile.gracePeriodWarningsSent": "7d" },
              $set: { "teacherProfile.updatedAt": now, updatedAt: now },
            } as any
          );
          console.log(`[cron] Sent 7-day warning to teacher ${teacher._id}`);
          results.warnings7d++;
        } else if (daysRemaining === 3 && !warnings.includes("3d")) {
          try {
            await sendGracePeriodWarningEmail(teacher.email, teacherProfile.fullName, 3);
          } catch (error) {
            console.error("[cron] Failed to send 3-day warning:", error);
          }
          await db.collection("users").updateOne(
            { _id: teacher._id },
            {
              $push: { "teacherProfile.gracePeriodWarningsSent": "3d" },
              $set: { "teacherProfile.updatedAt": now, updatedAt: now },
            } as any
          );
          console.log(`[cron] Sent 3-day warning to teacher ${teacher._id}`);
          results.warnings3d++;
        } else if (daysRemaining === 1 && !warnings.includes("1d")) {
          try {
            await sendGracePeriodWarningEmail(teacher.email, teacherProfile.fullName, 1);
          } catch (error) {
            console.error("[cron] Failed to send 1-day warning:", error);
          }
          await db.collection("users").updateOne(
            { _id: teacher._id },
            {
              $push: { "teacherProfile.gracePeriodWarningsSent": "1d" },
              $set: { "teacherProfile.updatedAt": now, updatedAt: now },
            } as any
          );
          console.log(`[cron] Sent 1-day warning to teacher ${teacher._id}`);
          results.warnings1d++;
        }
      } catch (error) {
        const errorMsg = `Error processing teacher ${teacher._id}: ${error}`;
        console.error(`[cron] ${errorMsg}`);
        results.errors.push(errorMsg);
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      processed: teachersInGrace.length,
      ...results,
    });
  } catch (error) {
    console.error("[cron] Teacher cleanup failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: String(error),
        timestamp: now.toISOString(),
      },
      { status: 500 }
    );
  }
}
