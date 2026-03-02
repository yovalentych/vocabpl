import { ObjectId } from "mongodb";

export type TeacherStatus =
  | "pending"
  | "verifying_email"
  | "pending_payment"
  | "active"
  | "cancelled"
  | "grace_period"
  | "deleted";

export type TeacherPlanId = "teacher_basic_m" | "teacher_pro_m" | "teacher_unlimited_y";

export type TeacherExperience = "0-1" | "1-3" | "3-5" | "5+";

export type GracePeriodWarning = "7d" | "3d" | "1d";

export type TeacherLimits = {
  maxClasses: number; // -1 для unlimited
  maxStudentsPerClass: number; // -1 для unlimited
  maxAssignmentsPerMonth: number; // -1 для unlimited
  aiCreditsMonthly: number;
};

export type TeacherProfile = {
  // Status workflow
  status: TeacherStatus;

  // Plan & Limits
  planId: TeacherPlanId;
  limits: TeacherLimits;

  // Profile Info
  fullName: string;
  phoneNumber?: string;
  schoolOrInstitution?: string;
  teachingExperience?: TeacherExperience;
  motivation?: string;

  // Subscription
  subscription: {
    expiresAt: Date | null;
    autoRenew: boolean;
    cancelAtPeriodEnd: boolean;
    cardToken?: string;
    cardMask?: string;
    walletId?: string;
  };

  // Email Verification
  emailVerificationCode?: string; // SHA256 hash
  emailVerificationExpiresAt?: Date; // 15 min TTL
  emailVerificationAttempts?: number; // Max 5

  // Admin Moderation
  adminApproved: boolean;
  adminApprovedAt?: Date;
  adminApprovedBy?: ObjectId;
  adminNotes?: string;

  // Grace Period & Deletion
  cancelledAt?: Date;
  gracePeriodEndsAt?: Date; // cancelledAt + 30 days
  gracePeriodWarningsSent: GracePeriodWarning[];

  // Timestamps & Stats
  createdAt: Date;
  updatedAt: Date;
  lastActiveAt?: Date;
  stats: {
    totalClasses: number;
    totalStudents: number;
    totalAssignments: number;
    totalSubmissions: number;
  };
};

// Extended User type з teacherProfile
export type UserWithTeacherProfile = {
  _id: ObjectId;
  username: string;
  name: string;
  email: string;
  emailLower: string;
  emailVerified: boolean;
  role: "admin" | "tutor" | "user";
  passwordHash: string;
  consent: {
    termsAt: Date | null;
    privacyAt: Date | null;
    marketingAt: Date | null;
    ip: string | null;
    userAgent: string | null;
  };
  favorites: string[];
  wordProgress: unknown[];
  testHistory: unknown[];
  subscription: {
    status: string;
    expiresAt: Date | null;
    promoCode: string | null;
    planId: string | null;
    autoRenew: boolean;
    cancelAtPeriodEnd: boolean;
    cardToken: string | null;
    cardMask: string | null;
    walletId: string | null;
  };
  aiUsage: {
    month: string | null;
    usedCredits: number;
  };
  stats: {
    wordsStudied: number;
    sessions: number;
    testsTaken: number;
    points: number;
  };
  createdAt: Date;
  teacherProfile?: TeacherProfile;
};

// Helper для створення дефолтних limits по плану
export function getTeacherLimitsByPlan(planId: TeacherPlanId): TeacherLimits {
  switch (planId) {
    case "teacher_basic_m":
      return {
        maxClasses: 3,
        maxStudentsPerClass: 30,
        maxAssignmentsPerMonth: 50,
        aiCreditsMonthly: 1500,
      };
    case "teacher_pro_m":
      return {
        maxClasses: 10,
        maxStudentsPerClass: 50,
        maxAssignmentsPerMonth: 200,
        aiCreditsMonthly: 5000,
      };
    case "teacher_unlimited_y":
      return {
        maxClasses: -1,
        maxStudentsPerClass: -1,
        maxAssignmentsPerMonth: -1,
        aiCreditsMonthly: 15000,
      };
  }
}
