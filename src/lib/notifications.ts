import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";

// ==================== TYPES ====================

export type NotificationCategory =
  | "classes"
  | "assignments"
  | "subscription"
  | "credits"
  | "system"
  | "workbook";

export type NotificationPriority = "urgent" | "normal" | "low";

export type NotificationStatus = "unread" | "read" | "archived";

export type NotificationAction = {
  label: string;
  href: string;
  variant?: "primary" | "secondary" | "danger";
};

export type NotificationType =
  // Classes (7)
  | "class.student.added"
  | "class.student.joined"
  | "class.student.removed"
  | "class.assignment.created"
  | "class.assignments.bulk_copied"
  | "class.archived"
  | "class.student.left"
  // Assignments (3)
  | "assignment.submission.received"
  | "assignment.graded"
  | "assignment.bulk_graded"
  // Subscription (5)
  | "subscription.activated"
  | "subscription.cancelled"
  | "subscription.resumed"
  | "subscription.promo_applied"
  | "subscription.auto_renewed"
  // AI Credits (3)
  | "credits.warning_80"
  | "credits.warning_90"
  | "credits.quota_exceeded"
  // Workbook (1)
  | "workbook.submission.reviewed";

export type NotificationDocument = {
  _id?: ObjectId;
  userId: ObjectId;
  userRole: "admin" | "tutor" | "user";

  category: NotificationCategory;
  type: NotificationType;
  priority: NotificationPriority;

  title: string;
  message: string;
  icon: string;

  actions?: NotificationAction[];
  metadata?: Record<string, unknown>;

  status: NotificationStatus;
  readAt?: Date;

  groupKey?: string;
  groupCount?: number;

  createdAt: Date;
  expiresAt: Date;
};

export type CreateNotificationInput = {
  userId: ObjectId;
  userRole: "admin" | "tutor" | "user";
  category: NotificationCategory;
  type: NotificationType;
  priority?: NotificationPriority;
  title: string;
  message: string;
  icon: string;
  actions?: NotificationAction[];
  metadata?: Record<string, unknown>;
  groupKey?: string;
  ttlDays?: number;
};

// ==================== INDEXES ====================

const globalForNotifications = globalThis as unknown as {
  notificationIndexesReady?: boolean;
};

async function ensureNotificationIndexes() {
  if (globalForNotifications.notificationIndexesReady) return;

  try {
    const db = await getDb();
    const notifications = db.collection("notifications");

    // Primary indexes
    await notifications.createIndex({ userId: 1, createdAt: -1 });
    await notifications.createIndex({ userId: 1, status: 1, createdAt: -1 });
    await notifications.createIndex({ userId: 1, category: 1, status: 1 });

    // TTL index for auto-cleanup
    await notifications.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });

    globalForNotifications.notificationIndexesReady = true;
  } catch (error) {
    console.error("Failed to create notification indexes:", error);
  }
}

// ==================== CORE FUNCTIONS ====================

export async function createNotification(input: CreateNotificationInput): Promise<ObjectId> {
  await ensureNotificationIndexes();

  const db = await getDb();
  const notifications = db.collection<NotificationDocument>("notifications");

  const ttlDays = input.ttlDays || 90;
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + ttlDays);

  const notification: NotificationDocument = {
    userId: input.userId,
    userRole: input.userRole,
    category: input.category,
    type: input.type,
    priority: input.priority || "normal",
    title: input.title,
    message: input.message,
    icon: input.icon,
    actions: input.actions,
    metadata: input.metadata,
    status: "unread",
    groupKey: input.groupKey,
    createdAt: new Date(),
    expiresAt
  };

  const result = await notifications.insertOne(notification);
  return result.insertedId;
}

export async function createNotificationForUsers(
  userIds: ObjectId[],
  input: Omit<CreateNotificationInput, "userId">
): Promise<ObjectId[]> {
  await ensureNotificationIndexes();

  const db = await getDb();
  const notifications = db.collection<NotificationDocument>("notifications");

  const ttlDays = input.ttlDays || 90;
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + ttlDays);

  const now = new Date();
  const docs: NotificationDocument[] = userIds.map(userId => ({
    userId,
    userRole: input.userRole,
    category: input.category,
    type: input.type,
    priority: input.priority || "normal",
    title: input.title,
    message: input.message,
    icon: input.icon,
    actions: input.actions,
    metadata: input.metadata,
    status: "unread",
    groupKey: input.groupKey,
    createdAt: now,
    expiresAt
  }));

  if (docs.length === 0) return [];

  const result = await notifications.insertMany(docs);
  return Object.values(result.insertedIds);
}

