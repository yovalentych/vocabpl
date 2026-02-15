import { cookies } from "next/headers";

const CSRF_COOKIE = "csrf_token";

export function getCsrfToken() {
  return cookies().get(CSRF_COOKIE)?.value || "";
}

export function isCsrfValid(request: Request) {
  const header =
    request.headers.get("x-csrf-token") ||
    request.headers.get("x-xsrf-token") ||
    "";
  const cookie = getCsrfToken();
  return Boolean(header && cookie && header === cookie);
}
