import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { ObjectId } from "mongodb";
import { isTeacherOfClass, generateInviteCode } from "@/lib/classes";

export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await getAuthUser();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const classId = params.id;
  if (!classId || !ObjectId.isValid(classId)) {
    return NextResponse.json({ error: "Invalid class ID" }, { status: 400 });
  }

  try {
    const db = await getDb();
    const classObjectId = new ObjectId(classId);

    const classDoc = await db.collection("classes").findOne({ _id: classObjectId });
    if (!classDoc) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    if (!isTeacherOfClass(auth.id, classDoc as any)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Generate new invite code
    const newInviteCode = generateInviteCode();

    await db.collection("classes").updateOne(
      { _id: classObjectId },
      { $set: { "settings.inviteCode": newInviteCode } }
    );

    return NextResponse.json({
      success: true,
      inviteCode: newInviteCode
    });
  } catch (error) {
    console.error("Error regenerating invite code:", error);
    return NextResponse.json(
      { error: "Failed to regenerate invite code" },
      { status: 500 }
    );
  }
}