// ==================== HELPER FUNCTIONS FOR EACH TYPE ====================

// ========== CLASSES ==========

export async function notifyStudentAddedToClass(params: {
  studentId: ObjectId;
  studentRole: "admin" | "tutor" | "user";
  classId: ObjectId;
  className: string;
  teacherId: ObjectId;
  teacherName: string;
}) {
  return createNotification({
    userId: params.studentId,
    userRole: params.studentRole,
    category: "classes",
    type: "class.student.added",
    priority: "normal",
    title: "Вас додано до класу",
    message: `Викладач ${params.teacherName} додав вас до класу "${params.className}"`,
    icon: "user-plus",
    actions: [
      {
        label: "Переглянути клас",
        href: `/classes/${params.classId}`,
        variant: "primary"
      }
    ],
    metadata: {
      classId: params.classId.toString(),
      className: params.className,
      teacherId: params.teacherId.toString(),
      teacherName: params.teacherName
    }
  });
}

export async function notifyStudentJoinedClass(params: {
  teacherId: ObjectId;
  teacherRole: "admin" | "tutor" | "user";
  studentId: ObjectId;
  studentName: string;
  classId: ObjectId;
  className: string;
}) {
  return createNotification({
    userId: params.teacherId,
    userRole: params.teacherRole,
    category: "classes",
    type: "class.student.joined",
    priority: "normal",
    title: "Новий студент у класі",
    message: `${params.studentName} приєднався до класу "${params.className}"`,
    icon: "user-check",
    actions: [
      {
        label: "Переглянути клас",
        href: `/classes/${params.classId}`,
        variant: "primary"
      }
    ],
    metadata: {
      classId: params.classId.toString(),
      className: params.className,
      studentId: params.studentId.toString(),
      studentName: params.studentName
    }
  });
}

export async function notifyStudentRemovedFromClass(params: {
  studentId: ObjectId;
  studentRole: "admin" | "tutor" | "user";
  classId: ObjectId;
  className: string;
  teacherName: string;
}) {
  return createNotification({
    userId: params.studentId,
    userRole: params.studentRole,
    category: "classes",
    type: "class.student.removed",
    priority: "normal",
    title: "Вас видалено з класу",
    message: `Викладач ${params.teacherName} видалив вас з класу "${params.className}"`,
    icon: "user-minus",
    metadata: {
      classId: params.classId.toString(),
      className: params.className
    }
  });
}

export async function notifyStudentLeftClass(params: {
  teacherId: ObjectId;
  teacherRole: "admin" | "tutor" | "user";
  studentId: ObjectId;
  studentName: string;
  classId: ObjectId;
  className: string;
}) {
  return createNotification({
    userId: params.teacherId,
    userRole: params.teacherRole,
    category: "classes",
    type: "class.student.left",
    priority: "normal",
    title: "Студент покинув клас",
    message: `${params.studentName} покинув клас "${params.className}"`,
    icon: "sign-out",
    actions: [
      {
        label: "Переглянути клас",
        href: `/classes/${params.classId}`,
        variant: "secondary"
      }
    ],
    metadata: {
      classId: params.classId.toString(),
      className: params.className,
      studentId: params.studentId.toString(),
      studentName: params.studentName
    }
  });
}

export async function notifyAssignmentCreated(params: {
  studentIds: ObjectId[];
  classId: ObjectId;
  className: string;
  assignmentId: ObjectId;
  assignmentTitle: string;
  dueDate?: Date;
  teacherName: string;
}) {
  const dueDateText = params.dueDate
    ? `, термін здачі: ${params.dueDate.toLocaleDateString("uk-UA")}`
    : "";

  return createNotificationForUsers(params.studentIds, {
    userRole: "user", // Assignments typically for students
    category: "assignments",
    type: "class.assignment.created",
    priority: params.dueDate && params.dueDate < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      ? "urgent"
      : "normal",
    title: "Нове завдання",
    message: `${params.teacherName} створив завдання "${params.assignmentTitle}" у класі "${params.className}"${dueDateText}`,
    icon: "clipboard-text",
    actions: [
      {
        label: "Переглянути завдання",
        href: `/classes/${params.classId}/assignment/${params.assignmentId}`,
        variant: "primary"
      }
    ],
    metadata: {
      classId: params.classId.toString(),
      className: params.className,
      assignmentId: params.assignmentId.toString(),
      assignmentTitle: params.assignmentTitle,
      dueDate: params.dueDate?.toISOString()
    }
  });
}

