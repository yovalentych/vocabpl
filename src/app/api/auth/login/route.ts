import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getCookieOptions, getUserByEmail, getUserByUsername, signToken, verifyPassword } from "@/lib/auth";
import { checkRateLimit, getRequestIp } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const ip = getRequestIp(request);
  const rate = await checkRateLimit(`auth:login:${ip}`, 10, 60_000);
  if (!rate.ok) {
    return NextResponse.json({ error: "Rate limit" }, { status: 429 });
  }

  const { username, identifier, password } = await request.json();

  const loginId = String(identifier ?? username ?? "").trim();
  if (!loginId || !password) {
    return NextResponse.json({ error: "Missing credentials" }, { status: 400 });
  }

  const user = loginId.includes("@") ? await getUserByEmail(loginId) : await getUserByUsername(loginId);
  if (!user) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  if (user.email && user.emailVerified === false) {
    return NextResponse.json({ error: "Email not verified", code: "EMAIL_NOT_VERIFIED", email: user.email }, { status: 403 });
  }

  const isValid = await verifyPassword(password, user.passwordHash);
  if (!isValid) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const role = user.role || "user";
  if (!user.role) {
    const db = await getDb();
    await db.collection("users").updateOne({ _id: user._id }, { $set: { role } });
  }
  const token = signToken({ id: user._id.toString(), username: user.username, role, isAdmin: role === "admin" });
  const response = NextResponse.json({
    user: { id: user._id.toString(), username: user.username, role, isAdmin: role === "admin" }
  });
  response.cookies.set("auth_token", token, getCookieOptions());
  return response;
}
