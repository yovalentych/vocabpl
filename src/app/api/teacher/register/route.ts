import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { ObjectId } from "mongodb";
import crypto from "crypto";
import { getJwtSecret } from "@/lib/auth";
import { isCsrfValid } from "@/lib/csrf";
import { checkRateLimit, getRequestIp } from "@/lib/rate-limit";
import { getTeacherLimitsByPlan } from "@/lib/teacher-types";
import type { TeacherPlanId } from "@/lib/teacher-types";

const CODE_TTL_MINUTES = 15;
const MAX_VERIFICATION_ATTEMPTS = 5;

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function hashCode(code: string) {
  return crypto.createHash("sha256").update(`${code}:${getJwtSecret()}`).digest("hex");
}

export async function POST(request: Request) {
  // CSRF validation
  if (!isCsrfValid(request)) {
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
  }

  // Rate limiting
  const requestIp = getRequestIp(request);
  const rate = await checkRateLimit(`teacher:register:${requestIp}`, 3, 60_000);
  if (!rate.ok) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  // Auth check
  const auth = await getAuthUser();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await getDb();
  const user = await db.collection("users").findOne({ _id: new ObjectId(auth.id) });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Check if email is verified
  if (!user.emailVerified) {
    return NextResponse.json(
      { error: "Email must be verified first", code: "EMAIL_NOT_VERIFIED" },
      { status: 400 }
    );
  }

  // Check if already registered as teacher
  if (user.teacherProfile) {
    return NextResponse.json(
      { error: "Already registered as teacher", code: "ALREADY_TEACHER" },
      { status: 409 }
    );
  }

  // Parse request body
  const { fullName, planId, phoneNumber, schoolOrInstitution, teachingExperience, motivation } =
    await request.json();

  // Validate required fields
  if (!fullName || !planId) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Validate plan
  const validPlans: TeacherPlanId[] = ["teacher_basic_m", "teacher_pro_m", "teacher_unlimited_y"];
  if (!validPlans.includes(planId)) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  // Generate verification code
  const code = generateCode();
  const codeHash = hashCode(code);
  const expiresAt = new Date(Date.now() + CODE_TTL_MINUTES * 60 * 1000);

  // Get limits for selected plan
  const limits = getTeacherLimitsByPlan(planId);

  // Create teacher profile
  const teacherProfile = {
    status: "verifying_email",
    planId,
    limits,
    fullName: String(fullName).trim(),
    phoneNumber: phoneNumber ? String(phoneNumber).trim() : undefined,
    schoolOrInstitution: schoolOrInstitution ? String(schoolOrInstitution).trim() : undefined,
    teachingExperience: teachingExperience || undefined,
    motivation: motivation ? String(motivation).trim() : undefined,
    subscription: {
      expiresAt: null,
      autoRenew: false,
      cancelAtPeriodEnd: false,
    },
    emailVerificationCode: codeHash,
    emailVerificationExpiresAt: expiresAt,
    emailVerificationAttempts: 0,
    adminApproved: false,
    gracePeriodWarningsSent: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    stats: {
      totalClasses: 0,
      totalStudents: 0,
      totalAssignments: 0,
      totalSubmissions: 0,
    },
  };

  // Update user with teacher profile
  await db.collection("users").updateOne(
    { _id: new ObjectId(auth.id) },
    { $set: { teacherProfile, updatedAt: new Date() } }
  );

  // Send verification email
  const { sendTeacherVerificationEmail } = await import("@/lib/mailer");
  try {
    await sendTeacherVerificationEmail(user.email, code, fullName);
  } catch (error) {
    console.error("[teacher-register] Failed to send verification email:", error);
    // Rollback - remove teacher profile
    await db.collection("users").updateOne(
      { _id: new ObjectId(auth.id) },
      { $unset: { teacherProfile: "" } }
    );
    return NextResponse.json(
      { error: "Failed to send verification email" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    status: "verifying_email",
    email: user.email,
    expiresIn: CODE_TTL_MINUTES * 60,
  });
}
