import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getAuthUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { isSubscriptionActive } from "@/lib/subscription";

export async function GET(request: Request) {
  const auth = await getAuthUser();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = await getDb();
  const user = await db.collection("users").findOne({ _id: new ObjectId(auth.id) });
  const active = isSubscriptionActive(user?.subscription, auth.isAdmin);
  if (!active) return NextResponse.json({ error: "Subscription required" }, { status: 403 });
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const q = searchParams.get("q")?.trim().toLowerCase();

  const doc = await db.collection("user_notes").findOne({ userId: new ObjectId(auth.id) });

  if (doc && Array.isArray(doc.notes) === false && Array.isArray(doc.content)) {
    const migrated = [
      {
        id: `note_${Date.now()}`,
        title: "Notatka",
        content: doc.content,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    await db.collection("user_notes").updateOne(
      { userId: new ObjectId(auth.id) },
      { $set: { notes: migrated }, $unset: { content: "" } }
    );
    if (id) {
      return NextResponse.json({ note: migrated.find((note) => note.id === id) || null });
    }
    return NextResponse.json({
      notes: migrated.map(({ id: noteId, title, updatedAt }) => ({ id: noteId, title, updatedAt }))
    });
  }

  const notes = Array.isArray(doc?.notes) ? doc.notes : [];
  if (id) {
    const note = notes.find((item: any) => item.id === id) || null;
    return NextResponse.json({ note });
  }

  if (q) {
    const filtered = notes.filter((note: any) => {
      const title = String(note.title || "").toLowerCase();
      if (title.includes(q)) return true;
      try {
        const text = JSON.stringify(note.content || []).toLowerCase();
        return text.includes(q);
      } catch {
        return false;
      }
    });
    return NextResponse.json({
      notes: filtered.map((item: any) => ({ id: item.id, title: item.title, updatedAt: item.updatedAt }))
    });
  }

  return NextResponse.json({
    notes: notes.map((item: any) => ({ id: item.id, title: item.title, updatedAt: item.updatedAt }))
  });
}

export async function POST(request: Request) {
  const auth = await getAuthUser();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, title, content } = await request.json();
  const db = await getDb();
  const userId = new ObjectId(auth.id);
  const user = await db.collection("users").findOne({ _id: userId });
  const active = isSubscriptionActive(user?.subscription, auth.isAdmin);
  if (!active) return NextResponse.json({ error: "Subscription required" }, { status: 403 });
  const doc = await db.collection("user_notes").findOne({ userId });
  const notes = Array.isArray(doc?.notes) ? doc.notes : [];

  if (id) {
    const nextNotes = notes.map((note: any) =>
      note.id === id
        ? {
            ...note,
            title: typeof title === "string" && title.trim() ? title.trim() : note.title,
            content: Array.isArray(content) ? content : [],
            updatedAt: new Date()
          }
        : note
    );
    await db.collection("user_notes").updateOne(
      { userId },
      { $set: { notes: nextNotes }, $setOnInsert: { createdAt: new Date() } },
      { upsert: true }
    );
    return NextResponse.json({ ok: true });
  }

  const newNote = {
    id: `note_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
    title: typeof title === "string" && title.trim() ? title.trim() : "Notatka",
    content: Array.isArray(content) ? content : [],
    createdAt: new Date(),
    updatedAt: new Date()
  };
  await db.collection("user_notes").updateOne(
    { userId },
    { $set: { notes: [newNote, ...notes] }, $setOnInsert: { createdAt: new Date() } },
    { upsert: true }
  );
  return NextResponse.json({ note: { id: newNote.id, title: newNote.title, updatedAt: newNote.updatedAt } });
}

export async function DELETE(request: Request) {
  const auth = await getAuthUser();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const db = await getDb();
  const userId = new ObjectId(auth.id);
  const user = await db.collection("users").findOne({ _id: userId });
  const active = isSubscriptionActive(user?.subscription, auth.isAdmin);
  if (!active) return NextResponse.json({ error: "Subscription required" }, { status: 403 });
  const doc = await db.collection("user_notes").findOne({ userId });
  const notes = Array.isArray(doc?.notes) ? doc.notes : [];
  const nextNotes = notes.filter((note: any) => note.id !== id);
  await db.collection("user_notes").updateOne(
    { userId },
    { $set: { notes: nextNotes }, $setOnInsert: { createdAt: new Date() } },
    { upsert: true }
  );
  return NextResponse.json({ ok: true });
}
