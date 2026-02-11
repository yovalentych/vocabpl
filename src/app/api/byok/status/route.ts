import { NextResponse } from "next/server";
import { getByokCookie } from "@/lib/byok";
import { getByokSession } from "@/lib/byokStore";

export const dynamic = "force-dynamic";

export async function GET() {
  const sessionId = getByokCookie();
  if (!sessionId) {
    return NextResponse.json({ connected: false });
  }
  const entry = await getByokSession(sessionId);
  if (!entry) {
    return NextResponse.json({ connected: false });
  }
  return NextResponse.json({
    connected: true,
    mode: "session",
    expiresAt: new Date(entry.expiresAt).toISOString()
  });
}
