import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { ObjectId } from "mongodb";
import { isTutorOrAdmin } from "@/lib/auth";

// POST /api/classes/templates/[id]/use - Increment usage count
export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await getAuthUser();
  if (!auth || !isTutorOrAdmin(auth)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const templateId = params.id;
  if (!templateId || !ObjectId.isValid(templateId)) {
    return NextResponse.json({ error: "Invalid template ID" }, { status: 400 });
  }

  try {
    const db = await getDb();
    const now = new Date();

    await db.collection("assignment_templates").updateOne(
      { _id: new ObjectId(templateId) },
      {
        $inc: { usedCount: 1 },
        $set: { lastUsedAt: now }
      }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating template usage:", error);
    return NextResponse.json(
      { error: "Failed to update usage" },
      { status: 500 }
    );
  }
}
