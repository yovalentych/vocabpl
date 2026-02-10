type ByokEntry = {
  apiKey: string;
  expiresAt: number;
};

const store = new Map<string, ByokEntry>();

export function setByokSession(sessionId: string, apiKey: string, ttlMs: number) {
  store.set(sessionId, { apiKey, expiresAt: Date.now() + ttlMs });
}

export function getByokSession(sessionId: string) {
  const entry = store.get(sessionId);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(sessionId);
    return null;
  }
  return entry;
}

export function clearByokSession(sessionId: string) {
  store.delete(sessionId);
}

type RateState = {
  count: number;
  resetAt: number;
};

const rateMap = new Map<string, RateState>();

export function checkRateLimit(key: string, limit = 20, windowMs = 60_000) {
  const now = Date.now();
  const current = rateMap.get(key);
  if (!current || now > current.resetAt) {
    rateMap.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, resetAt: now + windowMs };
  }
  if (current.count >= limit) {
    return { ok: false, remaining: 0, resetAt: current.resetAt };
  }
  current.count += 1;
  rateMap.set(key, current);
  return { ok: true, remaining: limit - current.count, resetAt: current.resetAt };
}
