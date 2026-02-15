import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const CSRF_COOKIE = "csrf_token";

function shouldSetCsrf(pathname: string) {
  return !pathname.startsWith("/_next");
}

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const host = request.headers.get("host") || "";

  if (host.startsWith("www.")) {
    const bareHost = host.replace(/^www\./, "");
    url.hostname = bareHost;
    return NextResponse.redirect(url, 308);
  }

  const response = NextResponse.next();
  if (shouldSetCsrf(url.pathname)) {
    const existing = request.cookies.get(CSRF_COOKIE)?.value;
    if (!existing) {
      const token = crypto.randomUUID();
      response.cookies.set(CSRF_COOKIE, token, {
        httpOnly: false,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/"
      });
    }
  }

  return response;
}

export const config = {
  matcher: "/:path*"
};
