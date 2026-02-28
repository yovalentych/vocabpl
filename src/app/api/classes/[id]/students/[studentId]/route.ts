import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { ObjectId } from "mongodb";
import { isTeacherOfClass, type Class } from "@/lib/classes";

// DELETE /api/classes/[id]/students/[studentId] - Видалити студента
export async function DELETE(
  request: Request,
  { params }: { params: { id: string; studentId: string } }
) {
  const auth = await getAuthUser();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const classId = new ObjectId(params.id);
    const studentId = new ObjectId(params.studentId);
    const db = await getDb();

    const classDoc = await db.collection<Class>("classes").findOne({ _id: classId });

    if (!classDoc) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    // Викладач може видалити будь-якого студента
    // Студент може видалити тільки себе (вийти з класу)
    const isTeacher = isTeacherOfClass(auth.id, classDoc);
    const isSelf = auth.id === params.studentId;

    if (!isTeacher && !isSelf) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    // Перевірити чи студент в класі
    if (!classDoc.studentIds.some(id => id.equals(studentId))) {
      return NextResponse.json(
        { error: "Student not in class" },
        { status: 404 }
      );
    }

    // Видаляємо студента
    await db.collection("classes").updateOne(
      { _id: classId },
      {
        $pull: {
          studentIds: studentId,
          students: { id: params.studentId }
        } as any,
        $inc: {
          'stats.totalStudents': -1
        },
        $set: {
          updatedAt: new Date()
        }
      }
    );

    // Оновлюємо користувача - видаляємо клас
    await db.collection("users").updateOne(
      { _id: studentId },
      {
        $pull: { 'classes.asStudent': classId } as any
      }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing student:", error);
    return NextResponse.json(
      { error: "Failed to remove student" },
      { status: 500 }
    );
  }
}
