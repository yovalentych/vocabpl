"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { BookBookmark, Plus, Trash } from "@phosphor-icons/react/dist/ssr";

type WorkbookItem = {
  _id: string;
  type: string;
  title?: string;
  prompt: string;
  createdAt?: string;
};

export default function AdminWorkbookContentPanel() {
  const { t } = useLocale();
  const [items, setItems] = useState<WorkbookItem[]>([]);
  const [activeType, setActiveType] = useState<string>("sentences");
  const [title, setTitle] = useState("");
  const [prompt, setPrompt] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "error" | "saved">("idle");

  const types = useMemo(
    () => [
      { id: "sentences", label: t.workbook.exercises.sentences.title },
      { id: "dialogue", label: t.workbook.exercises.dialogue.title },
      { id: "rewrite", label: t.workbook.exercises.rewrite.title },
      { id: "story", label: t.workbook.exercises.story.title },
      { id: "cloze", label: t.workbook.exercises.cloze.title },
      { id: "match", label: t.workbook.exercises.match.title },
      { id: "translate", label: t.workbook.exercises.translate.title }
    ],
    [t]
  );

  useEffect(() => {
    let mounted = true;
    async function load() {
      const res = await fetch("/api/admin/workbook-content");
      if (!res.ok) return;
      const data = await res.json().catch(() => ({}));
      if (!mounted) return;
      setItems(data.items || []);
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  async function addItem() {
    if (!prompt.trim()) {
      setStatus("error");
      return;
    }
    setStatus("saving");
    const res = await fetch("/api/admin/workbook-content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: activeType, title, prompt })
    });
    if (!res.ok) {
      setStatus("error");
      return;
    }
    const data = await res.json().catch(() => ({}));
    setItems((prev) => [data.item, ...prev]);
    setTitle("");
    setPrompt("");
    setStatus("saved");
  }

  async function removeItem(id: string) {
    await fetch(`/api/admin/workbook-content?id=${id}`, { method: "DELETE" });
    setItems((prev) => prev.filter((item) => item._id !== id));
  }

  const filtered = items.filter((item) => item.type === activeType);

  return (
    <div className="rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookBookmark size={24} weight="bold" className="text-terracotta" />
          <div>
            <h2 className="text-2xl font-semibold">{t.admin.workbookContentTitle}</h2>
            <p className="mt-1 text-sm text-ink/60">{t.admin.workbookContentSubtitle}</p>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {types.map((type) => (
          <button
            key={type.id}
            onClick={() => setActiveType(type.id)}
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              activeType === type.id ? "bg-ink text-paper" : "border border-ink/20 text-ink"
            }`}
          >
            {type.label}
          </button>
        ))}
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-[1fr_1fr_auto]">
        <label className="text-sm text-ink/70">
          {t.admin.workbookContentTitleLabel}
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-ink/20 bg-paper px-4 py-2 text-sm"
            placeholder={t.admin.workbookContentTitlePlaceholder}
          />
        </label>
        <label className="text-sm text-ink/70">
          {t.admin.workbookContentPromptLabel}
          <input
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-ink/20 bg-paper px-4 py-2 text-sm"
            placeholder={t.admin.workbookContentPromptPlaceholder}
          />
        </label>
        <div className="flex items-end">
          <button
            onClick={addItem}
            className="flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-xs font-semibold text-paper transition hover:bg-ink/90"
          >
            <Plus size={14} weight="bold" />
            {t.admin.workbookContentAdd}
          </button>
        </div>
      </div>

      {status === "error" && <p className="mt-2 text-xs text-terracotta">{t.admin.workbookContentError}</p>}
      {status === "saved" && <p className="mt-2 text-xs text-moss">{t.admin.workbookContentSaved}</p>}

      <div className="mt-6 space-y-3">
        {filtered.length === 0 ? (
          <p className="text-sm text-ink/60">{t.admin.workbookContentEmpty}</p>
        ) : (
          filtered.map((item) => (
            <div key={item._id} className="rounded-2xl border border-ink/10 bg-paper/60 p-4 text-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">{item.title || t.admin.workbookContentUntitled}</p>
                  <p className="mt-1 text-ink/60">{item.prompt}</p>
                </div>
                <button
                  onClick={() => removeItem(item._id)}
                  className="flex items-center gap-1 rounded-full border border-ink/20 px-3 py-1 text-xs transition hover:border-terracotta hover:bg-terracotta/5 hover:text-terracotta"
                >
                  <Trash size={12} weight="bold" />
                  {t.common.delete}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
