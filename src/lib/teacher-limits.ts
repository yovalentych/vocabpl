import { ObjectId } from "mongodb";
import { getDb } from "./db";

export type LimitCheckResult = {
  allowed: boolean;
  reason?: string;
  current?: number;
  limit?: number;
};

/**
 * Check if teacher can create a new class
 */
export async function canCreateClass(userId: ObjectId): Promise<LimitCheckResult> {
  const db = await getDb();
  const user = await db.collection("users").findOne({ _id: userId });

  if (!user?.teacherProfile) {
    return { allowed: false, reason: "Not a teacher" };
  }

  if (user.teacherProfile.status !== "active") {
    return { allowed: false, reason: `Teacher status is ${user.teacherProfile.status}` };
  }

  const { maxClasses } = user.teacherProfile.limits;

  // Unlimited
  if (maxClasses === -1) {
    return { allowed: true };
  }

  // Count active (non-archived) classes
  const classCount = await db
    .collection("classes")
    .countDocuments({ teacherId: userId, archivedAt: { $exists: false } });

  if (classCount >= maxClasses) {
    return {
      allowed: false,
      reason: `Class limit reached (${maxClasses})`,
      current: classCount,
      limit: maxClasses,
    };
  }

  return { allowed: true, current: classCount, limit: maxClasses };
}

/**
 * Check if teacher can create a new assignment
 */
export async function canCreateAssignment(userId: ObjectId): Promise<LimitCheckResult> {
  const db = await getDb();
  const user = await db.collection("users").findOne({ _id: userId });

  if (!user?.teacherProfile) {
    return { allowed: false, reason: "Not a teacher" };
  }

  if (user.teacherProfile.status !== "active") {
    return { allowed: false, reason: `Teacher status is ${user.teacherProfile.status}` };
  }

  const { maxAssignmentsPerMonth } = user.teacherProfile.limits;

  // Unlimited
  if (maxAssignmentsPerMonth === -1) {
    return { allowed: true };
  }

  // Count assignments created this month
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const assignmentCount = await db
    .collection("assignments")
    .countDocuments({
      teacherId: userId,
      createdAt: { $gte: monthStart, $lte: monthEnd },
      archivedAt: { $exists: false },
    });

  if (assignmentCount >= maxAssignmentsPerMonth) {
    return {
      allowed: false,
      reason: `Monthly assignment limit reached (${maxAssignmentsPerMonth})`,
      current: assignmentCount,
      limit: maxAssignmentsPerMonth,
    };
  }

  return { allowed: true, current: assignmentCount, limit: maxAssignmentsPerMonth };
}

/**
 * Check if teacher can add a student to a class
 */
export async function canAddStudent(
  userId: ObjectId,
  classId: ObjectId
): Promise<LimitCheckResult> {
  const db = await getDb();
  const user = await db.collection("users").findOne({ _id: userId });

  if (!user?.teacherProfile) {
    return { allowed: false, reason: "Not a teacher" };
  }

  if (user.teacherProfile.status !== "active") {
    return { allowed: false, reason: `Teacher status is ${user.teacherProfile.status}` };
  }

  const { maxStudentsPerClass } = user.teacherProfile.limits;

  // Unlimited
  if (maxStudentsPerClass === -1) {
    return { allowed: true };
  }

  // Get class and count students
  const classDoc = await db.collection("classes").findOne({ _id: classId, teacherId: userId });

  if (!classDoc) {
    return { allowed: false, reason: "Class not found or not owned by teacher" };
  }

  const studentCount = classDoc.studentIds?.length || 0;

  if (studentCount >= maxStudentsPerClass) {
    return {
      allowed: false,
      reason: `Student limit per class reached (${maxStudentsPerClass})`,
      current: studentCount,
      limit: maxStudentsPerClass,
    };
  }

  return { allowed: true, current: studentCount, limit: maxStudentsPerClass };
}

/**
 * Get teacher usage statistics
 */
export async function getTeacherUsage(userId: ObjectId) {
  const db = await getDb();
  const user = await db.collection("users").findOne({ _id: userId });

  if (!user?.teacherProfile) {
    return null;
  }

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const [classCount, assignmentCountThisMonth, totalAssignments] = await Promise.all([
    db.collection("classes").countDocuments({ teacherId: userId, archivedAt: { $exists: false } }),
    db
      .collection("assignments")
      .countDocuments({
        teacherId: userId,
        createdAt: { $gte: monthStart, $lte: monthEnd },
        archivedAt: { $exists: false },
      }),
    db.collection("assignments").countDocuments({ teacherId: userId, archivedAt: { $exists: false } }),
  ]);

  // Get total students across all classes
  const classes = await db
    .collection("classes")
    .find({ teacherId: userId, archivedAt: { $exists: false } })
    .toArray();

  const totalStudents = classes.reduce((sum, cls) => sum + (cls.studentIds?.length || 0), 0);

  const limits = user.teacherProfile.limits;

  return {
    classes: {
      current: classCount,
      limit: limits.maxClasses,
      unlimited: limits.maxClasses === -1,
    },
    students: {
      total: totalStudents,
      limitPerClass: limits.maxStudentsPerClass,
      unlimited: limits.maxStudentsPerClass === -1,
    },
    assignments: {
      thisMonth: assignmentCountThisMonth,
      total: totalAssignments,
      monthlyLimit: limits.maxAssignmentsPerMonth,
      unlimited: limits.maxAssignmentsPerMonth === -1,
    },
    aiCredits: {
      monthly: limits.aiCreditsMonthly,
    },
  };
}
