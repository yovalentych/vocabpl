import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const CSRF_COOKIE = "csrf_token";

function buildCookieOptions() {
  return {
    httpOnly: false,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/"
  };
}

export async function GET() {
  const store = cookies();
  const existing = store.get(CSRF_COOKIE)?.value;
  if (existing) {
    return NextResponse.json({ token: existing });
  }
  const token = crypto.randomUUID();
  const response = NextResponse.json({ token });
  response.cookies.set(CSRF_COOKIE, token, buildCookieOptions());
  return response;
}
