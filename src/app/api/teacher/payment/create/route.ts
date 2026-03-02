import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getAuthUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { getTeacherPlanById } from "@/lib/plans";
import { buildWalletId, isMonoConfigured, monoCreateInvoice, toMinor } from "@/lib/monobank";
import { isCsrfValid } from "@/lib/csrf";

export const dynamic = "force-dynamic";

function getBaseUrl(request: Request) {
  const env = process.env.APP_PUBLIC_URL;
  if (env) return env.replace(/\/$/, "");
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") || "https";
  return host ? `${proto}://${host}` : "";
}

export async function POST(request: Request) {
  // CSRF validation
  if (!isCsrfValid(request)) {
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
  }

  // Auth check
  const auth = await getAuthUser();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check Monobank configuration
  if (!isMonoConfigured()) {
    return NextResponse.json({ error: "Monobank not configured" }, { status: 503 });
  }

  const db = await getDb();
  const user = await db.collection("users").findOne({ _id: new ObjectId(auth.id) });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (!user.teacherProfile) {
    return NextResponse.json({ error: "Teacher profile not found" }, { status: 404 });
  }

  // Check if in pending_payment state
  if (user.teacherProfile.status !== "pending_payment") {
    return NextResponse.json(
      { error: "Invalid state for payment", code: "INVALID_STATE" },
      { status: 400 }
    );
  }

  const payload = await request.json().catch(() => ({}));
  const autoRenew = Boolean(payload?.autoRenew);

  // Get plan from teacher profile
  const planId = user.teacherProfile.planId;
  const plan = getTeacherPlanById(planId);

  if (!plan) {
    return NextResponse.json({ error: "Invalid teacher plan" }, { status: 400 });
  }

  const amount = toMinor(plan.priceUah);
  const baseUrl = getBaseUrl(request);
  const redirectUrl = `${baseUrl}/cabinet?teacher_payment=success`;
  const webHookUrl = process.env.MONO_WEBHOOK_URL || `${baseUrl}/api/payments/mono/webhook`;
  const reference = `teacher_${auth.id}_${Date.now()}`;

  const walletId = autoRenew ? buildWalletId(auth.id) : null;

  // Create Monobank invoice
  const invoice = await monoCreateInvoice({
    amount,
    ccy: 980,
    redirectUrl,
    webHookUrl,
    merchantPaymInfo: {
      reference,
      destination: `Teacher Registration - ${plan.tier}`,
      comment: `Teacher Plan ${plan.id}`,
    },
    saveCardData: autoRenew ? { saveCard: true, walletId } : undefined,
  });

  // Save payment record
  await db.collection("payments").insertOne({
    userId: new ObjectId(auth.id),
    planId: plan.id,
    amount,
    ccy: 980,
    status: invoice?.status || "created",
    invoiceId: invoice?.invoiceId,
    reference,
    paymentType: "teacher_registration", // Important marker
    autoRenewRequested: autoRenew,
    walletId,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // Update teacher profile with payment tracking
  await db.collection("users").updateOne(
    { _id: new ObjectId(auth.id) },
    {
      $set: {
        "teacherProfile.subscription.autoRenew": autoRenew,
        "teacherProfile.subscription.walletId": walletId || undefined,
        "teacherProfile.updatedAt": new Date(),
        updatedAt: new Date(),
      },
    }
  );

  return NextResponse.json({
    pageUrl: invoice?.pageUrl,
    invoiceId: invoice?.invoiceId,
  });
}
