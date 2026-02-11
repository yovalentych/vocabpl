import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { ObjectId } from "mongodb";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = await getAuthUser();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const payload = await request.json().catch(() => ({}));
  const type = String(payload?.type || payload?.exercise || "");
  const materialId = String(payload?.materialId || `${type}-${Date.now()}`);
  const score = Number(payload?.score || 0);
  const providedPoints = Number(payload?.points || 0);
  const firstOnly = Boolean(payload?.firstOnly);
  const details = payload?.details || {}; // Accept details object

  if (!type) {
    return NextResponse.json({ error: "Missing type" }, { status: 400 });
  }

  // Use provided points if available, otherwise calculate from score
  const points = providedPoints > 0 ? providedPoints : Math.max(0, Math.round(score * 10));
  const isObjectId = ObjectId.isValid(materialId);
  const materialRef = isObjectId ? new ObjectId(materialId) : materialId;
  const db = await getDb();
  if (firstOnly) {
    const existing = await db.collection("exercise_attempts").findOne({
      userId: new ObjectId(auth.id),
      type,
      materialIdRaw: materialId
    });
    if (existing) {
      return NextResponse.json({ ok: true, points: 0, awarded: false });
    }
  }
  await db.collection("exercise_attempts").insertOne({
    userId: new ObjectId(auth.id),
    type,
    materialId: materialRef,
    materialIdRaw: materialId,
    score,
    points,
    details, // Store details
    createdAt: new Date()
  });
  await db.collection("users").updateOne(
    { _id: new ObjectId(auth.id) },
    { $inc: { "stats.points": points, "stats.sessions": 1 } }
  );
  return NextResponse.json({ ok: true, points, awarded: true });
}
