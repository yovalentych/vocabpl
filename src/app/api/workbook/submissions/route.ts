import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getAuthUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
export const dynamic = "force-dynamic";


export async function GET() {
  const auth = await getAuthUser();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = await getDb();
  const submissions = await db
    .collection("workbook_submissions")
    .find({ userId: new ObjectId(auth.id) }, { projection: { _id: 0 } })
    .sort({ createdAt: -1 })
    .toArray();

  return NextResponse.json({ submissions });
}
