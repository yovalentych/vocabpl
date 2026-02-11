import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getPlanById } from "@/lib/plans";
import { monoWalletPayment, toMinor } from "@/lib/monobank";
import { ObjectId } from "mongodb";

function getBaseUrl(request: Request) {
  const env = process.env.APP_PUBLIC_URL;
  if (env) return env.replace(/\/$/, "");
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") || "https";
  return host ? `${proto}://${host}` : "";
}

export async function POST(request: Request) {
  const secret = request.headers.get("x-cron-secret");
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await getDb();
  const now = new Date();
  const upcoming = new Date(Date.now() + 24 * 60 * 60 * 1000);

  const users = await db
    .collection("users")
    .find({
      "subscription.autoRenew": true,
      "subscription.status": "active",
      "subscription.expiresAt": { $lte: upcoming },
      "subscription.cardToken": { $exists: true, $ne: null }
    })
    .toArray();

  const results = [];

  const baseUrl = getBaseUrl(request);
  const webHookUrl = process.env.MONO_WEBHOOK_URL || `${baseUrl}/api/payments/mono/webhook`;

  for (const user of users) {
    const planId = user.subscription?.planId;
    const plan = getPlanById(planId);
    const amount = toMinor(plan.priceUah);
    const userId = user._id as ObjectId;

    const pending = await db.collection("payments").findOne({
      userId,
      status: { $in: ["created", "processing"] }
    });
    if (pending) {
      results.push({ userId: userId.toString(), skipped: "pending" });
      continue;
    }

    try {
      const reference = `pvs_renew_${userId.toString()}_${Date.now()}`;
      const payment = await monoWalletPayment({
        cardToken: user.subscription?.cardToken,
        amount,
        ccy: 980,
        webHookUrl,
        redirectUrl: `${baseUrl}/cabinet?payment=mono`,
        initiationKind: "merchant",
        merchantPaymInfo: {
          reference,
          destination: `PVS ${plan.id}`,
          comment: `Auto-renew ${plan.id}`
        }
      });

      await db.collection("payments").insertOne({
        userId,
        planId: plan.id,
        amount,
        ccy: 980,
        status: payment?.status || "created",
        invoiceId: payment?.invoiceId,
        reference,
        autoRenewRequested: true,
        source: "recurring",
        createdAt: new Date(),
        updatedAt: new Date()
      });

      results.push({ userId: userId.toString(), ok: true });
    } catch (error) {
      results.push({ userId: userId.toString(), error: (error as Error).message });
    }
  }

  return NextResponse.json({ ok: true, processed: results.length, results });
}