export async function notifyAssignmentsBulkCopied(params: {
  teacherId: ObjectId;
  teacherRole: "admin" | "tutor" | "user";
  sourceClassId: ObjectId;
  sourceClassName: string;
  targetClassId: ObjectId;
  targetClassName: string;
  assignmentCount: number;
}) {
  return createNotification({
    userId: params.teacherId,
    userRole: params.teacherRole,
    category: "assignments",
    type: "class.assignments.bulk_copied",
    priority: "normal",
    title: "Завдання скопійовано",
    message: `Скопійовано ${params.assignmentCount} завдань з "${params.sourceClassName}" до "${params.targetClassName}"`,
    icon: "copy",
    actions: [
      {
        label: "Переглянути клас",
        href: `/classes/${params.targetClassId}`,
        variant: "primary"
      }
    ],
    metadata: {
      sourceClassId: params.sourceClassId.toString(),
      targetClassId: params.targetClassId.toString(),
      assignmentCount: params.assignmentCount
    }
  });
}

export async function notifyClassArchived(params: {
  studentIds: ObjectId[];
  classId: ObjectId;
  className: string;
  teacherName: string;
}) {
  return createNotificationForUsers(params.studentIds, {
    userRole: "user",
    category: "classes",
    type: "class.archived",
    priority: "normal",
    title: "Клас архівовано",
    message: `${params.teacherName} архівував клас "${params.className}"`,
    icon: "archive",
    metadata: {
      classId: params.classId.toString(),
      className: params.className
    }
  });
}

// ========== ASSIGNMENTS ==========

export async function notifySubmissionReceived(params: {
  teacherId: ObjectId;
  teacherRole: "admin" | "tutor" | "user";
  studentId: ObjectId;
  studentName: string;
  classId: ObjectId;
  assignmentId: ObjectId;
  assignmentTitle: string;
  submissionId: ObjectId;
}) {
  return createNotification({
    userId: params.teacherId,
    userRole: params.teacherRole,
    category: "assignments",
    type: "assignment.submission.received",
    priority: "normal",
    title: "Нове подання",
    message: `${params.studentName} здав завдання "${params.assignmentTitle}"`,
    icon: "paper-plane-tilt",
    actions: [
      {
        label: "Перевірити",
        href: `/classes/${params.classId}/assignment/${params.assignmentId}/submission/${params.submissionId}`,
        variant: "primary"
      }
    ],
    metadata: {
      classId: params.classId.toString(),
      assignmentId: params.assignmentId.toString(),
      assignmentTitle: params.assignmentTitle,
      studentId: params.studentId.toString(),
      studentName: params.studentName,
      submissionId: params.submissionId.toString()
    }
  });
}

export async function notifyAssignmentGraded(params: {
  studentId: ObjectId;
  studentRole: "admin" | "tutor" | "user";
  classId: ObjectId;
  assignmentId: ObjectId;
  assignmentTitle: string;
  grade?: number;
  teacherName: string;
}) {
  const gradeText = params.grade !== undefined ? ` (оцінка: ${params.grade})` : "";

  return createNotification({
    userId: params.studentId,
    userRole: params.studentRole,
    category: "assignments",
    type: "assignment.graded",
    priority: "normal",
    title: "Завдання оцінено",
    message: `${params.teacherName} оцінив ваше завдання "${params.assignmentTitle}"${gradeText}`,
    icon: "check-circle",
    actions: [
      {
        label: "Переглянути оцінку",
        href: `/classes/${params.classId}/assignment/${params.assignmentId}`,
        variant: "primary"
      }
    ],
    metadata: {
      classId: params.classId.toString(),
      assignmentId: params.assignmentId.toString(),
      assignmentTitle: params.assignmentTitle,
      grade: params.grade
    }
  });
}

