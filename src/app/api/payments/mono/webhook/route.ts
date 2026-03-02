import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { getPlanById } from "@/lib/plans";
import { isMonoConfigured, verifyMonoSignature } from "@/lib/monobank";
import { sendPaymentReceiptEmail } from "@/lib/mailer";
import { notifySubscriptionActivated } from "@/lib/notifications";

export const dynamic = "force-dynamic";

function parseDate(value?: string | number | null) {
  if (!value) return null;
  const date = typeof value === "number" ? new Date(value * 1000) : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  if (!isMonoConfigured()) {
    return NextResponse.json({ error: "Monobank not configured" }, { status: 503 });
  }
  const signature = request.headers.get("x-sign") || request.headers.get("x-signature");
  const valid = await verifyMonoSignature(rawBody, signature);
  if (!valid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const payload = JSON.parse(rawBody || "{}");
  const invoiceId = String(payload?.invoiceId || "");
  if (!invoiceId) return NextResponse.json({ error: "Missing invoiceId" }, { status: 400 });

  const db = await getDb();
  const existing = await db.collection("payments").findOne({ invoiceId });
  const modifiedDate = parseDate(payload?.modifiedDate);

  const incomingModified = modifiedDate?.getTime() || 0;
  const existingModified = existing?.modifiedDate ? new Date(existing.modifiedDate).getTime() : 0;
  if (existing && incomingModified && existingModified && incomingModified <= existingModified) {
    return NextResponse.json({ ok: true });
  }
  if (existing?.status === "success") {
    return NextResponse.json({ ok: true });
  }

  const status = String(payload?.status || "unknown");
  if (["failure", "expired", "reversed"].includes(status)) {
    Sentry.captureMessage("Monobank payment failed", {
      level: "warning",
      extra: { invoiceId, status, reference: payload?.reference }
    });
  }
  const update: Record<string, unknown> = {
    status,
    updatedAt: new Date(),
    modifiedDate: modifiedDate || new Date(),
    raw: payload
  };

  if (!existing) {
    const reference = payload?.reference || payload?.merchantPaymInfo?.reference || "";
    const userIdFromRef =
      typeof reference === "string" && reference.startsWith("pvs_")
        ? reference.split("_")[1]
        : null;
    await db.collection("payments").insertOne({
      invoiceId,
      status,
      raw: payload,
      reference,
      userId: userIdFromRef && ObjectId.isValid(userIdFromRef) ? new ObjectId(userIdFromRef) : undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
      modifiedDate: modifiedDate || new Date()
    });
  } else {
    await db.collection("payments").updateOne({ invoiceId }, { $set: update });
  }

  if (status !== "success" || !existing?.userId) {
    return NextResponse.json({ ok: true });
  }

  const planId = existing.planId ? String(existing.planId) : null;
  const plan = getPlanById(planId);
  const userId = new ObjectId(existing.userId);

  const user = await db.collection("users").findOne({ _id: userId });
  if (!user) return NextResponse.json({ ok: true });

  const currentExpires = user.subscription?.expiresAt ? new Date(user.subscription.expiresAt) : null;
  const baseDate = currentExpires && currentExpires.getTime() > Date.now() ? currentExpires : new Date();
  const nextExpires = new Date(baseDate.getTime() + plan.periodDays * 24 * 60 * 60 * 1000);

  const walletData = payload?.walletData || {};
  const cardToken = walletData?.cardToken || null;
  const cardMask = walletData?.maskedPan || null;
  const walletId = walletData?.walletId || null;

  await db.collection("users").updateOne(
    { _id: userId },
    {
      $set: {
        "subscription.status": "active",
        "subscription.planId": plan.id,
        "subscription.expiresAt": nextExpires,
        "subscription.cancelAtPeriodEnd": false,
        ...(existing.autoRenewRequested
          ? {
              "subscription.autoRenew": true,
              "subscription.cardToken": cardToken,
              "subscription.cardMask": cardMask,
              "subscription.walletId": walletId
            }
          : { "subscription.autoRenew": false })
      }
    }
  );

  // Notification for subscription activation
  try {
    await notifySubscriptionActivated({
      userId,
      userRole: user.role || "user",
      planName: plan.tier || plan.id,
      expiresAt: nextExpires
    });
  } catch (err) {
    console.error("Failed to notify subscription:", err);
  }

  const receiptAlready = Boolean(existing?.receiptSentAt);
  const userEmail = typeof user.email === "string" ? user.email : "";
  if (!receiptAlready && userEmail) {
    const amountMinor = Number(payload?.amount ?? payload?.finalAmount ?? existing?.amount ?? plan.priceUah * 100);
    const amountUah = Number.isFinite(amountMinor) ? amountMinor / 100 : plan.priceUah;
    const planLabel = String(plan.tier || "plan");
    const paidAt = modifiedDate || new Date();
    const receiptUrl =
      (payload?.receiptUrl as string | undefined) ||
      (payload?.paymentInfo?.receiptUrl as string | undefined) ||
      (payload?.merchantPaymInfo?.receiptUrl as string | undefined) ||
      (payload?.invoice?.receiptUrl as string | undefined) ||
      null;

    try {
      await sendPaymentReceiptEmail({
        to: userEmail,
        name: user.name || user.username,
        amountUah,
        planLabel,
        periodDays: plan.periodDays,
        invoiceId,
        paidAt,
        receiptUrl
      });
      await db.collection("payments").updateOne(
        { invoiceId },
        { $set: { receiptSentAt: new Date(), receiptEmail: userEmail, receiptUrl } }
      );
    } catch (error) {
      console.error("[smtp] payment receipt email failed", error);
      Sentry.captureException(error, { extra: { invoiceId, userEmail } });
    }
  }

  return NextResponse.json({ ok: true });
}
