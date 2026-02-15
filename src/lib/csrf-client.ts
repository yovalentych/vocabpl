export function getCsrfTokenFromCookie() {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(/(?:^|; )csrf_token=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : "";
}

export function withCsrfHeaders(headers?: HeadersInit) {
  const token = getCsrfTokenFromCookie();
  const next = new Headers(headers || {});
  if (token) next.set("x-csrf-token", token);
  return next;
}

export async function csrfFetch(input: RequestInfo, init: RequestInit = {}) {
  let token = getCsrfTokenFromCookie();
  if (!token) {
    try {
      const res = await fetch("/api/csrf");
      const data = await res.json().catch(() => null);
      token = data?.token || "";
    } catch {
      token = "";
    }
  }
  const headers = new Headers(init.headers || {});
  if (token) headers.set("x-csrf-token", token);
  return fetch(input, { ...init, headers });
}
