import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
export const dynamic = "force-dynamic";


type WordPayload = {
  version?: string;
  source?: string;
  items?: { id?: string; pl?: string; uk?: string; pos?: string }[];
};

type TestPayload = {
  id?: string;
  title?: string;
  source?: string;
  version?: string;
  items?: {
    id?: string;
    number?: number;
    type?: string;
    prompt?: string;
    options?: { id?: string; text?: string }[];
    answer?: string | string[];
    answerType?: string;
  }[];
};

function normalizeFileBase(fileName?: string) {
  if (!fileName) return "";
  return fileName.replace(/\.[^.]+$/, "");
}

function buildWordOps(
  payload: WordPayload,
  type: "verb" | "adverb" | "adjective",
  sourceFallback: string
) {
  const items = Array.isArray(payload.items) ? payload.items : [];
  const source = payload.source || sourceFallback || "import";
  const ops = items
    .map((item) => ({
      id: item.id?.trim(),
      pl: item.pl?.trim(),
      uk: item.uk?.trim(),
      pos: item.pos?.trim() || type
    }))
    .filter((item) => item.id && item.pl && item.uk)
    .map((item) => ({
      updateOne: {
        filter: { id: item.id, type },
        update: { $set: { ...item, type, source } },
        upsert: true
      }
    }));
  return ops;
}

export async function POST(request: Request) {
  const auth = await getAuthUser();
  if (!auth || !auth.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const kind = body.kind as string | undefined;
  const fileName = typeof body.fileName === "string" ? body.fileName : "";
  const fileBase = normalizeFileBase(fileName);

  if (!kind || !["verbs", "adverbs", "adjectives", "tests"].includes(kind)) {
    return NextResponse.json({ error: "Missing or invalid import kind." }, { status: 400 });
  }

  const db = await getDb();

  if (kind === "verbs" || kind === "adverbs" || kind === "adjectives") {
    const payload = body.payload as WordPayload | undefined;
    if (!payload || !Array.isArray(payload.items)) {
      return NextResponse.json({ error: "Expected JSON with items array." }, { status: 400 });
    }
    const type =
      kind === "verbs" ? "verb" : kind === "adverbs" ? "adverb" : "adjective";
    const items = payload.items || [];
    const ids = items.map((item) => item.id?.trim()).filter(Boolean) as string[];
    const duplicateIds = ids.filter((id, idx) => ids.indexOf(id) !== idx);
    if (duplicateIds.length) {
      return NextResponse.json(
        { error: "Duplicate ids in JSON.", duplicates: Array.from(new Set(duplicateIds)) },
        { status: 400 }
      );
    }

    const existing = await db
      .collection("words")
      .find({ type, id: { $in: ids } }, { projection: { _id: 0, id: 1 } })
      .toArray();
    if (existing.length) {
      return NextResponse.json(
        { error: "Some ids already exist.", duplicates: existing.map((item) => item.id) },
        { status: 400 }
      );
    }

    const ops = buildWordOps(payload, type, fileBase || kind);
    if (!ops.length) {
      return NextResponse.json({ error: "No valid items found in JSON." }, { status: 400 });
    }
    const result = await db.collection("words").bulkWrite(ops);
    return NextResponse.json({
      ok: true,
      kind,
      inserted: result.upsertedCount,
      updated: result.modifiedCount,
      total: ops.length
    });
  }

  const payload = body.payload as TestPayload | undefined;
  if (!payload || !Array.isArray(payload.items)) {
    return NextResponse.json({ error: "Expected JSON with items array." }, { status: 400 });
  }
  const id = payload.id?.trim() || fileBase || `test_${Date.now()}`;
  const questions = payload.items
    .map((item) => ({
      id: item.id?.trim() || "",
      number: item.number ?? 0,
      type: item.type?.trim() || "mcq",
      prompt: item.prompt?.trim() || "",
      options: Array.isArray(item.options)
        ? item.options
            .map((opt) => ({ id: opt.id?.trim() || "", text: opt.text?.trim() || "" }))
            .filter((opt) => opt.id && opt.text)
        : [],
      answer: Array.isArray(item.answer)
        ? item.answer.map((value) => value.trim()).filter(Boolean)
        : item.answer?.trim() || "",
      answerType: item.answerType?.trim() || "mcq"
    }))
    .filter((item) => item.id && item.prompt);

  if (!questions.length) {
    return NextResponse.json({ error: "No valid test questions found in JSON." }, { status: 400 });
  }

  const doc = {
    id,
    title: payload.title?.trim() || id,
    source: payload.source?.trim() || fileBase || "import",
    version: payload.version?.trim() || "1.0.0",
    questions
  };

  const result = await db.collection("tests").updateOne({ id }, { $set: doc }, { upsert: true });
  return NextResponse.json({
    ok: true,
    kind,
    inserted: result.upsertedCount,
    updated: result.modifiedCount,
    total: questions.length,
    id
  });
}
