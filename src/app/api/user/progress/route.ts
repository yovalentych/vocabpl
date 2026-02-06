import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { ObjectId } from "mongodb";
export const dynamic = "force-dynamic";


export async function POST(request: Request) {
  const auth = await getAuthUser();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { wordsStudied = 0, sessions = 0, testsTaken = 0 } = await request.json();
  const db = await getDb();

  await db.collection("users").updateOne(
    { _id: new ObjectId(auth.id) },
    {
      $inc: {
        "stats.wordsStudied": Number(wordsStudied) || 0,
        "stats.sessions": Number(sessions) || 0,
        "stats.testsTaken": Number(testsTaken) || 0
      }
    }
  );

  return NextResponse.json({ ok: true });
}
