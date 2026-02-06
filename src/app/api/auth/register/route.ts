import { NextResponse } from "next/server";
import crypto from "crypto";
import { createUser, getCookieOptions, getJwtSecret, getUserByEmail, getUserByUsername } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { getExpiryDate, PromoDuration } from "@/lib/promo";
import { ObjectId } from "mongodb";
import { sendVerificationEmail } from "@/lib/mailer";
export const dynamic = "force-dynamic";


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
  const { username, password, confirmPassword, name, promoCode, email } = await request.json();

  if (!username || !password || !confirmPassword || !name || !email) {
    return NextResponse.json({ error: "Missing credentials" }, { status: 400 });
  }
  if (!isValidEmail(String(email))) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }
  if (password !== confirmPassword) {
    return NextResponse.json({ error: "Passwords do not match" }, { status: 400 });
  }

  const normalizedUsername = String(username).trim();
  const normalizedEmail = String(email).trim().toLowerCase();

  const existing = await getUserByUsername(normalizedUsername);
  if (existing) {
    return NextResponse.json({ error: "Username already exists" }, { status: 409 });
  }

  const existingEmail = await getUserByEmail(normalizedEmail);
  if (existingEmail) {
    return NextResponse.json({ error: "Email already exists" }, { status: 409 });
  }

  const user = await createUser({ username: normalizedUsername, password, name, email: normalizedEmail });

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
