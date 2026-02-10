import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { ObjectId } from "mongodb";

export async function POST(request: Request) {
  const auth = await getAuthUser();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { requestType, message } = await request.json().catch(() => ({}));
  if (!requestType || !["access", "delete"].includes(requestType)) {
    return NextResponse.json({ error: "Invalid request type" }, { status: 400 });
  }

  const db = await getDb();
  await db.collection("data_requests").insertOne({
    userId: new ObjectId(auth.id),
    type: requestType,
    message: typeof message === "string" ? message.trim() : "",
    status: "new",
    createdAt: new Date()
  });

  return NextResponse.json({ ok: true });
}