export async function notifyAssignmentBulkGraded(params: {
  studentIds: Array<{ id: ObjectId; role: "admin" | "tutor" | "user" }>;
  classId: ObjectId;
  assignmentId: ObjectId;
  assignmentTitle: string;
  teacherName: string;
}) {
  const promises = params.studentIds.map(student =>
    createNotification({
      userId: student.id,
      userRole: student.role,
      category: "assignments",
      type: "assignment.bulk_graded",
      priority: "normal",
      title: "Завдання оцінено",
      message: `${params.teacherName} оцінив ваше завдання "${params.assignmentTitle}"`,
      icon: "check-circle",
      actions: [
        {
          label: "Переглянути оцінку",
          href: `/classes/${params.classId}/assignment/${params.assignmentId}`,
          variant: "primary"
        }
      ],
      metadata: {
        classId: params.classId.toString(),
        assignmentId: params.assignmentId.toString(),
        assignmentTitle: params.assignmentTitle,
        bulkGraded: true
      }
    })
  );

  await Promise.all(promises);
}

// ========== SUBSCRIPTION ==========

export async function notifySubscriptionActivated(params: {
  userId: ObjectId;
  userRole: "admin" | "tutor" | "user";
  planName: string;
  expiresAt?: Date;
}) {
  const expiryText = params.expiresAt
    ? ` до ${params.expiresAt.toLocaleDateString("uk-UA")}`
    : "";

  return createNotification({
    userId: params.userId,
    userRole: params.userRole,
    category: "subscription",
    type: "subscription.activated",
    priority: "normal",
    title: "Підписку активовано",
    message: `Ваша підписка "${params.planName}" активна${expiryText}`,
    icon: "check-circle",
    actions: [
      {
        label: "Керування підпискою",
        href: "/settings/subscription",
        variant: "primary"
      }
    ],
    metadata: {
      planName: params.planName,
      expiresAt: params.expiresAt?.toISOString()
    }
  });
}

export async function notifySubscriptionCancelled(params: {
  userId: ObjectId;
  userRole: "admin" | "tutor" | "user";
  planName: string;
  expiresAt?: Date;
}) {
  const expiryText = params.expiresAt
    ? ` Доступ діятиме до ${params.expiresAt.toLocaleDateString("uk-UA")}.`
    : "";

  return createNotification({
    userId: params.userId,
    userRole: params.userRole,
    category: "subscription",
    type: "subscription.cancelled",
    priority: "normal",
    title: "Підписку скасовано",
    message: `Ваша підписка "${params.planName}" скасована.${expiryText}`,
    icon: "x-circle",
    actions: [
      {
        label: "Відновити підписку",
        href: "/settings/subscription",
        variant: "primary"
      }
    ],
    metadata: {
      planName: params.planName,
      expiresAt: params.expiresAt?.toISOString()
    }
  });
}

export async function notifySubscriptionResumed(params: {
  userId: ObjectId;
  userRole: "admin" | "tutor" | "user";
  planName: string;
  expiresAt?: Date;
}) {
  const expiryText = params.expiresAt
    ? ` до ${params.expiresAt.toLocaleDateString("uk-UA")}`
    : "";

  return createNotification({
    userId: params.userId,
    userRole: params.userRole,
    category: "subscription",
    type: "subscription.resumed",
    priority: "normal",
    title: "Підписку відновлено",
    message: `Ваша підписка "${params.planName}" знову активна${expiryText}`,
    icon: "arrow-clockwise",
    actions: [
      {
        label: "Керування підпискою",
        href: "/settings/subscription",
        variant: "primary"
      }
    ],
    metadata: {
      planName: params.planName,
      expiresAt: params.expiresAt?.toISOString()
    }
  });
}

