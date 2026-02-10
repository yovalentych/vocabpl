"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocale } from "@/components/LocaleProvider";

type ImportKind =
  | "verbs"
  | "adverbs"
  | "adjectives"
  | "slang"
  | "others"
  | "soft_swears"
  | "clean_emotions"
  | "abbreviations"
  | "tests";

type ImportState = {
  status: "idle" | "loading" | "success" | "error";
  message: string;
};

export default function AdminImportPanel() {
  const { t } = useLocale();
  const [kind, setKind] = useState<ImportKind>("verbs");
  const [jsonText, setJsonText] = useState("");
  const [meta, setMeta] = useState<{ lastId: string; nextId: string; type: string } | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [state, setState] = useState<ImportState>({ status: "idle", message: "" });

  const loadMeta = useCallback(async (selectedKind: ImportKind) => {
    if (selectedKind === "tests") {
      setMeta(null);
      return;
    }
    const res = await fetch(`/api/admin/words/meta?kind=${selectedKind}`);
    if (!res.ok) {
      setMeta(null);
      return;
    }
    const data = await res.json();
    setMeta(data);
  }, []);

  useEffect(() => {
    loadMeta(kind);
  }, [kind, loadMeta]);

  function buildTemplate() {
    if (kind === "tests") {
      return JSON.stringify(
        {
          version: "1.0.0",
          title: "Test title",
          source: "source",
          items: [
            {
              id: "t1_q001",
              number: 1,
              type: "mcq",
              prompt: "Question?",
              options: [
                { id: "a", text: "Option A" },
                { id: "b", text: "Option B" }
              ],
              answer: "a",
              answerType: "mcq"
            }
          ]
        },
        null,
        2
      );
    }
    return JSON.stringify(
      {
        version: "1.0.0",
        source: "",
        items: [
          {
            id: meta?.nextId || "",
            pl: "",
            uk: "",
            pos: meta?.type || ""
          }
        ]
      },
      null,
      2
    );
  }

  async function handleImport() {
    if (!jsonText.trim()) {
      setState({ status: "error", message: t.admin.importErrors.missingJson });
      return;
    }

    setState({ status: "loading", message: "" });
    let payload: unknown;
    try {
      payload = JSON.parse(jsonText);
    } catch {
      setState({ status: "error", message: t.admin.importErrors.invalidJson });
      return;
    }

    const res = await fetch("/api/admin/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, fileName: `${kind}.json`, payload })
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const duplicateMessage = Array.isArray(data.duplicates)
        ? `${t.admin.importErrors.duplicates}: ${data.duplicates.join(", ")}`
        : null;
      setState({
        status: "error",
        message: duplicateMessage || data.error || t.admin.importErrors.server
      });
      return;
    }

    setState({
      status: "success",
      message: t.admin.importSuccess
        .replace("{total}", `${data.total || 0}`)
        .replace("{inserted}", `${data.inserted || 0}`)
        .replace("{updated}", `${data.updated || 0}`)
    });
  }

  return (
    <div className="rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft">
      <h2 className="text-2xl font-semibold">{t.admin.importTitle}</h2>
      <p className="mt-2 text-sm text-ink/60">{t.admin.importSubtitle}</p>

      <div className="mt-6 space-y-4 text-sm text-ink/70">
        <label className="flex flex-col gap-2">
          <span className="text-xs uppercase tracking-[0.2em] text-ink/40">{t.admin.importTypeLabel}</span>
          <select
            className="rounded-2xl border border-ink/10 bg-paper/60 px-3 py-2 text-sm"
            value={kind}
            onChange={async (event) => {
              const nextKind = event.target.value as ImportKind;
              setKind(nextKind);
            }}
          >
            <option value="verbs">{t.deck.verbs}</option>
            <option value="adverbs">{t.deck.adverbs}</option>
            <option value="adjectives">{t.deck.adjectives}</option>
            <option value="slang">{t.deck.slang}</option>
            <option value="others">{t.deck.others}</option>
            <option value="soft_swears">{t.deck.softSwears}</option>
            <option value="clean_emotions">{t.deck.cleanEmotions}</option>
            <option value="abbreviations">{t.deck.abbreviations}</option>
            <option value="tests">{t.home.tests}</option>
          </select>
        </label>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={async () => {
              await loadMeta(kind);
              setJsonText(buildTemplate());
              setEditorOpen(true);
            }}
            className="rounded-full border border-ink/20 px-4 py-2 text-xs font-semibold text-ink"
          >
            {t.admin.openJsonEditor}
          </button>
          {meta && (
            <span className="text-xs text-ink/50">
              {t.admin.lastId}: {meta.lastId || "-"} · {t.admin.nextId}: {meta.nextId || "-"}
            </span>
          )}
        </div>

        <div className="rounded-2xl border border-ink/10 bg-paper/60 px-4 py-3 text-xs text-ink/60">
          {t.admin.importHint}
        </div>

        <button
          type="button"
          onClick={handleImport}
          className="inline-flex items-center justify-center rounded-full bg-ink px-5 py-2 text-xs uppercase tracking-[0.2em] text-paper transition hover:opacity-90"
        >
          {state.status === "loading" ? t.common.loading : t.admin.importAction}
        </button>

        {state.status !== "idle" && (
          <div
            className={`rounded-2xl border px-4 py-3 text-xs ${
              state.status === "success"
                ? "border-emerald-400/40 bg-emerald-50 text-emerald-900"
                : state.status === "error"
                  ? "border-rose-400/40 bg-rose-50 text-rose-900"
                  : "border-ink/10 bg-paper/60 text-ink/70"
            }`}
          >
            {state.message}
          </div>
        )}
      </div>

      {editorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 px-4">
          <div className="w-full max-w-3xl rounded-3xl border border-ink/10 bg-paper p-6 shadow-soft">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold">{t.admin.jsonEditorTitle}</h3>
              <button
                onClick={() => setEditorOpen(false)}
                className="rounded-full border border-ink/20 px-3 py-1 text-xs font-semibold"
              >
                {t.admin.close}
              </button>
            </div>
            <p className="mt-2 text-xs text-ink/50">{t.admin.jsonEditorHint}</p>
            <textarea
              value={jsonText}
              onChange={(event) => setJsonText(event.target.value)}
              className="mt-4 h-[320px] w-full rounded-2xl border border-ink/20 bg-paper px-4 py-3 font-mono text-[12px] text-ink"
            />
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                onClick={handleImport}
                className="rounded-full bg-ink px-5 py-2 text-xs font-semibold text-paper"
              >
                {state.status === "loading" ? t.common.loading : t.admin.importAction}
              </button>
              <button
                onClick={() => setEditorOpen(false)}
                className="rounded-full border border-ink/20 px-4 py-2 text-xs font-semibold"
              >
                {t.common.cancel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
