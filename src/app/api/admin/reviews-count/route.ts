import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
export const dynamic = "force-dynamic";


export async function GET() {
  const auth = await getAuthUser();
  if (!auth || !auth.isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = await getDb();
  const count = await db.collection("workbook_submissions").countDocuments({ status: "pending" });
  return NextResponse.json({ count });
}
