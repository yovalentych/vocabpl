import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getAuthUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
export const dynamic = "force-dynamic";


type ProgressPayload = {
  testId: string;
  roundQuestionIds: string[];
  answers: Record<string, string | string[]>;
  checked: Record<string, string | string[]>;
  index: number;
  remediationRound: number;
};

function isAnswerRecord(value: unknown): value is Record<string, string | string[]> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function isValidAnswerValue(value: unknown) {
  if (typeof value === "string") return true;
  if (Array.isArray(value)) return value.every((item) => typeof item === "string");
  return false;
}

function isValidAnswerRecord(value: unknown): value is Record<string, string | string[]> {
  if (!isAnswerRecord(value)) return false;
  return Object.values(value).every(isValidAnswerValue);
}

export async function GET(request: NextRequest) {
  const auth = await getAuthUser();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const testId = searchParams.get("testId")?.trim();

  const db = await getDb();
  const user = await db.collection("users").findOne(
    { _id: new ObjectId(auth.id) },
    { projection: { testProgress: 1 } }
  );

  const progress = user?.testProgress || {};
  if (testId) {
    return NextResponse.json({ progress: progress[testId] || null });
  }

  return NextResponse.json({ progress });
}

export async function POST(request: Request) {
  const auth = await getAuthUser();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as ProgressPayload | null;
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { testId, roundQuestionIds, answers, checked, index, remediationRound } = body;
  if (
    !testId ||
    typeof testId !== "string" ||
    testId.includes(".") ||
    !Array.isArray(roundQuestionIds) ||
    !isValidAnswerRecord(answers) ||
    !isValidAnswerRecord(checked) ||
    typeof index !== "number" ||
    typeof remediationRound !== "number"
  ) {
    return NextResponse.json({ error: "Invalid progress data" }, { status: 400 });
  }

  const entry = {
    testId,
    roundQuestionIds,
    answers,
    checked,
    index,
    remediationRound,
    updatedAt: new Date()
  };

  const db = await getDb();
  await db.collection("users").updateOne(
    { _id: new ObjectId(auth.id) },
    { $set: { [`testProgress.${testId}`]: entry } }
  );

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const auth = await getAuthUser();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const testId = searchParams.get("testId")?.trim();

  const db = await getDb();
  if (testId) {
    if (testId.includes(".")) {
      return NextResponse.json({ error: "Invalid test id" }, { status: 400 });
    }
    await db.collection("users").updateOne(
      { _id: new ObjectId(auth.id) },
      { $unset: { [`testProgress.${testId}`]: "" } }
    );
    return NextResponse.json({ ok: true });
  }

  await db.collection("users").updateOne(
    { _id: new ObjectId(auth.id) },
    { $unset: { testProgress: "" } }
  );
  return NextResponse.json({ ok: true });
}
