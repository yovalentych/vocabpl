import crypto from "crypto";

const MONO_API_BASE = process.env.MONO_API_BASE || "https://api.monobank.ua/api/merchant";

function getMonoToken() {
  const token = process.env.MONO_ACQUIRING_TOKEN;
  if (!token) {
    throw new Error("Missing MONO_ACQUIRING_TOKEN");
  }
  return token;
}

export function isMonoConfigured() {
  return Boolean(process.env.MONO_ACQUIRING_TOKEN);
}

export function toMinor(amountUah: number) {
  return Math.round(amountUah * 100);
}

export function buildWalletId(userId: string) {
  const secret = process.env.MONO_WALLET_SECRET || "pvs_wallet";
  return crypto.createHash("sha256").update(`${userId}:${secret}`).digest("hex").slice(0, 32);
}

export async function monoRequest(path: string, body?: Record<string, unknown>) {
  const res = await fetch(`${MONO_API_BASE}${path}`, {
    method: body ? "POST" : "GET",
    headers: {
      "Content-Type": "application/json",
      "X-Token": getMonoToken()
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = data?.errorDescription || data?.error || "Monobank error";
    throw new Error(message);
  }
  return data;
}

export async function monoCreateInvoice(payload: Record<string, unknown>) {
  return monoRequest("/invoice/create", payload);
}

export async function monoInvoiceStatus(invoiceId: string) {
  return monoRequest(`/invoice/status?invoiceId=${encodeURIComponent(invoiceId)}`);
}

export async function monoWalletPayment(payload: Record<string, unknown>) {
  return monoRequest("/wallet/payment", payload);
}

type PubKeyCache = {
  key?: string;
  fetchedAt?: number;
};

const globalForMono = globalThis as unknown as {
  monoPubKey?: PubKeyCache;
};

export async function getMonoPubKey() {
  if (process.env.MONO_PUBKEY_BASE64) {
    const env = process.env.MONO_PUBKEY_BASE64;
    if (env.includes("BEGIN")) return env;
    return Buffer.from(env, "base64").toString("utf8");
  }
  const cached = globalForMono.monoPubKey;
  if (cached?.key && cached?.fetchedAt && Date.now() - cached.fetchedAt < 6 * 60 * 60 * 1000) {
    return cached.key;
  }
  const data = await monoRequest("/pubkey");
  let key = String(data?.key || "");
  if (key && !key.includes("BEGIN")) {
    try {
      key = Buffer.from(key, "base64").toString("utf8");
    } catch {
      // Keep as-is if decoding fails
    }
  }
  globalForMono.monoPubKey = { key, fetchedAt: Date.now() };
  return key;
}

export async function verifyMonoSignature(rawBody: string, signatureBase64: string | null) {
  if (!signatureBase64) return false;
  const key = await getMonoPubKey();
  if (!key) return false;
  const verifier = crypto.createVerify("SHA256");
  verifier.update(rawBody);
  verifier.end();
  const signature = Buffer.from(signatureBase64, "base64");
  return verifier.verify(key, signature);
}
