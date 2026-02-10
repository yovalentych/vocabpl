import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

/**
 * POST /api/admin/content-quality-log
 *
 * Логує метрики якості AI-генерованого контенту для моніторингу
 * Викликається автоматично з клієнтських компонентів при валідації
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();

    // Parse request body
    const body = await request.json().catch(() => ({}));
    const {
      type,
      level,
      topic,
      validation,
      metrics,
      ...additionalData
    } = body;

    // Validate required fields
    if (!type || !validation) {
      return NextResponse.json(
        { error: "Missing required fields: type, validation" },
        { status: 400 }
      );
    }

    const db = await getDb();

    // Insert log entry
    const logEntry = {
      userId: user?.id || "anonymous",
      username: user?.username || "anonymous",
      isAdmin: user?.role === "admin" || user?.isAdmin || false,

      // Content metadata
      type,
      level: level || "unknown",
      topic: topic || null,

      // Validation results
      validation: {
        valid: validation.valid,
        score: validation.score,
        errors: validation.errors || []
      },

      // Content metrics
      metrics: metrics || null,

      // Additional context
      additionalData,

      // Timestamp
      createdAt: new Date(),
      month: new Date().toISOString().slice(0, 7) // YYYY-MM for indexing
    };

    await db.collection("content_quality_logs").insertOne(logEntry);

    return NextResponse.json({
      success: true,
      logged: true
    });
  } catch (error) {
    console.error("Content quality log error:", error);

    // Don't fail the client request if logging fails
    return NextResponse.json({
      success: false,
      error: "Failed to log quality metrics"
    }, { status: 500 });
  }
}

/**
 * GET /api/admin/content-quality-log
 *
 * Отримати статистику якості контенту (тільки для адмінів)
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();

    // Check admin access
    const isAdmin = user?.role === "admin" || user?.isAdmin;
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const level = searchParams.get("level");
    const month = searchParams.get("month") || new Date().toISOString().slice(0, 7);
    const limit = parseInt(searchParams.get("limit") || "100");

    const db = await getDb();

    // Build query
    const query: any = { month };
    if (type) query.type = type;
    if (level) query.level = level;

    // Fetch logs
    const logs = await db
      .collection("content_quality_logs")
      .find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();

    // Calculate statistics
    const stats = {
      totalLogs: logs.length,
      validCount: logs.filter(log => log.validation?.valid).length,
      invalidCount: logs.filter(log => !log.validation?.valid).length,
      averageScore: logs.length > 0
        ? logs.reduce((sum, log) => sum + (log.validation?.score || 0), 0) / logs.length
        : 0,

      // Group by type
      byType: logs.reduce((acc: any, log) => {
        const t = log.type || "unknown";
        if (!acc[t]) {
          acc[t] = { count: 0, validCount: 0, totalScore: 0 };
        }
        acc[t].count++;
        if (log.validation?.valid) acc[t].validCount++;
        acc[t].totalScore += log.validation?.score || 0;
        return acc;
      }, {}),

      // Group by level
      byLevel: logs.reduce((acc: any, log) => {
        const l = log.level || "unknown";
        if (!acc[l]) {
          acc[l] = { count: 0, validCount: 0, totalScore: 0 };
        }
        acc[l].count++;
        if (log.validation?.valid) acc[l].validCount++;
        acc[l].totalScore += log.validation?.score || 0;
        return acc;
      }, {}),

      // Common errors
      commonErrors: logs
        .flatMap(log => log.validation?.errors || [])
        .reduce((acc: any, error: string) => {
          acc[error] = (acc[error] || 0) + 1;
          return acc;
        }, {})
    };

    // Calculate averages
    Object.values(stats.byType).forEach((typeStats: any) => {
      typeStats.averageScore = typeStats.count > 0
        ? typeStats.totalScore / typeStats.count
        : 0;
    });
    Object.values(stats.byLevel).forEach((levelStats: any) => {
      levelStats.averageScore = levelStats.count > 0
        ? levelStats.totalScore / levelStats.count
        : 0;
    });

    return NextResponse.json({
      success: true,
      month,
      stats,
      logs: logs.slice(0, 20) // Return first 20 logs
    });
  } catch (error) {
    console.error("Failed to fetch quality logs:", error);
    return NextResponse.json(
      { error: "Failed to fetch quality logs" },
      { status: 500 }
    );
  }
}