export async function notifyPromoApplied(params: {
  userId: ObjectId;
  userRole: "admin" | "tutor" | "user";
  promoCode: string;
  discountPercent?: number;
  expiresAt?: Date;
}) {
  const discountText = params.discountPercent
    ? ` зі знижкою ${params.discountPercent}%`
    : "";
  const expiryText = params.expiresAt
    ? ` до ${params.expiresAt.toLocaleDateString("uk-UA")}`
    : "";

  return createNotification({
    userId: params.userId,
    userRole: params.userRole,
    category: "subscription",
    type: "subscription.promo_applied",
    priority: "normal",
    title: "Промокод застосовано",
    message: `Промокод "${params.promoCode}" активовано${discountText}${expiryText}`,
    icon: "ticket",
    actions: [
      {
        label: "Переглянути підписку",
        href: "/settings/subscription",
        variant: "primary"
      }
    ],
    metadata: {
      promoCode: params.promoCode,
      discountPercent: params.discountPercent,
      expiresAt: params.expiresAt?.toISOString()
    }
  });
}

export async function notifySubscriptionAutoRenewed(params: {
  userId: ObjectId;
  userRole: "admin" | "tutor" | "user";
  planName: string;
  amount: number;
  expiresAt: Date;
}) {
  return createNotification({
    userId: params.userId,
    userRole: params.userRole,
    category: "subscription",
    type: "subscription.auto_renewed",
    priority: "normal",
    title: "Підписку продовжено",
    message: `Автоматично продовжено підписку "${params.planName}" на ${params.amount} грн до ${params.expiresAt.toLocaleDateString("uk-UA")}`,
    icon: "arrows-clockwise",
    actions: [
      {
        label: "Керування підпискою",
        href: "/settings/subscription",
        variant: "primary"
      }
    ],
    metadata: {
      planName: params.planName,
      amount: params.amount,
      expiresAt: params.expiresAt.toISOString()
    }
  });
}

// ========== AI CREDITS ==========

export async function notifyAICreditsWarning(params: {
  userId: ObjectId;
  userRole: "admin" | "tutor" | "user";
  percentageUsed: 80 | 90;
  usedCredits: number;
  totalCredits: number;
}) {
  const isUrgent = params.percentageUsed >= 90;

  return createNotification({
    userId: params.userId,
    userRole: params.userRole,
    category: "credits",
    type: params.percentageUsed === 80 ? "credits.warning_80" : "credits.warning_90",
    priority: isUrgent ? "urgent" : "normal",
    title: `Використано ${params.percentageUsed}% AI кредитів`,
    message: `Ви використали ${params.usedCredits} з ${params.totalCredits} доступних AI кредитів`,
    icon: "warning",
    actions: [
      {
        label: "Переглянути використання",
        href: "/settings/ai-usage",
        variant: "primary"
      },
      {
        label: "Збільшити ліміт",
        href: "/settings/subscription",
        variant: "secondary"
      }
    ],
    metadata: {
      percentageUsed: params.percentageUsed,
      usedCredits: params.usedCredits,
      totalCredits: params.totalCredits
    }
  });
}

export async function notifyAICreditsExceeded(params: {
  userId: ObjectId;
  userRole: "admin" | "tutor" | "user";
  usedCredits: number;
  totalCredits: number;
}) {
  return createNotification({
    userId: params.userId,
    userRole: params.userRole,
    category: "credits",
    type: "credits.quota_exceeded",
    priority: "urgent",
    title: "Ліміт AI кредитів вичерпано",
    message: `Ви досягли максимуму AI кредитів (${params.totalCredits}). Для продовження використання збільште ліміт`,
    icon: "x-circle",
    actions: [
      {
        label: "Збільшити ліміт",
        href: "/settings/subscription",
        variant: "primary"
      }
    ],
    metadata: {
      usedCredits: params.usedCredits,
      totalCredits: params.totalCredits
    }
  });
}

// ========== WORKBOOK ==========

export async function notifyWorkbookReviewed(params: {
  userId: ObjectId;
  userRole: "admin" | "tutor" | "user";
  submissionId: string;
  rating?: number;
  reviewerName: string;
}) {
  const ratingText = params.rating ? ` (оцінка: ${params.rating}/10)` : "";

  return createNotification({
    userId: params.userId,
    userRole: params.userRole,
    category: "workbook",
    type: "workbook.submission.reviewed",
    priority: "normal",
    title: "Зошит перевірено",
    message: `${params.reviewerName} перевірив ваше подання${ratingText}`,
    icon: "book-open",
    actions: [
      {
        label: "Переглянути відгук",
        href: "/notifications?category=workbook",
        variant: "primary"
      }
    ],
    metadata: {
      submissionId: params.submissionId,
      rating: params.rating
    }
  });
}
