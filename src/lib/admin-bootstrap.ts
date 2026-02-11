import crypto from "crypto";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { getJwtSecret } from "@/lib/auth";

type ReserveResult = { ok: true } | { ok: false; error: "disabled" | "invalid" | "used" | "reserved" };

const RESERVATION_TTL_MS = Math.max(
  15 * 60 * 1000,
  Number(process.env.ADMIN_BOOTSTRAP_TTL_HOURS || 2) * 60 * 60 * 1000
);

const globalForAdminBootstrap = globalThis as unknown as {
  adminBootstrapIndexesReady?: boolean;
};

async function ensureIndexes() {
  if (globalForAdminBootstrap.adminBootstrapIndexesReady) return;
  try {
    const db = await getDb();
    await db.collection("admin_bootstrap_tokens").createIndex({ tokenHash: 1 }, { unique: true });
    await db.collection("admin_bootstrap_tokens").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
    globalForAdminBootstrap.adminBootstrapIndexesReady = true;
  } catch {
    // Ignore index creation errors to avoid blocking requests.
  }
}

function getAdminBootstrapToken() {
  const token = process.env.ADMIN_BOOTSTRAP_TOKEN;
  return token ? token.trim() : null;
}

function hashAdminToken(token: string) {
  return crypto.createHash("sha256").update(`${token}:${getJwtSecret()}`).digest("hex");
}

export async function precheckAdminBootstrapToken(token: string): Promise<ReserveResult> {
  await ensureIndexes();
  const envToken = getAdminBootstrapToken();
  if (!envToken) return { ok: false, error: "disabled" };
  if (String(token || "").trim() !== envToken) return { ok: false, error: "invalid" };

  const tokenHash = hashAdminToken(envToken);
  const db = await getDb();
  const existing = await db.collection("admin_bootstrap_tokens").findOne({ tokenHash });
  if (existing?.expiresAt && new Date(existing.expiresAt).getTime() <= Date.now() && !existing.usedAt) {
    await db.collection("admin_bootstrap_tokens").deleteOne({ tokenHash });
    return { ok: true };
  }
  if (existing?.usedAt) return { ok: false, error: "used" };
  if (existing?.reservedBy) return { ok: false, error: "reserved" };
  return { ok: true };
}

export async function reserveAdminBootstrapToken(userId: string, token: string): Promise<ReserveResult> {
  await ensureIndexes();
  const envToken = getAdminBootstrapToken();
  if (!envToken) return { ok: false, error: "disabled" };
  if (String(token || "").trim() !== envToken) return { ok: false, error: "invalid" };

  const tokenHash = hashAdminToken(envToken);
  const db = await getDb();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + RESERVATION_TTL_MS);
  try {
    const result = await db.collection("admin_bootstrap_tokens").findOneAndUpdate(
      { tokenHash, usedAt: { $exists: false }, reservedBy: { $exists: false } },
      {
        $set: {
          tokenHash,
          reservedBy: new ObjectId(userId),
          reservedAt: now,
          expiresAt
        },
        $setOnInsert: {
          createdAt: now
        }
      },
      { upsert: true, returnDocument: "after" }
    );

    if (!result || !result.value || result.value.reservedBy?.toString?.() !== String(userId)) {
      return { ok: false, error: "reserved" };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "reserved" };
  }
}

export async function consumeAdminBootstrapToken(userId: ObjectId) {
  await ensureIndexes();
  const envToken = getAdminBootstrapToken();
  if (!envToken) return false;
  const tokenHash = hashAdminToken(envToken);
  const db = await getDb();

  const record = await db.collection("admin_bootstrap_tokens").findOne({
    tokenHash,
    reservedBy: userId,
    usedAt: { $exists: false }
  });
  if (!record) return false;

  await db.collection("admin_bootstrap_tokens").updateOne(
    { tokenHash },
    {
      $set: { usedAt: new Date(), usedBy: userId },
      $unset: { expiresAt: "", reservedBy: "", reservedAt: "" }
    }
  );
  return true;
}
