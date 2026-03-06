import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { ObjectId } from "mongodb";
import { isCsrfValid } from "@/lib/csrf";

const ADMIN_LIMITS = {
  maxClasses: -1,
  maxStudentsPerClass: -1,
  maxAssignmentsPerMonth: -1,
  aiCreditsMonthly: -1,
};

export async function POST(request: Request) {
  if (!isCsrfValid(request)) {
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
  }

  const auth = await getAuthUser();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await getDb();
  const user = await db.collection("users").findOne({ _id: new ObjectId(auth.id) });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const now = new Date();
  const teacherProfile = {
    status: "active",
    planId: "teacher_unlimited_y",
    limits: ADMIN_LIMITS,
    fullName: user.name || user.username,
    subscription: {
      expiresAt: null,
      autoRenew: false,
      cancelAtPeriodEnd: false,
    },
    adminApproved: true,
    adminApprovedAt: now,
    gracePeriodWarningsSent: [],
    createdAt: user.teacherProfile?.createdAt || now,
    updatedAt: now,
    stats: user.teacherProfile?.stats || {
      totalClasses: 0,
      totalStudents: 0,
      totalAssignments: 0,
      totalSubmissions: 0,
    },
  };

  await db.collection("users").updateOne(
    { _id: new ObjectId(auth.id) },
    { $set: { teacherProfile, updatedAt: now } }
  );

  return NextResponse.json({ success: true });
}
