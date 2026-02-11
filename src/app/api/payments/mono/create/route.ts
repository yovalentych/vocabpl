import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getAuthUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { getPlanById } from "@/lib/plans";
import { buildWalletId, isMonoConfigured, monoCreateInvoice, toMinor } from "@/lib/monobank";

export const dynamic = "force-dynamic";

function getBaseUrl(request: Request) {
  const env = process.env.APP_PUBLIC_URL;
  if (env) return env.replace(/\/$/, "");
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") || "https";
  return host ? `${proto}://${host}` : "";
}

export async function POST(request: Request) {
  const auth = await getAuthUser();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isMonoConfigured()) {
    return NextResponse.json({ error: "Monobank not configured" }, { status: 503 });
  }

  const payload = await request.json().catch(() => ({}));
  const planId = String(payload?.planId || "").trim();
  const autoRenew = Boolean(payload?.autoRenew);
  if (!planId) return NextResponse.json({ error: "Missing planId" }, { status: 400 });

  const plan = getPlanById(planId);
  if (!plan?.id) return NextResponse.json({ error: "Invalid plan" }, { status: 400 });

  const amount = toMinor(plan.priceUah);
  const baseUrl = getBaseUrl(request);
  const redirectUrl = `${baseUrl}/cabinet?payment=mono`;
  const webHookUrl = process.env.MONO_WEBHOOK_URL || `${baseUrl}/api/payments/mono/webhook`;
  const reference = `pvs_${auth.id}_${Date.now()}`;

  const walletId = autoRenew ? buildWalletId(auth.id) : null;
  const invoice = await monoCreateInvoice({
    amount,
    ccy: 980,
    redirectUrl,
    webHookUrl,
    merchantPaymInfo: {
      reference,
      destination: `PVS ${plan.id}`,
      comment: `Plan ${plan.id}`
    },
    saveCardData: autoRenew ? { saveCard: true, walletId } : undefined
  });

  const db = await getDb();
  await db.collection("payments").insertOne({
    userId: new ObjectId(auth.id),
    planId: plan.id,
    amount,
    ccy: 980,
    status: invoice?.status || "created",
    invoiceId: invoice?.invoiceId,
    reference,
    autoRenewRequested: autoRenew,
    walletId,
    createdAt: new Date(),
    updatedAt: new Date()
  });

  return NextResponse.json({ pageUrl: invoice?.pageUrl, invoiceId: invoice?.invoiceId });
}
