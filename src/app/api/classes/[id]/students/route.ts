import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { ObjectId } from "mongodb";
import { isTeacherOfClass, type Class, type ClassStudent } from "@/lib/classes";

// GET /api/classes/[id]/students - Отримати список студентів класу
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await getAuthUser();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const classId = new ObjectId(params.id);
    const db = await getDb();

    const classDoc = await db.collection<Class>("classes").findOne({ _id: classId });

    if (!classDoc) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    // Тільки викладач або студент класу можуть бачити список
    const isTeacher = isTeacherOfClass(auth.id, classDoc);
    const isStudent = classDoc.studentIds.some(id => id.toString() === auth.id);

    if (!isTeacher && !isStudent) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Для викладача - повна інформація
    // Для студента - тільки базова інформація
    const students = isTeacher
      ? classDoc.students
      : classDoc.students.map(s => ({
          id: s.id,
          username: s.username,
          name: s.name
        }));

    return NextResponse.json({ students });
  } catch (error) {
    console.error("Error fetching students:", error);
    return NextResponse.json(
      { error: "Failed to fetch students" },
      { status: 500 }
    );
  }
}

// POST /api/classes/[id]/students - Додати студента (тільки викладач)
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await getAuthUser();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const classId = new ObjectId(params.id);
    const db = await getDb();

    const classDoc = await db.collection<Class>("classes").findOne({ _id: classId });

    if (!classDoc) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    // Тільки викладач може додавати студентів
    if (!isTeacherOfClass(auth.id, classDoc)) {
      return NextResponse.json(
        { error: "Only teacher can add students" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { username } = body;

    if (!username || typeof username !== 'string') {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400 }
      );
    }

    // Знайти користувача за username
    const student = await db.collection("users").findOne({
      username: username.trim()
    });

    if (!student) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const studentId = student._id as ObjectId;

    // Перевірити чи студент вже в класі
    if (classDoc.studentIds.some(id => id.equals(studentId))) {
      return NextResponse.json(
        { error: "Student already in class" },
        { status: 400 }
      );
    }

    // Додаємо студента
    const newStudent: ClassStudent = {
      id: studentId.toString(),
      username: student.username,
      name: student.name || student.username,
      joinedAt: new Date()
    };

    await db.collection("classes").updateOne(
      { _id: classId },
      {
        $push: {
          studentIds: studentId,
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
      { _id: studentId },
      {
        $addToSet: { 'classes.asStudent': classId }
      }
    );

    return NextResponse.json({
      success: true,
      student: newStudent
    });
  } catch (error) {
    console.error("Error adding student:", error);
    return NextResponse.json(
      { error: "Failed to add student" },
      { status: 500 }
    );
  }
}
