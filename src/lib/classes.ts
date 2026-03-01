import { ObjectId } from "mongodb";

// ============================================================================
// Types
// ============================================================================

export type ClassSettings = {
  isPublic: boolean;              // Чи можуть студенти самі приєднатися
  inviteCode?: string;            // Код для приєднання (якщо isPublic)
  autoApprove: boolean;           // Автоматичне схвалення запитів
  locale: 'uk' | 'pl';           // Основна мова класу
};

export type ClassStudent = {
  id: string;
  username: string;
  name: string;
  joinedAt: Date;
};

export type ClassStats = {
  totalStudents: number;
  activeStudents: number;         // Активні за останні 7 днів
  totalAssignments: number;
  completedAssignments: number;
};

export type Class = {
  _id: ObjectId;
  name: string;                    // "Польська А1 - Група 1"
  description?: string;            // "Початківці, вечірня група"
  teacherId: ObjectId;             // ID викладача (ref users)
  teacherName: string;             // Кешоване ім'я

  // Студенти
  studentIds: ObjectId[];          // Масив ID студентів
  students: ClassStudent[];        // Денормалізовані дані для UI

  // Налаштування
  settings: ClassSettings;

  // Метадані
  createdAt: Date;
  updatedAt: Date;
  archivedAt?: Date;               // Для архівації старих класів

  // Статистика (кешована)
  stats: ClassStats;
};

export type AssignmentType = 'exercise' | 'test' | 'reading' | 'custom';

export type ExerciseType =
  | 'sentences'
  | 'cloze'
  | 'match'
  | 'translate'
  | 'paraphrase'
  | 'dialogue'
  | 'describe'
  | 'story';

export type AssignmentSettings = {
  allowLateSubmission: boolean;
  showResultsImmediately: boolean;
  allowRetake: boolean;
  maxAttempts?: number;
};

export type Assignment = {
  _id: ObjectId;
  classId: ObjectId;               // Ref classes
  teacherId: ObjectId;             // Хто створив

  // Тип завдання
  type: AssignmentType;

  // Для exercise
  exerciseType?: ExerciseType;
  exerciseConfig?: {
    topic?: string;
    level?: string;
    difficulty?: string;
  };

  // Для test
  testId?: ObjectId;

  // Для reading
  readingId?: ObjectId;

  // Для custom
  customTitle?: string;
  customDescription?: string;
  customInstructions?: string;

  // Загальні поля
  title: string;
  description?: string;
  instructions?: string;

  // Дедлайн
  assignedAt: Date;
  dueAt?: Date;

  // Оцінювання
  pointsTotal?: number;
  passingScore?: number;

  // Налаштування
  settings: AssignmentSettings;

  // Студенти
  assignedTo: 'all' | ObjectId[];

  createdAt: Date;
  updatedAt: Date;
};

export type SubmissionStatus = 'not_started' | 'in_progress' | 'submitted' | 'graded';

export type Submission = {
  _id: ObjectId;
  assignmentId: ObjectId;
  classId: ObjectId;
  studentId: ObjectId;
  studentName: string;

  // Submission
  submittedAt?: Date;
  status: SubmissionStatus;

  // Результати
  score?: number;
  percentage?: number;
  passed?: boolean;

  // Дані залежно від типу
  exerciseData?: {
    attempts: number;
    timeSpent: number;
    answers: any[];
  };

  testData?: {
    testSubmissionId: ObjectId;
  };

  readingData?: {
    completed: boolean;
    timeSpent: number;
    comprehensionScore?: number;
  };

  customData?: {
    content?: string;
    files?: string[];
  };

  // Feedback від викладача
  feedback?: {
    comment?: string;
    gradedAt?: Date;
    gradedBy?: ObjectId;
  };

  // Метадані
  attemptNumber: number;
  isLate: boolean;

  createdAt: Date;
  updatedAt: Date;
};

// ============================================================================
// Helpers
// ============================================================================

export function generateInviteCode(): string {
  // Генеруємо код формату: ABC-123
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // без I, O для читабельності
  const numbers = '23456789'; // без 0, 1 для читабельності

  let code = '';
  for (let i = 0; i < 3; i++) {
    code += letters.charAt(Math.floor(Math.random() * letters.length));
  }
  code += '-';
  for (let i = 0; i < 3; i++) {
    code += numbers.charAt(Math.floor(Math.random() * numbers.length));
  }

  return code;
}

export function isValidInviteCode(code: string): boolean {
  return /^[A-Z]{3}-[0-9]{3}$/.test(code);
}

export function canUserCreateClass(user: any): boolean {
  // Allow both admins and tutors to create classes
  return user.role === 'admin' || user.role === 'tutor';
}

export function isTeacherOfClass(userId: string | ObjectId, classDoc: Class): boolean {
  return classDoc.teacherId.toString() === userId.toString();
}

export function isStudentOfClass(userId: string | ObjectId, classDoc: Class): boolean {
  return classDoc.studentIds.some(id => id.toString() === userId.toString());
}

export function canAccessClass(userId: string | ObjectId, classDoc: Class): boolean {
  return isTeacherOfClass(userId, classDoc) || isStudentOfClass(userId, classDoc);
}

export function getDefaultClassSettings(): ClassSettings {
  return {
    isPublic: false,
    autoApprove: true,
    locale: 'uk'
  };
}

export function getDefaultAssignmentSettings(): AssignmentSettings {
  return {
    allowLateSubmission: true,
    showResultsImmediately: true,
    allowRetake: false,
    maxAttempts: 1
  };
}

// ============================================================================
// Database indexes (to be created)
// ============================================================================

export const CLASS_INDEXES = [
  { key: { teacherId: 1 }, background: true },
  { key: { studentIds: 1 }, background: true },
  { key: { 'settings.inviteCode': 1 }, sparse: true, background: true },
  { key: { createdAt: -1 }, background: true },
  { key: { archivedAt: 1 }, sparse: true, background: true }
];

export const ASSIGNMENT_INDEXES = [
  { key: { classId: 1, createdAt: -1 }, background: true },
  { key: { teacherId: 1 }, background: true },
  { key: { dueAt: 1 }, sparse: true, background: true },
  { key: { type: 1 }, background: true }
];

export const SUBMISSION_INDEXES = [
  { key: { assignmentId: 1, studentId: 1 }, unique: true, background: true },
  { key: { classId: 1, studentId: 1 }, background: true },
  { key: { status: 1 }, background: true },
  { key: { submittedAt: -1 }, sparse: true, background: true }
];
