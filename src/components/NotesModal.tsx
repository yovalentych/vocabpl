"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocale } from "@/components/LocaleProvider";
import type { PartialBlock } from "@blocknote/core";
import { BlockNoteView } from "@blocknote/mantine";
import { useCreateBlockNote } from "@blocknote/react";
import "@blocknote/mantine/style.css";
import Loader from "@/components/ui/Loader";

function normalizeContent(content: PartialBlock[] | null) {
  if (!Array.isArray(content) || content.length === 0) return undefined;
  const filtered = content.filter((block) => block && typeof block === "object" && "type" in block);
  return filtered.length ? filtered : undefined;
}

function NotesEditor({
  initialContent,
  onReady,
  onChange
}: {
  initialContent: PartialBlock[] | null;
  onReady: (editor: any) => void;
  onChange?: () => void;
}) {
  const safeInitial = useMemo(() => normalizeContent(initialContent), [initialContent]);
  const editor = useCreateBlockNote({ initialContent: safeInitial });
  useEffect(() => {
    onReady(editor);
  }, [editor, onReady]);
  useEffect(() => {
    if (!onChange) return;
    const unsub = editor.onChange(onChange);
    return () => {
      unsub?.();
    };
  }, [editor, onChange]);
  return <BlockNoteView editor={editor} theme="light" className="h-full" />;
}

type NoteMeta = { id: string; title: string; updatedAt?: string };

type NoteData = { id: string; title: string; content: PartialBlock[] } | null;

