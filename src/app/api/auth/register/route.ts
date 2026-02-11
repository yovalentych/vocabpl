import { NextResponse } from "next/server";
import crypto from "crypto";
import { createUser, getCookieOptions, getJwtSecret, getUserByEmail, getUserByUsername } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { getExpiryDate, PromoDuration } from "@/lib/promo";
import { ObjectId } from "mongodb";
import { sendVerificationEmail } from "@/lib/mailer";
import { checkRateLimit, getRequestIp } from "@/lib/rate-limit";
import { precheckAdminBootstrapToken, reserveAdminBootstrapToken } from "@/lib/admin-bootstrap";

const CODE_TTL_MINUTES = 15;

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function hashCode(code: string) {
  return crypto.createHash("sha256").update(`${code}:${getJwtSecret()}`).digest("hex");
}

export async function POST(request: Request) {
  const ip = getRequestIp(request);
  const rate = await checkRateLimit(`auth:register:${ip}`, 5, 60_000);
  if (!rate.ok) {
    return NextResponse.json({ error: "Rate limit" }, { status: 429 });
  }

  const { username, password, confirmPassword, name, promoCode, email, acceptTerms, marketingOptIn, adminToken } = await request.json();

  if (!username || !password || !confirmPassword || !name || !email) {
    return NextResponse.json({ error: "Missing credentials" }, { status: 400 });
  }
  if (!acceptTerms) {
    return NextResponse.json({ error: "Terms not accepted" }, { status: 400 });
  }
  if (!isValidEmail(String(email))) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }
  if (password !== confirmPassword) {
    return NextResponse.json({ error: "Passwords do not match" }, { status: 400 });
  }

  const normalizedUsername = String(username).trim();
  const normalizedEmail = String(email).trim().toLowerCase();

  if (adminToken) {
    const precheck = await precheckAdminBootstrapToken(String(adminToken));
    if (!precheck.ok) {
      const status = precheck.error === "invalid" ? 401 : 409;
      return NextResponse.json({ error: "Admin token not available" }, { status });
    }
  }

  const existing = await getUserByUsername(normalizedUsername);
  if (existing) {
    return NextResponse.json({ error: "Username already exists" }, { status: 409 });
  }

  const existingEmail = await getUserByEmail(normalizedEmail);
  if (existingEmail) {
    return NextResponse.json({ error: "Email already exists" }, { status: 409 });
  }

  const forwardedFor = request.headers.get("x-forwarded-for");
  const ip = forwardedFor ? forwardedFor.split(",")[0]?.trim() : null;
  const userAgent = request.headers.get("user-agent");
  const consentAt = new Date();

  const user = await createUser({
    username: normalizedUsername,
    password,
    name,
    email: normalizedEmail,
    consent: {
      termsAt: consentAt,
      privacyAt: consentAt,
      marketingAt: marketingOptIn ? consentAt : null,
      ip,
      userAgent
    }
  });

  if (promoCode) {
    const db = await getDb();
    const promo = await db.collection("promo_codes").findOne({ code: String(promoCode).trim().toUpperCase() });
    if (promo && !promo.redeemedBy && (!promo.expiresAt || new Date(promo.expiresAt).getTime() > Date.now())) {
      const duration = promo.durationDays === null ? null : Number(promo.durationDays);
      const expiresAt = getExpiryDate(duration as PromoDuration);
      await db.collection("promo_codes").updateOne(
        { code: promo.code },
        { $set: { redeemedBy: user.id, redeemedAt: new Date() } }
      );
      await db.collection("users").updateOne(
        { _id: new ObjectId(user.id) },
        {
          $set: {
            subscription: {
              status: "active",
              expiresAt,
              promoCode: promo.code
            }
          }
        }
      );
    }
  }

  const code = generateCode();
  const codeHash = hashCode(code);
  const expiresAt = new Date(Date.now() + CODE_TTL_MINUTES * 60 * 1000);

  const db = await getDb();

  if (adminToken) {
    const reserved = await reserveAdminBootstrapToken(user.id, String(adminToken));
    if (!reserved.ok) {
      await db.collection("users").deleteOne({ _id: new ObjectId(user.id) });
      return NextResponse.json({ error: "Admin token not available" }, { status: 409 });
    }
  }

  await db.collection("email_verifications").updateOne(
    { userId: new ObjectId(user.id) },
    {
      $set: {
        userId: new ObjectId(user.id),
        codeHash,
        expiresAt,
        sentAt: new Date(),
        attempts: 0
      }
    },
    { upsert: true }
  );

  try {
    await sendVerificationEmail(normalizedEmail, code);
  } catch (error) {
    return NextResponse.json({ error: "Failed to send verification email" }, { status: 500 });
  }

  const response = NextResponse.json({ pendingVerification: true, email: normalizedEmail });
  response.cookies.set("auth_token", "", { ...getCookieOptions(), maxAge: 0 });
  return response;
}
