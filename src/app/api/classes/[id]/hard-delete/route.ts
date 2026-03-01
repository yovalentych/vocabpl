import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { ObjectId } from "mongodb";
import { isTeacherOfClass } from "@/lib/classes";

export async function DELETE(
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

    // Get all assignments for this class
    const assignments = await db
      .collection("class_assignments")
      .find({ classId: classObjectId })
      .toArray();

    const assignmentIds = assignments.map(a => a._id);

    // Check if there are any graded submissions
    const gradedSubmissions = await db
      .collection("class_submissions")
      .countDocuments({
        assignmentId: { $in: assignmentIds },
        status: "graded"
      });

    if (gradedSubmissions > 0) {
      return NextResponse.json(
        { error: "Cannot delete class with graded submissions. Archive it instead." },
        { status: 400 }
      );
    }

    // Delete all submissions
    await db.collection("class_submissions").deleteMany({
      assignmentId: { $in: assignmentIds }
    });

    // Delete all assignments
    await db.collection("class_assignments").deleteMany({
      classId: classObjectId
    });

    // Delete the class
    await db.collection("classes").deleteOne({ _id: classObjectId });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting class:", error);
    return NextResponse.json(
      { error: "Failed to delete class" },
      { status: 500 }
    );
  }
}
