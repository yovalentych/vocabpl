import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await getAuthUser();
  if (!auth || !auth.isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const monthParam = url.searchParams.get("month");
  const monthKey = monthParam && /^\d{4}-\d{2}$/.test(monthParam)
    ? monthParam
    : new Date().toISOString().slice(0, 7);

  const db = await getDb();
  const logs = await db
    .collection("ai_usage_logs")
    .find({ month: monthKey })
    .project({ mode: 1, model: 1, credits: 1, tokens: 1, createdAt: 1 })
    .toArray();

  const summary = {
    month: monthKey,
    totalRequests: logs.length,
    totalCredits: 0,
    totalTokens: 0,
    promptTokens: 0,
    completionTokens: 0,
    avgTokens: 0,
    avgCredits: 0
  };

  const byMode = new Map<string, { count: number; credits: number; tokens: number }>();
  const byModel = new Map<string, { count: number; credits: number; tokens: number }>();
  const byDay = new Map<string, { count: number; credits: number; tokens: number }>();

  for (const log of logs) {
    const credits = Number(log?.credits || 0);
    const tokens = Number(log?.tokens?.total || 0);
    const prompt = Number(log?.tokens?.prompt || 0);
    const completion = Number(log?.tokens?.completion || 0);
    summary.totalCredits += credits;
    summary.totalTokens += tokens;
    summary.promptTokens += prompt;
    summary.completionTokens += completion;

    const modeKey = String(log?.mode || "unknown");
    const modeEntry = byMode.get(modeKey) || { count: 0, credits: 0, tokens: 0 };
    modeEntry.count += 1;
    modeEntry.credits += credits;
    modeEntry.tokens += tokens;
    byMode.set(modeKey, modeEntry);

    const modelKey = String(log?.model || "unknown");
    const modelEntry = byModel.get(modelKey) || { count: 0, credits: 0, tokens: 0 };
    modelEntry.count += 1;
    modelEntry.credits += credits;
    modelEntry.tokens += tokens;
    byModel.set(modelKey, modelEntry);

    const createdAt = log?.createdAt ? new Date(log.createdAt) : null;
    if (createdAt && !Number.isNaN(createdAt.getTime())) {
      const dayKey = createdAt.toISOString().slice(0, 10);
      const dayEntry = byDay.get(dayKey) || { count: 0, credits: 0, tokens: 0 };
      dayEntry.count += 1;
      dayEntry.credits += credits;
      dayEntry.tokens += tokens;
      byDay.set(dayKey, dayEntry);
    }
  }

  if (summary.totalRequests > 0) {
    summary.avgTokens = Math.round(summary.totalTokens / summary.totalRequests);
    summary.avgCredits = Math.round((summary.totalCredits / summary.totalRequests) * 10) / 10;
  }

  const sortMap = (map: Map<string, { count: number; credits: number; tokens: number }>) =>
    Array.from(map.entries())
      .map(([key, value]) => ({ key, ...value }))
      .sort((a, b) => b.tokens - a.tokens);

  const daily = Array.from(byDay.entries())
    .map(([day, value]) => ({ day, ...value }))
    .sort((a, b) => a.day.localeCompare(b.day));

  return NextResponse.json({
    summary,
    modes: sortMap(byMode),
    models: sortMap(byModel),
    daily
  });
}
