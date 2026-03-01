import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { getDb } from "@/lib/db";

export type AuthUser = {
  id: string;
  username: string;
  role: "admin" | "tutor" | "user";
  isAdmin: boolean;
};

const TOKEN_NAME = "auth_token";
const globalForAuth = globalThis as unknown as {
  userIndexesReady?: boolean;
};

export function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("Missing JWT_SECRET in environment");
  }
  return secret;
}

export function getCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/"
  };
}

export function isAdminUsername(username: string) {
  const adminUsername = (process.env.ADMIN_USERNAME || "jovalentych").trim().toLowerCase();
  return username.trim().toLowerCase() === adminUsername;
}

async function ensureUserIndexes() {
  if (globalForAuth.userIndexesReady) return;
  try {
    const db = await getDb();
    const users = db.collection("users");
    await users.createIndex({ username: 1 }, { unique: true });
    await users.createIndex({ emailLower: 1 }, { unique: true });
    globalForAuth.userIndexesReady = true;
  } catch {
    // Ignore index creation errors to avoid blocking requests.
  }
}

export function signToken(user: AuthUser) {
  return jwt.sign(user, getJwtSecret(), { expiresIn: "30d" });
}

export function verifyToken(token: string) {
  try {
    return jwt.verify(token, getJwtSecret()) as AuthUser;
  } catch {
    return null;
  }
}

export async function hashPassword(password: string) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function getAuthUser() {
  const cookieStore = cookies();
  const token = cookieStore.get(TOKEN_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function getUserByUsername(username: string) {
  await ensureUserIndexes();
  const db = await getDb();
  return db.collection("users").findOne({ username });
}

export async function getUserByEmail(email: string) {
  await ensureUserIndexes();
  const db = await getDb();
  return db.collection("users").findOne({ emailLower: email.toLowerCase() });
}

export function isTutorOrAdmin(user: AuthUser | null): boolean {
  if (!user) return false;
  return user.role === "admin" || user.role === "tutor";
}

export async function createUser({
  username,
  password,
  name,
  email,
  consent
}: {
  username: string;
  password: string;
  name: string;
  email: string;
  consent?: {
    termsAt?: Date | null;
    privacyAt?: Date | null;
    marketingAt?: Date | null;
    ip?: string | null;
    userAgent?: string | null;
  };
}) {
  await ensureUserIndexes();
  const db = await getDb();
  const passwordHash = await hashPassword(password);
  const role: "admin" | "tutor" | "user" = isAdminUsername(username) ? "admin" : "user";
  const emailLower = email.toLowerCase();
  const userDoc = {
    username,
    name,
    email,
    emailLower,
    emailVerified: false,
    role,
    passwordHash,
    consent: {
      termsAt: consent?.termsAt ?? null,
      privacyAt: consent?.privacyAt ?? null,
      marketingAt: consent?.marketingAt ?? null,
      ip: consent?.ip ?? null,
      userAgent: consent?.userAgent ?? null
    },
    favorites: [],
    wordProgress: [],
    testHistory: [],
    subscription: {
      status: "free",
      expiresAt: null,
      promoCode: null,
      planId: null,
      autoRenew: false,
      cancelAtPeriodEnd: false,
      cardToken: null,
      cardMask: null,
      walletId: null
    },
    aiUsage: {
      month: null,
      usedCredits: 0
    },
    stats: {
      wordsStudied: 0,
      sessions: 0,
      testsTaken: 0,
      points: 0
    },
    createdAt: new Date()
  };
  const result = await db.collection("users").insertOne(userDoc);
  return { id: result.insertedId.toString(), username, role, isAdmin: false };
}