export default function NotesModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useLocale();
  const [loadingList, setLoadingList] = useState(false);
  const [loadingNote, setLoadingNote] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notes, setNotes] = useState<NoteMeta[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeNote, setActiveNote] = useState<NoteData>(null);
  const [editorRef, setEditorRef] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [zIndex, setZIndex] = useState(60);
  const [mobilePane, setMobilePane] = useState<"list" | "edit">("list");

  const [dirty, setDirty] = useState(false);
  function updateDirty(next?: string) {
    setDirty(true);
    if (typeof next === "string") {
      setActiveNote((prev) => (prev ? { ...prev, title: next } : prev));
    }
  }

  const filteredNotes = notes;

  const createNote = useCallback(async () => {
    const res = await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: t.notes.untitled, content: [] })
    });
    if (!res.ok) return;
    const data = await res.json();
    const note = data.note;
    if (note) {
      setNotes((prev) => [note, ...prev]);
      setActiveId(note.id);
    }
  }, [t.notes.untitled]);

  useEffect(() => {
    if (!open) return;
    let mounted = true;
    async function loadList() {
      setLoadingList(true);
      const params = search.trim() ? `?q=${encodeURIComponent(search.trim())}` : "";
      const res = await fetch(`/api/notes${params}`);
      if (!mounted) return;
      const data = await res.json().catch(() => ({}));
      const list: NoteMeta[] = Array.isArray(data.notes) ? data.notes : [];
      setNotes(list);
      if (!search.trim() && list.length === 0) {
        await createNote();
      } else {
        setActiveId((prev) => (list.find((note) => note.id === prev) ? prev : list[0]?.id || null));
      }
      setLoadingList(false);
    }
    loadList();
    return () => {
      mounted = false;
    };
  }, [open, search, createNote]);

  useEffect(() => {
    if (!open || !activeId) return;
    let mounted = true;
    async function loadNote() {
      setLoadingNote(true);
      const id = activeId;
      if (!id) return;
      const res = await fetch(`/api/notes?id=${encodeURIComponent(id)}`);
      if (!mounted) return;
      const data = await res.json().catch(() => ({}));
      if (data?.note) {
        setActiveNote(data.note);
      } else {
        setActiveNote({ id, title: t.notes.untitled, content: [] });
      }
      setDirty(false);
      setLoadingNote(false);
      setMobilePane("edit");
    }
    loadNote();
    return () => {
      mounted = false;
    };
  }, [open, activeId, t.notes.untitled]);

  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const win = window as typeof window & { __modalZ?: number };
    win.__modalZ = (win.__modalZ || 50) + 1;
    setZIndex(win.__modalZ);
  }, [open]);

  async function save(shouldClose?: boolean) {
    if (!editorRef || !activeNote) return;
    setSaving(true);
    const payload = { id: activeNote.id, title: activeNote.title, content: editorRef.document };
    const res = await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    setSaving(false);
    if (res.ok) {
      setNotes((prev) =>
        prev.map((note) =>
          note.id === activeNote.id ? { ...note, title: activeNote.title, updatedAt: new Date().toISOString() } : note
        )
      );
      setDirty(false);
      if (shouldClose) onClose();
    }
  }

  async function handleClose() {
    if (saving) return;
    if (editorRef && activeNote && dirty) {
      await save(true);
      return;
    }
    onClose();
  }

  async function deleteNote(id: string) {
    await fetch(`/api/notes?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    setNotes((prev) => prev.filter((note) => note.id !== id));
    if (activeId === id) {
      const next = notes.find((note) => note.id !== id);
      setActiveId(next?.id || null);
      setActiveNote(null);
    }
  }

  if (!open) return null;

  const showList = mobilePane === "list";
  const showEditor = mobilePane === "edit";

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-ink/30 px-2 sm:px-4" style={{ zIndex }}>
      <div className="h-[92svh] w-full max-w-6xl overflow-hidden rounded-[18px] border border-ink/10 bg-[#f7f6f3] shadow-soft md:h-[88vh]">
        <div className="flex h-full">
          <aside className={`flex h-full w-full flex-col border-r border-ink/10 bg-[#f5f5f4] md:w-[300px] ${showList ? "flex" : "hidden"} md:flex`}>
            <div className="px-5 py-4">
              <p className="text-[11px] uppercase tracking-[0.3em] text-ink/40">{t.notes.title}</p>
              <p className="mt-1 text-[11px] text-ink/45">{t.notes.subtitle}</p>
            </div>

            <div className="px-5 pb-4">
              <div className="flex items-center gap-2">
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={t.notes.search}
                  className="w-full rounded-full border border-ink/15 bg-white px-3 py-2 text-xs"
                />
                <button
                  onClick={createNote}
                  className="rounded-full bg-ink px-3 py-2 text-[11px] font-semibold text-paper disabled:opacity-50"
                  disabled={loadingList || saving}
                >
                  {t.notes.new}
                </button>
              </div>
              <div className="mt-3 flex items-center justify-between text-[11px] text-ink/40">
                <span>{t.notes.list}</span>
                <span>{notes.length}</span>
              </div>
            </div>

            <div className="flex-1 space-y-2 overflow-y-auto px-4 pb-4">
              {loadingList && !filteredNotes.length ? (
                <div className="rounded-2xl border border-ink/10 bg-paper/60 px-3 py-4 text-xs text-ink/50">
                  <Loader label={t.common.loading} />
                </div>
              ) : null}

              {filteredNotes.map((note) => {
                const active = activeId === note.id;
                return (
                  <button
                    key={note.id}
                    onClick={() => {
                      setActiveId(note.id);
                      setMobilePane("edit");
                    }}
                    className={`w-full rounded-lg px-3 py-2 text-left text-xs transition ${
                      active ? "bg-white shadow-soft" : "hover:bg-white/70"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-ink">{note.title || t.notes.untitled}</p>
                      {active && <span className="h-2 w-2 rounded-full bg-ink/40" />}
                    </div>
                    <p className="mt-1 text-[10px] text-ink/45">
                      {note.updatedAt ? new Date(note.updatedAt).toLocaleDateString() : ""}
                    </p>
                  </button>
                );
              })}

              {!filteredNotes.length && !loadingList && (
                <div className="rounded-2xl border border-ink/10 bg-paper/60 px-3 py-4 text-xs text-ink/50">
                  <p>{t.notes.empty}</p>
                  <button
                    onClick={createNote}
                    className="mt-3 rounded-full border border-ink/20 px-3 py-1 text-[11px] font-semibold text-ink"
                  >
                    {t.notes.new}
                  </button>
                </div>
              )}
            </div>
          </aside>

          <section className={`flex h-full flex-1 flex-col bg-white ${showEditor ? "flex" : "hidden"} md:flex`}>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/10 bg-white px-4 py-3 sm:px-6 sm:py-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setMobilePane("list")}
                  className="rounded-full border border-ink/20 px-3 py-2 text-[11px] font-semibold md:hidden"
                >
                  Назад
                </button>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.3em] text-ink/40">{t.notes.title}</p>
                  <p className="text-[11px] text-ink/45">{t.notes.subtitle}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => save(false)}
                  className="rounded-full border border-ink/20 px-4 py-2 text-xs font-semibold"
                  disabled={saving || !activeNote}
                >
                  {saving ? t.common.loading : t.notes.save}
                </button>
                <button
                  onClick={handleClose}
                  className="rounded-full border border-ink/20 px-4 py-2 text-xs font-semibold"
                >
                  {t.notes.close}
                </button>
              </div>
            </div>

            <div className="flex min-h-0 flex-1 flex-col px-4 py-4 sm:px-10 sm:py-6">
              {loadingNote ? (
                <Loader label={t.common.loading} />
              ) : activeNote ? (
                <div className="flex h-full flex-col gap-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <input
                      value={activeNote.title}
                      onChange={(event) => {
                        const next = event.target.value;
                        setActiveNote((prev) => (prev ? { ...prev, title: next } : prev));
                        updateDirty(next);
                      }}
                      className="w-full rounded-xl border border-ink/15 bg-white px-4 py-2 text-lg font-semibold"
                      placeholder={t.notes.titlePlaceholder}
                    />
                    <button
                      onClick={() => deleteNote(activeNote.id)}
                      className="rounded-full border border-ink/20 px-3 py-1 text-xs font-semibold disabled:opacity-50"
                      disabled={saving}
                    >
                      {t.notes.delete}
                    </button>
                  </div>

                  <div className="min-h-0 flex-1 rounded-2xl border border-ink/10 bg-white p-2">
                    <div className="notes-editor h-full overflow-y-auto">
                      <NotesEditor
                        key={activeNote.id}
                        initialContent={activeNote.content}
                        onReady={setEditorRef}
                        onChange={() => updateDirty()}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-ink/60">{t.notes.empty}</p>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
