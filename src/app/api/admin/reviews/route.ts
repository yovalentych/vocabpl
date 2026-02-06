import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getAuthUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
export const dynamic = "force-dynamic";


export async function GET(request: Request) {
  const auth = await getAuthUser();
  if (!auth || !auth.isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  const db = await getDb();
  const query: Record<string, unknown> = {};
  if (status) query.status = status;

  const submissions = await db
    .collection("workbook_submissions")
    .find(query, { projection: { _id: 0 } })
    .sort({ createdAt: -1 })
    .limit(200)
    .toArray();

  const userIds = submissions.map((item: any) => item.userId).filter(Boolean);
  const users = await db
    .collection("users")
    .find({ _id: { $in: userIds } }, { projection: { username: 1, name: 1 } })
    .toArray();
  const userMap = new Map<string, { username: string; name?: string }>();
  for (const user of users) {
    userMap.set(user._id.toString(), { username: user.username, name: user.name });
  }

  const enriched = submissions.map((item: any) => ({
    ...item,
    user: userMap.get(item.userId?.toString?.() || "") || null
  }));

  return NextResponse.json({ submissions: enriched });
}

export async function POST(request: Request) {
  const auth = await getAuthUser();
  if (!auth || !auth.isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const {
    id,
    comment,
    status,
    rating,
    issues,
    repeats,
    praise,
    improve,
    focus,
    reaction,
    correctedText,
    clarificationReply
  } = await request.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const db = await getDb();
  await db.collection("workbook_submissions").updateOne(
    { id: String(id) },
    {
      $set: {
        comment: String(comment || ""),
        status: status || "reviewed",
        rating: typeof rating === "number" ? rating : null,
        issues: Array.isArray(issues) ? issues : [],
        repeats: Array.isArray(repeats) ? repeats : [],
        praise: String(praise || ""),
        improve: String(improve || ""),
        focus: focus && typeof focus === "object" ? focus : { grammar: false, vocab: false, style: false },
        reaction: String(reaction || ""),
        correctedText: String(correctedText || ""),
        clarificationReply: String(clarificationReply || ""),
        reviewedAt: new Date(),
        updatedAt: new Date()
      }
    }
  );

  return NextResponse.json({ ok: true });
}
