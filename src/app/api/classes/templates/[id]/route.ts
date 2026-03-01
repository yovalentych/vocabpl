import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { ObjectId } from "mongodb";
import { isTutorOrAdmin } from "@/lib/auth";
import type { AssignmentTemplate } from "@/lib/classes";

// GET /api/classes/templates/[id] - Get a specific template
export async function GET(
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
    const template = await db
      .collection<AssignmentTemplate>("assignment_templates")
      .findOne({ _id: new ObjectId(templateId) });

    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    // Verify ownership
    if (template.teacherId.toString() !== auth.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({
      template: {
        ...template,
        _id: template._id.toString(),
        teacherId: template.teacherId.toString(),
        testId: template.testId?.toString(),
        readingId: template.readingId?.toString()
      }
    });
  } catch (error) {
    console.error("Error fetching template:", error);
    return NextResponse.json(
      { error: "Failed to fetch template" },
      { status: 500 }
    );
  }
}

// PATCH /api/classes/templates/[id] - Update a template
export async function PATCH(
  request: Request,
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
    const template = await db
      .collection<AssignmentTemplate>("assignment_templates")
      .findOne({ _id: new ObjectId(templateId) });

    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    // Verify ownership
    if (template.teacherId.toString() !== auth.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const {
      name,
      description,
      tags,
      defaultTitle,
      defaultDescription,
      defaultInstructions,
      defaultPointsTotal,
      defaultPassingScore,
      defaultSettings,
      exerciseConfig
    } = body;

    const updates: any = {
      updatedAt: new Date()
    };

    if (name !== undefined) {
      if (!name.trim()) {
        return NextResponse.json({ error: "Name is required" }, { status: 400 });
      }
      updates.name = name.trim();
    }

    if (description !== undefined) updates.description = description?.trim();
    if (tags !== undefined) updates.tags = tags;
    if (defaultTitle !== undefined) updates.defaultTitle = defaultTitle?.trim();
    if (defaultDescription !== undefined) updates.defaultDescription = defaultDescription?.trim();
    if (defaultInstructions !== undefined) updates.defaultInstructions = defaultInstructions?.trim();
    if (defaultPointsTotal !== undefined) updates.defaultPointsTotal = defaultPointsTotal;
    if (defaultPassingScore !== undefined) updates.defaultPassingScore = defaultPassingScore;
    if (defaultSettings !== undefined) updates.defaultSettings = defaultSettings;
    if (exerciseConfig !== undefined) updates.exerciseConfig = exerciseConfig;

    await db
      .collection<AssignmentTemplate>("assignment_templates")
      .updateOne(
        { _id: new ObjectId(templateId) },
        { $set: updates }
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating template:", error);
    return NextResponse.json(
      { error: "Failed to update template" },
      { status: 500 }
    );
  }
}

// DELETE /api/classes/templates/[id] - Delete a template
export async function DELETE(
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
    const template = await db
      .collection<AssignmentTemplate>("assignment_templates")
      .findOne({ _id: new ObjectId(templateId) });

    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    // Verify ownership
    if (template.teacherId.toString() !== auth.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await db
      .collection<AssignmentTemplate>("assignment_templates")
      .deleteOne({ _id: new ObjectId(templateId) });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting template:", error);
    return NextResponse.json(
      { error: "Failed to delete template" },
      { status: 500 }
    );
  }
}
