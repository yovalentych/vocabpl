import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { ObjectId } from "mongodb";
import { getAvailableModels, AI_MODELS } from "@/lib/ai-models";

export const dynamic = "force-dynamic";

/**
 * GET - Отримати список моделей та статистику використання
 */
export async function GET() {
  const auth = await getAuthUser();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await getDb();
  const user = await db.collection("users").findOne({ _id: new ObjectId(auth.id) });
  const isAdmin = Boolean(user?.role === "admin" || user?.isAdmin);

  if (!isAdmin) {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  // Отримати статистику використання за останній місяць
  const monthKey = new Date().toISOString().slice(0, 7);
  const usageLogs = await db
    .collection("ai_usage_logs")
    .find({ month: monthKey })
    .toArray();

  // Розрахувати статистику по моделях
  const modelStats: Record<string, {
    count: number;
    totalTokens: number;
    totalCredits: number;
    modes: Record<string, number>;
    visionUsage: number;
  }> = {};

  for (const log of usageLogs) {
    const modelId = log.model || "unknown";
    if (!modelStats[modelId]) {
      modelStats[modelId] = {
        count: 0,
        totalTokens: 0,
        totalCredits: 0,
        modes: {},
        visionUsage: 0
      };
    }

    modelStats[modelId].count++;
    modelStats[modelId].totalTokens += log.tokens?.total || 0;
    modelStats[modelId].totalCredits += log.credits || 0;

    const mode = log.mode || "unknown";
    modelStats[modelId].modes[mode] = (modelStats[modelId].modes[mode] || 0) + 1;

    if (log.needsVision) {
      modelStats[modelId].visionUsage++;
    }
  }

  // Отримати налаштування системи
  const systemConfig = await db.collection("system_config").findOne({ key: "ai_models" });

  return NextResponse.json({
    models: getAvailableModels(),
    stats: modelStats,
    config: {
      defaultModel: systemConfig?.defaultModel || "gpt-4.1-mini",
      defaultVisionModel: systemConfig?.defaultVisionModel || "gpt-4o"
    },
    period: monthKey
  });
}

/**
 * POST - Оновити конфігурацію моделей
 */
export async function POST(request: Request) {
  const auth = await getAuthUser();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await getDb();
  const user = await db.collection("users").findOne({ _id: new ObjectId(auth.id) });
  const isAdmin = Boolean(user?.role === "admin" || user?.isAdmin);

  if (!isAdmin) {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { defaultModel, defaultVisionModel } = body;

    // Валідація
    if (defaultModel && !AI_MODELS[defaultModel]) {
      return NextResponse.json({ error: "Invalid default model" }, { status: 400 });
    }

    if (defaultVisionModel && !AI_MODELS[defaultVisionModel]) {
      return NextResponse.json({ error: "Invalid vision model" }, { status: 400 });
    }

    if (defaultVisionModel && !AI_MODELS[defaultVisionModel].supportsVision) {
      return NextResponse.json({
        error: "Selected vision model does not support vision"
      }, { status: 400 });
    }

    // Оновити конфігурацію
    await db.collection("system_config").updateOne(
      { key: "ai_models" },
      {
        $set: {
          defaultModel: defaultModel || "gpt-4.1-mini",
          defaultVisionModel: defaultVisionModel || "gpt-4o",
          updatedAt: new Date(),
          updatedBy: auth.username
        }
      },
      { upsert: true }
    );

    return NextResponse.json({
      success: true,
      message: "AI models configuration updated"
    });
  } catch (error) {
    console.error("AI models config error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
