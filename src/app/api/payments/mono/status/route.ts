import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { monoInvoiceStatus } from "@/lib/monobank";
import { getDb } from "@/lib/db";
import { ObjectId } from "mongodb";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await getAuthUser();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const invoiceId = searchParams.get("invoiceId");
  if (!invoiceId) return NextResponse.json({ error: "Missing invoiceId" }, { status: 400 });

  const db = await getDb();
  const payment = await db.collection("payments").findOne({ invoiceId, userId: new ObjectId(auth.id) });
  if (!payment) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    const data = await monoInvoiceStatus(invoiceId);
    return NextResponse.json({ status: data?.status || "unknown", data });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
