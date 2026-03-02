import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { ObjectId } from "mongodb";
import { isValidInviteCode, type Class, type ClassStudent } from "@/lib/classes";
import { notifyStudentJoinedClass } from "@/lib/notifications";

// POST /api/classes/join - Приєднатися до класу через invite code
export async function POST(request: Request) {
  const auth = await getAuthUser();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { inviteCode } = body;

    if (!inviteCode || typeof inviteCode !== 'string') {
      return NextResponse.json(
        { error: "Invite code is required" },
        { status: 400 }
      );
    }

    const code = inviteCode.trim().toUpperCase();

    if (!isValidInviteCode(code)) {
      return NextResponse.json(
        { error: "Invalid invite code format" },
        { status: 400 }
      );
    }

    const db = await getDb();
    const userId = new ObjectId(auth.id);

    // Знайти клас з таким invite code
    const classDoc = await db.collection<Class>("classes").findOne({
      'settings.inviteCode': code,
      archivedAt: { $exists: false }
    });

    if (!classDoc) {
      return NextResponse.json(
        { error: "Class not found or invite code is invalid" },
        { status: 404 }
      );
    }

    // Перевірити чи клас публічний
    if (!classDoc.settings.isPublic) {
      return NextResponse.json(
        { error: "This class is not accepting new students" },
        { status: 403 }
      );
    }

    // Перевірити чи користувач вже в класі
    if (classDoc.studentIds.some(id => id.equals(userId))) {
      return NextResponse.json(
        { error: "You are already in this class" },
        { status: 400 }
      );
    }

    // Перевірити чи користувач - викладач цього класу
    if (classDoc.teacherId.equals(userId)) {
      return NextResponse.json(
        { error: "You are the teacher of this class" },
        { status: 400 }
      );
    }

    // Отримати інформацію про користувача
    const user = await db.collection("users").findOne({ _id: userId });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Додаємо студента
    const newStudent: ClassStudent = {
      id: userId.toString(),
      username: user.username,
      name: user.name || user.username,
      joinedAt: new Date()
    };

    await db.collection("classes").updateOne(
      { _id: classDoc._id },
      {
        $push: {
          studentIds: userId,
          students: newStudent
        } as any,
        $inc: {
          'stats.totalStudents': 1
        },
        $set: {
          updatedAt: new Date()
        }
      }
    );

    // Оновлюємо користувача - додаємо клас
    await db.collection("users").updateOne(
      { _id: userId },
      {
        $addToSet: { 'classes.asStudent': classDoc._id }
      }
    );

    // Отримати teacher для notification
    const teacher = await db.collection("users").findOne({ _id: classDoc.teacherId });

    // Створюємо notification для викладача
    if (teacher) {
      try {
        await notifyStudentJoinedClass({
          teacherId: classDoc.teacherId,
          teacherRole: teacher.role || "user",
          studentId: userId,
          studentName: user.name || user.username,
          classId: classDoc._id,
          className: classDoc.name
        });
      } catch (notifError) {
        console.error("Failed to create notification:", notifError);
      }
    }

    return NextResponse.json({
      success: true,
      classId: classDoc._id.toString(),
      className: classDoc.name
    });
  } catch (error) {
    console.error("Error joining class:", error);
    return NextResponse.json(
      { error: "Failed to join class" },
      { status: 500 }
    );
  }
}
