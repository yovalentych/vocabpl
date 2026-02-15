import { NextResponse } from "next/server";
import { getCookieOptions } from "@/lib/auth";
import { isCsrfValid } from "@/lib/csrf";

export async function POST(request: Request) {
  if (!isCsrfValid(request)) {
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
  }
  const response = NextResponse.json({ ok: true });
  response.cookies.set("auth_token", "", { ...getCookieOptions(), maxAge: 0 });
  return response;
}
