import { cookies } from "next/headers";

export const BYOK_COOKIE = "byok_session";

export function getByokCookie() {
  return cookies().get(BYOK_COOKIE)?.value || null;
}

export function setByokCookie(sessionId: string, ttlSeconds: number) {
  cookies().set(BYOK_COOKIE, sessionId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ttlSeconds
  });
}

export function clearByokCookie() {
  cookies().set(BYOK_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0
  });
}
