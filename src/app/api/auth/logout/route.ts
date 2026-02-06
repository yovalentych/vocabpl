import { NextResponse } from "next/server";
import { getCookieOptions } from "@/lib/auth";
export const dynamic = "force-dynamic";


export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set("auth_token", "", { ...getCookieOptions(), maxAge: 0 });
  return response;
}
