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
  const headers = withCsrfHeaders(init.headers);
  return fetch(input, { ...init, headers });
}
