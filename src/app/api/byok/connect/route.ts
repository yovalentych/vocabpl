import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { setByokCookie } from "@/lib/byok";
import { setByokSession } from "@/lib/byokStore";

export const dynamic = "force-dynamic";

const SESSION_TTL_MS = 12 * 60 * 60 * 1000;
const SESSION_TTL_SECONDS = 12 * 60 * 60;

async function validateKey(apiKey: string) {
  const res = await fetch("https://api.openai.com/v1/models", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${apiKey}`
    }
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    return {
      ok: false,
      error: data?.error?.message || "Invalid key",
      code: data?.error?.code || "",
      type: data?.error?.type || ""
    };
  }
  return { ok: true };
}

export async function POST(request: Request) {
  const payload = await request.json().catch(() => ({}));
  const apiKey = String(payload?.apiKey || "").trim();
  if (!apiKey) {
    return NextResponse.json({ error: "Missing apiKey" }, { status: 400 });
  }

  const validation = await validateKey(apiKey);
  if (!validation.ok) {
    return NextResponse.json(
      { error: validation.error || "Invalid apiKey", code: validation.code, type: validation.type },
      { status: 401 }
    );
  }

  const sessionId = randomUUID();
  setByokSession(sessionId, apiKey, SESSION_TTL_MS);
  setByokCookie(sessionId, SESSION_TTL_SECONDS);

  return NextResponse.json({
    ok: true,
    mode: "session",
    expiresAt: new Date(Date.now() + SESSION_TTL_MS).toISOString()
  });
}
