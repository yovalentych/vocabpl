export function isMonoConfigured(): boolean {
  const token = process.env.MONO_ACQUIRING_TOKEN;
  const pubkey = process.env.MONO_PUBKEY_BASE64;

  return !!(token && pubkey);
}

export function getMonoPubKey(): string | null {
  const pubkey = process.env.MONO_PUBKEY_BASE64;
  
  if (!pubkey) {
    return null;
  }

  try {
    // Decode base64 and return
    return Buffer.from(pubkey, 'base64').toString('utf-8');
  } catch (error) {
    console.error("Failed to decode Mono public key:", error);
    return null;
  }
}

export function getMonoConfig() {
  if (!isMonoConfigured()) {
    throw new Error("Monobank configuration is missing");
  }

  return {
    token: process.env.MONO_ACQUIRING_TOKEN!,
    pubkey: process.env.MONO_PUBKEY_BASE64!,
    webhookUrl: process.env.MONO_WEBHOOK_URL,
    walletSecret: process.env.MONO_WALLET_SECRET
  };
}

export function toMinor(amountUAH: number): number {
  // Convert UAH to kopiyky (minor units)
  return Math.round(amountUAH * 100);
}

export function buildWalletId(userId: string): string {
  return `user_${userId}_${Date.now()}`;
}

export async function monoCreateInvoice(params: {
  amount: number;
  ccy: number;
  merchantPaymInfo: {
    reference: string;
    destination: string;
    comment?: string;
  };
  redirectUrl: string;
  webHookUrl: string;
  saveCardData?: {
    saveCard: boolean;
    walletId: string;
  };
}): Promise<{ invoiceId: string; pageUrl: string; status?: string }> {
  if (!isMonoConfigured()) {
    throw new Error("Monobank not configured");
  }

  const config = getMonoConfig();

  // TODO: Implement actual Monobank API call
  console.log("Would create Monobank invoice:", params);

  // Stub response
  return {
    invoiceId: `inv_${Date.now()}`,
    pageUrl: "https://example.com/payment",
    status: "created"
  };
}

export async function monoInvoiceStatus(invoiceId: string): Promise<{
  status: string;
  amount?: number;
  createdDate?: string;
  modifiedDate?: string;
}> {
  if (!isMonoConfigured()) {
    throw new Error("Monobank not configured");
  }

  console.log("Would check Monobank invoice status:", invoiceId);

  return {
    status: "created",
    amount: 0,
    createdDate: new Date().toISOString(),
    modifiedDate: new Date().toISOString()
  };
}

export function verifyMonoSignature(payload: string, signature: string): boolean {
  if (!isMonoConfigured()) {
    console.warn("Monobank not configured, skipping signature verification");
    return false;
  }

  const pubkey = getMonoPubKey();
  if (!pubkey) {
    console.warn("Monobank public key not available");
    return false;
  }

  // TODO: Implement actual signature verification
  console.log("Would verify Monobank signature");
  return true;
}

export async function monoWalletPayment(params: {
  cardToken?: string;
  amount: number;
  ccy?: number;
  webHookUrl?: string;
  redirectUrl?: string;
  initiationKind?: string;
  merchantPaymInfo?: {
    reference: string;
    destination: string;
    comment?: string;
  };
}): Promise<{ success: boolean; transactionId?: string; status?: string; invoiceId?: string }> {
  if (!isMonoConfigured()) {
    throw new Error("Monobank not configured");
  }

  console.log("Would process Monobank wallet payment:", params);

  return {
    success: true,
    transactionId: `txn_${Date.now()}`,
    status: "created",
    invoiceId: `inv_${Date.now()}`
  };
}
