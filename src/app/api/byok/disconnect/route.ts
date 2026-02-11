import { NextResponse } from "next/server";
import { clearByokCookie, getByokCookie } from "@/lib/byok";
import { clearByokSession } from "@/lib/byokStore";

export const dynamic = "force-dynamic";

export async function POST() {
  const sessionId = getByokCookie();
  if (sessionId) {
    await clearByokSession(sessionId);
  }
  clearByokCookie();
  return NextResponse.json({ ok: true });
}
