import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { ObjectId } from "mongodb";
import {
  canAccessClass,
  isTeacherOfClass,
  generateInviteCode,
  type Class
} from "@/lib/classes";
import { notifyClassArchived } from "@/lib/notifications";

// GET /api/classes/[id] - Отримати деталі класу
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

    // Перевірка доступу
    if (!canAccessClass(auth.id, classDoc)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Визначаємо роль користувача
    const myRole = isTeacherOfClass(auth.id, classDoc) ? 'teacher' : 'student';

    return NextResponse.json({
      class: {
        ...classDoc,
        _id: classDoc._id.toString(),
        teacherId: classDoc.teacherId.toString(),
        studentIds: classDoc.studentIds.map(id => id.toString()),
        myRole
      }
    });
  } catch (error) {
    console.error("Error fetching class:", error);
    return NextResponse.json(
      { error: "Failed to fetch class" },
      { status: 500 }
    );
  }
}

// PATCH /api/classes/[id] - Оновити клас (тільки викладач)
export async function PATCH(
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

    // Тільки викладач може оновлювати клас
    if (!isTeacherOfClass(auth.id, classDoc)) {
      return NextResponse.json(
        { error: "Only teacher can update class" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, description, settings } = body;

    const updates: any = {
      updatedAt: new Date()
    };

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        return NextResponse.json(
          { error: "Invalid class name" },
          { status: 400 }
        );
      }
      if (name.trim().length > 100) {
        return NextResponse.json(
          { error: "Class name is too long" },
          { status: 400 }
        );
      }
      updates.name = name.trim();
    }

    if (description !== undefined) {
      updates.description = description?.trim() || undefined;
    }

    if (settings !== undefined) {
      const mergedSettings = {
        ...classDoc.settings,
        ...settings
      };
      // Auto-generate invite code when making class public
      if (mergedSettings.isPublic && !mergedSettings.inviteCode) {
        mergedSettings.inviteCode = generateInviteCode();
      }
      updates.settings = mergedSettings;
    }

    await db.collection("classes").updateOne(
      { _id: classId },
      { $set: updates }
    );

    return NextResponse.json({
      success: true,
      ...(updates.settings?.inviteCode ? { inviteCode: updates.settings.inviteCode } : {})
    });
  } catch (error) {
    console.error("Error updating class:", error);
    return NextResponse.json(
      { error: "Failed to update class" },
      { status: 500 }
    );
  }
}

// DELETE /api/classes/[id] - Архівувати клас (тільки викладач)
export async function DELETE(
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

    // Тільки викладач може архівувати клас
    if (!isTeacherOfClass(auth.id, classDoc)) {
      return NextResponse.json(
        { error: "Only teacher can archive class" },
        { status: 403 }
      );
    }

    // Архівуємо замість видалення (soft delete)
    await db.collection("classes").updateOne(
      { _id: classId },
      {
        $set: {
          archivedAt: new Date(),
          updatedAt: new Date()
        }
      }
    );

    // Надіслати нотифікації студентам про архівацію класу
    if (classDoc.studentIds && classDoc.studentIds.length > 0) {
      notifyClassArchived({
        studentIds: classDoc.studentIds,
        classId: classDoc._id,
        className: classDoc.name,
        teacherName: classDoc.teacherName || "Викладач"
      }).catch(err => {
        console.error("Failed to send class archived notifications:", err);
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error archiving class:", error);
    return NextResponse.json(
      { error: "Failed to archive class" },
      { status: 500 }
    );
  }
}
