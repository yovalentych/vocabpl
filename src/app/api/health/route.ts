import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const mongoPresent = Boolean(process.env.MONGODB_URI);
  const pvsPresent = Boolean(process.env.PVS_OPENAI_API_KEY || process.env.OPENAI_API_KEY);
  let dbOk = false;
  try {
    const db = await getDb();
    await db.command({ ping: 1 });
    dbOk = true;
  } catch {
    dbOk = false;
  }
  return NextResponse.json({
    ok: mongoPresent && pvsPresent && dbOk,
    time: new Date().toISOString(),
    env: {
      mongo: mongoPresent,
      pvsKey: pvsPresent
    },
    db: { ok: dbOk }
  });
}
