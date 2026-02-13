import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { sendFeedbackEmail } from "@/lib/mailer";
import { checkRateLimit, getRequestIp } from "@/lib/rate-limit";

function isValidEmail(email: string) {
  return /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email);
}

export async function POST(request: Request) {
  const ip = getRequestIp(request);
  const rate = await checkRateLimit(`beta-request:${ip}`, 5, 60_000);
  if (!rate.allowed) {
    return NextResponse.json({ error: "Забагато запитів. Спробуйте пізніше." }, { status: 429 });
  }

  const { name, email, message, promoCode } = await request.json();
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const normalizedName = String(name || "").trim();
  const normalizedMessage = String(message || "").trim();
  const normalizedPromo = String(promoCode || "").trim();

  if (!normalizedEmail || !isValidEmail(normalizedEmail)) {
    return NextResponse.json({ error: "Некоректний email." }, { status: 400 });
  }
  if (!normalizedMessage) {
    return NextResponse.json({ error: "Опишіть мету тестування." }, { status: 400 });
  }

  const db = await getDb();
  const payload = {
    id: `beta_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
    name: normalizedName,
    email: normalizedEmail,
    promoCode: normalizedPromo || null,
    message: normalizedMessage,
    createdAt: new Date()
  };

  await db.collection("beta_requests").insertOne(payload);

  const subject = normalizedPromo
    ? `Beta request (promo: ${normalizedPromo})`
    : "Beta access request";

  const composed = [
    `Name: ${normalizedName || "—"}`,
    `Email: ${normalizedEmail}`,
    normalizedPromo ? `Promo code: ${normalizedPromo}` : null,
    "",
    normalizedMessage
  ]
    .filter(Boolean)
    .join("\n");

  try {
    await sendFeedbackEmail({
      fromName: normalizedName || "Beta request",
      fromEmail: normalizedEmail,
      subject,
      message: composed
    });
  } catch (error) {
    return NextResponse.json({ error: "Не вдалося відправити лист." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
