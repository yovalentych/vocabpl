import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { ObjectId } from "mongodb";
import { isTutorOrAdmin } from "@/lib/auth";
import type { AssignmentTemplate } from "@/lib/classes";

// GET /api/classes/templates - Get all templates for the teacher
export async function GET(request: Request) {
  const auth = await getAuthUser();
  if (!auth || !isTutorOrAdmin(auth)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const tag = searchParams.get("tag");
    const type = searchParams.get("type");
    const exerciseType = searchParams.get("exerciseType");

    const db = await getDb();

    // Build filter
    const filter: any = {
      teacherId: new ObjectId(auth.id)
    };

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } }
      ];
    }

    if (tag) {
      filter.tags = tag;
    }

    if (type) {
      filter.type = type;
    }

    if (exerciseType) {
      filter.exerciseType = exerciseType;
    }

    const templates = await db
      .collection<AssignmentTemplate>("assignment_templates")
      .find(filter)
      .sort({ lastUsedAt: -1, createdAt: -1 })
      .toArray();

    return NextResponse.json({
      templates: templates.map(t => ({
        ...t,
        _id: t._id.toString(),
        teacherId: t.teacherId.toString(),
        testId: t.testId?.toString(),
        readingId: t.readingId?.toString()
      }))
    });
  } catch (error) {
    console.error("Error fetching templates:", error);
    return NextResponse.json(
      { error: "Failed to fetch templates" },
      { status: 500 }
    );
  }
}

// POST /api/classes/templates - Create a new template
export async function POST(request: Request) {
  const auth = await getAuthUser();
  if (!auth || !isTutorOrAdmin(auth)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      name,
      description,
      tags,
      type,
      exerciseType,
      exerciseConfig,
      testId,
      readingId,
      defaultTitle,
      defaultDescription,
      defaultInstructions,
      defaultPointsTotal,
      defaultPassingScore,
      defaultSettings
    } = body;

    if (!name || !type) {
      return NextResponse.json(
        { error: "Name and type are required" },
        { status: 400 }
      );
    }

    if (!['exercise', 'test', 'reading', 'custom'].includes(type)) {
      return NextResponse.json(
        { error: "Invalid type" },
        { status: 400 }
      );
    }

    // Validate exercise type if type is exercise
    if (type === 'exercise' && !exerciseType) {
      return NextResponse.json(
        { error: "Exercise type is required for exercise templates" },
        { status: 400 }
      );
    }

    const db = await getDb();
    const now = new Date();

    const newTemplate: Omit<AssignmentTemplate, '_id'> = {
      teacherId: new ObjectId(auth.id),
      name: name.trim(),
      description: description?.trim(),
      tags: tags || [],
      type,
      exerciseType,
      exerciseConfig,
      testId: testId ? new ObjectId(testId) : undefined,
      readingId: readingId ? new ObjectId(readingId) : undefined,
      defaultTitle: defaultTitle?.trim(),
      defaultDescription: defaultDescription?.trim(),
      defaultInstructions: defaultInstructions?.trim(),
      defaultPointsTotal,
      defaultPassingScore,
      defaultSettings,
      usedCount: 0,
      createdAt: now,
      updatedAt: now
    };

    const result = await db
      .collection<AssignmentTemplate>("assignment_templates")
      .insertOne(newTemplate as any);

    return NextResponse.json({
      success: true,
      templateId: result.insertedId.toString()
    });
  } catch (error) {
    console.error("Error creating template:", error);
    return NextResponse.json(
      { error: "Failed to create template" },
      { status: 500 }
    );
  }
}
