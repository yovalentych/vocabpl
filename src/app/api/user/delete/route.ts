import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getAuthUser } from "@/lib/auth";
import { getDb } from "@/lib/db";

export async function DELETE() {
  const auth = await getAuthUser();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = await getDb();
  const userId = new ObjectId(auth.id);
  const userIdStr = auth.id;
  const user = await db.collection("users").findOne({ _id: userId });

  const results = await Promise.all([
    db.collection("email_verifications").deleteMany({ userId }),
    db.collection("password_resets").deleteMany({ userId }),
    db.collection("feedback").deleteMany({ userId }),
    db.collection("messages").deleteMany({ userId }),
    db.collection("user_notes").deleteMany({ userId }),
    db.collection("user_words").deleteMany({ userId }),
    db.collection("workbook_entries").deleteMany({ userId }),
    db.collection("workbook_submissions").deleteMany({ userId }),
    db.collection("exercise_attempts").deleteMany({ userId }),
    db.collection("test_ai_sessions").deleteMany({ userId }),
    db.collection("comprehension_sessions").deleteMany({ userId }),
    db.collection("data_requests").deleteMany({ userId }),
    db.collection("ai_usage_logs").deleteMany({ userId }),
    db.collection("admin_bootstrap_tokens").deleteMany({ reservedBy: userId, usedAt: { $exists: false } }),
    db.collection("exercise_submissions").deleteMany({ userId: userIdStr }),
    db.collection("describe_attempts").deleteMany({ userId: userIdStr }),
    db.collection("story_attempts").deleteMany({ userId: userIdStr }),
    db.collection("error_reports").deleteMany({ userId: userIdStr }),
    db.collection("content_quality_logs").deleteMany({ userId: userIdStr }),
    db.collection("user_word_progress").deleteMany({ userId: userIdStr }),
    db.collection("user_favorites").deleteMany({ userId: userIdStr }),
    db.collection("user_custom_words").deleteMany({ userId: userIdStr }),
    db.collection("users").deleteOne({ _id: userId })
  ]);

  const deleted = results.reduce((sum, r) => sum + (r?.deletedCount || 0), 0);

  await db.collection("user_deletion_logs").insertOne({
    userId,
    username: user?.username || null,
    email: user?.email || null,
    deletedAt: new Date(),
    deletedCount: deleted,
    initiatedBy: "self"
  });

  return NextResponse.json({ ok: true, deleted });
}
