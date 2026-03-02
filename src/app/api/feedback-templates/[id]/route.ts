import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { ObjectId } from "mongodb";
import type { FeedbackTemplate } from "../route";

// DELETE /api/feedback-templates/[id] - Delete user template (not defaults)
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await getAuthUser();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const templateId = new ObjectId(params.id);
    const db = await getDb();

    // Check if template exists and belongs to user
    const template = await db
      .collection<FeedbackTemplate>("feedback_templates")
      .findOne({ _id: templateId });

    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    // Cannot delete default templates
    if (template.isDefault) {
      return NextResponse.json(
        { error: "Cannot delete default templates" },
        { status: 403 }
      );
    }

    // Ensure user owns the template
    if (template.teacherId?.toString() !== auth.id) {
      return NextResponse.json(
        { error: "You can only delete your own templates" },
        { status: 403 }
      );
    }

    await db.collection("feedback_templates").deleteOne({ _id: templateId });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting feedback template:", error);
    return NextResponse.json(
      { error: "Failed to delete template" },
      { status: 500 }
    );
  }
}

// PATCH /api/feedback-templates/[id] - Increment usedCount
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await getAuthUser();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const templateId = new ObjectId(params.id);
    const db = await getDb();

    // Increment usage count
    const result = await db
      .collection<FeedbackTemplate>("feedback_templates")
      .updateOne(
        { _id: templateId },
        { $inc: { usedCount: 1 } }
      );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating feedback template:", error);
    return NextResponse.json(
      { error: "Failed to update template" },
      { status: 500 }
    );
  }
}
