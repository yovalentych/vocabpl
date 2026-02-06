export function getCookie(name: string) {
  if (typeof document === "undefined") return "";
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift() || "";
  return "";
}

export function setCookie(name: string, value: string, maxAgeSeconds: number) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=${value}; max-age=${maxAgeSeconds}; path=/; samesite=lax`;
}

export function hasConsent() {
  return getCookie("cookie_consent") === "accepted";
}

export function readPrefs() {
  try {
    const raw = getCookie("site_prefs");
    if (!raw) return null;
    return JSON.parse(decodeURIComponent(raw));
  } catch {
    return null;
  }
}

export function writePrefs(next: Record<string, unknown>) {
  setCookie("site_prefs", encodeURIComponent(JSON.stringify(next)), 60 * 60 * 24 * 180);
}
