import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { ObjectId } from "mongodb";
import {
  canUserCreateClass,
  generateInviteCode,
  getDefaultClassSettings,
  type Class,
  type ClassSettings
} from "@/lib/classes";

// GET /api/classes - Отримати список класів користувача
export async function GET(request: Request) {
  const auth = await getAuthUser();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = await getDb();
    const userId = new ObjectId(auth.id);

    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role') || 'all'; // 'teacher' | 'student' | 'all'
    const includeArchived = searchParams.get('archived') === 'true';

    let query: any = {};

    // Фільтр за роллю
    if (role === 'teacher') {
      query.teacherId = userId;
    } else if (role === 'student') {
      query.studentIds = userId;
    } else {
      // 'all' - класи де я викладач або студент
      query.$or = [
        { teacherId: userId },
        { studentIds: userId }
      ];
    }

    // Фільтр архівованих
    if (!includeArchived) {
      query.archivedAt = { $exists: false };
    }

    const classes = await db
      .collection<Class>("classes")
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    // Додаємо інформацію про роль користувача в кожному класі
    const classesWithRole = classes.map(cls => ({
      ...cls,
      _id: cls._id.toString(),
      teacherId: cls.teacherId.toString(),
      studentIds: cls.studentIds.map(id => id.toString()),
      myRole: cls.teacherId.equals(userId) ? 'teacher' : 'student'
    }));

    return NextResponse.json({ classes: classesWithRole });
  } catch (error) {
    console.error("Error fetching classes:", error);
    return NextResponse.json(
      { error: "Failed to fetch classes" },
      { status: 500 }
    );
  }
}

// POST /api/classes - Створити новий клас
export async function POST(request: Request) {
  const auth = await getAuthUser();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Перевірка чи може користувач створювати класи
  if (!canUserCreateClass(auth)) {
    return NextResponse.json(
      { error: "You don't have permission to create classes" },
      { status: 403 }
    );
  }

  // Check teacher limits
  if (auth.role === "tutor") {
    const { canCreateClass } = await import("@/lib/teacher-limits");
    const limitCheck = await canCreateClass(new ObjectId(auth.id));
    if (!limitCheck.allowed) {
      return NextResponse.json(
        {
          error: limitCheck.reason || "Class creation limit reached",
          code: "TEACHER_LIMIT_REACHED",
          current: limitCheck.current,
          limit: limitCheck.limit,
        },
        { status: 403 }
      );
    }
  }

  try {
    const body = await request.json();
    const { name, description, settings } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Class name is required" },
        { status: 400 }
      );
    }

    if (name.trim().length > 100) {
      return NextResponse.json(
        { error: "Class name is too long (max 100 characters)" },
        { status: 400 }
      );
    }

    const db = await getDb();
    const userId = new ObjectId(auth.id);

    // Отримуємо ім'я викладача для кешування
    const user = await db.collection("users").findOne({ _id: userId });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Створюємо налаштування класу
    const classSettings: ClassSettings = {
      ...getDefaultClassSettings(),
      ...settings
    };

    // Генеруємо invite code якщо клас публічний
    if (classSettings.isPublic && !classSettings.inviteCode) {
      classSettings.inviteCode = generateInviteCode();
    }

    const now = new Date();

    const newClass: Omit<Class, '_id'> = {
      name: name.trim(),
      description: description?.trim() || undefined,
      teacherId: userId,
      teacherName: user.name || user.username,
      studentIds: [],
      students: [],
      settings: classSettings,
      createdAt: now,
      updatedAt: now,
      stats: {
        totalStudents: 0,
        activeStudents: 0,
        totalAssignments: 0,
        completedAssignments: 0
      }
    };

    const result = await db.collection<Class>("classes").insertOne(newClass as any);

    // Оновлюємо користувача - додаємо клас до списку
    await db.collection("users").updateOne(
      { _id: userId },
      {
        $addToSet: { 'classes.asTeacher': result.insertedId }
      }
    );

    return NextResponse.json({
      success: true,
      classId: result.insertedId.toString(),
      class: {
        ...newClass,
        _id: result.insertedId.toString(),
        teacherId: userId.toString(),
        myRole: 'teacher'
      }
    });
  } catch (error) {
    console.error("Error creating class:", error);
    return NextResponse.json(
      { error: "Failed to create class" },
      { status: 500 }
    );
  }
}
