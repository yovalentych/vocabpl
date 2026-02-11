import { getDb } from "@/lib/db";

type RateLimitResult = {
  ok: boolean;
  remaining: number;
  resetAt: number;
};

const globalForRateLimit = globalThis as unknown as {
  rateLimitIndexesReady?: boolean;
};

async function ensureIndexes() {
  if (globalForRateLimit.rateLimitIndexesReady) return;
  try {
    const db = await getDb();
    const coll = db.collection("rate_limits");
    await coll.createIndex({ key: 1 }, { unique: true });
    await coll.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
    globalForRateLimit.rateLimitIndexesReady = true;
  } catch {
    // Ignore index creation errors to avoid blocking requests.
  }
}

export function getRequestIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  const cfIp = request.headers.get("cf-connecting-ip");
  if (cfIp) return cfIp.trim();
  return "unknown";
}

export async function checkRateLimit(key: string, limit = 20, windowMs = 60_000): Promise<RateLimitResult> {
  await ensureIndexes();
  const db = await getDb();
  const coll = db.collection("rate_limits");
  const now = Date.now();
  const record = await coll.findOne({ key });

  if (!record || (record.resetAt && new Date(record.resetAt).getTime() <= now)) {
    const resetAt = new Date(now + windowMs);
    await coll.updateOne(
      { key },
      {
        $set: {
          key,
          count: 1,
          resetAt,
          expiresAt: new Date(resetAt.getTime() + windowMs)
        }
      },
      { upsert: true }
    );
    return { ok: true, remaining: limit - 1, resetAt: resetAt.getTime() };
  }

  const currentCount = Number(record.count || 0);
  const resetAtMs = record.resetAt ? new Date(record.resetAt).getTime() : now + windowMs;

  if (currentCount >= limit) {
    return { ok: false, remaining: 0, resetAt: resetAtMs };
  }

  await coll.updateOne({ key }, { $inc: { count: 1 } });
  return { ok: true, remaining: Math.max(0, limit - (currentCount + 1)), resetAt: resetAtMs };
}
