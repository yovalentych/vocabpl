import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { ObjectId } from "mongodb";
import { isCsrfValid } from "@/lib/csrf";

// GET - List all teachers with filters
export async function GET(request: Request) {
  const auth = await getAuthUser();

  // Only admin can access
  if (!auth || auth.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const db = await getDb();
  const url = new URL(request.url);

  // Parse filters
  const status = url.searchParams.get("status");
  const planId = url.searchParams.get("planId");
  const page = parseInt(url.searchParams.get("page") || "1", 10);
  const limit = parseInt(url.searchParams.get("limit") || "50", 10);

  // Build query
  const query: Record<string, unknown> = {
    teacherProfile: { $exists: true },
  };

  if (status) {
    query["teacherProfile.status"] = status;
  }

  if (planId) {
    query["teacherProfile.planId"] = planId;
  }

  // Get total count
  const total = await db.collection("users").countDocuments(query);

  // Get teachers with pagination
  const teachers = await db
    .collection("users")
    .find(query, {
      projection: {
        _id: 1,
        username: 1,
        name: 1,
        email: 1,
        role: 1,
        teacherProfile: 1,
        createdAt: 1,
      },
    })
    .sort({ "teacherProfile.createdAt": -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .toArray();

  // Calculate stats
  const stats = await db
    .collection("users")
    .aggregate([
      { $match: { teacherProfile: { $exists: true } } },
      {
        $group: {
          _id: "$teacherProfile.status",
          count: { $sum: 1 },
        },
      },
    ])
    .toArray();

  const statusCounts = stats.reduce(
    (acc, item) => {
      acc[item._id] = item.count;
      return acc;
    },
    {} as Record<string, number>
  );

  return NextResponse.json({
    teachers,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    stats: statusCounts,
  });
}

// POST - Admin actions (approve, extend grace period, etc.)
export async function POST(request: Request) {
  // CSRF validation
  if (!isCsrfValid(request)) {
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
  }

  const auth = await getAuthUser();

  // Only admin can access
  if (!auth || auth.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { action, teacherId, notes, gracePeriodDays } = await request.json();

  if (!action || !teacherId) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (!ObjectId.isValid(teacherId)) {
    return NextResponse.json({ error: "Invalid teacher ID" }, { status: 400 });
  }

  const db = await getDb();
  const teacher = await db.collection("users").findOne({ _id: new ObjectId(teacherId) });

  if (!teacher || !teacher.teacherProfile) {
    return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
  }

  switch (action) {
    case "approve":
      await db.collection("users").updateOne(
        { _id: new ObjectId(teacherId) },
        {
          $set: {
            "teacherProfile.adminApproved": true,
            "teacherProfile.adminApprovedAt": new Date(),
            "teacherProfile.adminApprovedBy": new ObjectId(auth.id),
            "teacherProfile.adminNotes": notes || undefined,
            "teacherProfile.updatedAt": new Date(),
            updatedAt: new Date(),
          },
        }
      );
      return NextResponse.json({ success: true, message: "Teacher approved" });

    case "reject":
      await db.collection("users").updateOne(
        { _id: new ObjectId(teacherId) },
        {
          $set: {
            "teacherProfile.adminApproved": false,
            "teacherProfile.adminNotes": notes || undefined,
            "teacherProfile.updatedAt": new Date(),
            updatedAt: new Date(),
          },
        }
      );
      return NextResponse.json({ success: true, message: "Teacher rejected" });

    case "extend_grace":
      if (!gracePeriodDays || gracePeriodDays < 1 || gracePeriodDays > 90) {
        return NextResponse.json(
          { error: "Invalid grace period days (1-90)" },
          { status: 400 }
        );
      }

      const currentGraceEnd = teacher.teacherProfile.gracePeriodEndsAt
        ? new Date(teacher.teacherProfile.gracePeriodEndsAt)
        : new Date();

      const newGraceEnd = new Date(currentGraceEnd.getTime() + gracePeriodDays * 24 * 60 * 60 * 1000);

      await db.collection("users").updateOne(
        { _id: new ObjectId(teacherId) },
        {
          $set: {
            "teacherProfile.gracePeriodEndsAt": newGraceEnd,
            "teacherProfile.adminNotes": notes || undefined,
            "teacherProfile.updatedAt": new Date(),
            updatedAt: new Date(),
          },
        }
      );

      return NextResponse.json({
        success: true,
        message: `Grace period extended by ${gracePeriodDays} days`,
        newGraceEnd,
      });

    case "add_note":
      await db.collection("users").updateOne(
        { _id: new ObjectId(teacherId) },
        {
          $set: {
            "teacherProfile.adminNotes": notes,
            "teacherProfile.updatedAt": new Date(),
            updatedAt: new Date(),
          },
        }
      );
      return NextResponse.json({ success: true, message: "Note added" });

    default:
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }
}
