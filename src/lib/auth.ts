import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { getDb } from "@/lib/db";

export type AuthUser = {
  id: string;
  username: string;
  role: "admin" | "user";
  isAdmin: boolean;
};

const ADMIN_USERNAME = "yovalentych";

const TOKEN_NAME = "auth_token";

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
  const db = await getDb();
  return db.collection("users").findOne({ username });
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  return db.collection("users").findOne({ emailLower: email.toLowerCase() });
}

export function isAdminUsername(username: string) {
  return username.trim().toLowerCase() === ADMIN_USERNAME.toLowerCase();
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
  const db = await getDb();
  const passwordHash = await hashPassword(password);
  const role = isAdminUsername(username) ? "admin" : "user";
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
      planId: null
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
  return { id: result.insertedId.toString(), username, role, isAdmin: role === "admin" };
}
