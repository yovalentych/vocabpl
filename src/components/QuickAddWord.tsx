"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { useAuthStatus } from "@/components/useAuthStatus";

function parseSelection(text: string) {
  const raw = text.trim();
  if (!raw) return { pl: "", uk: "" };
  const separators = [" - ", " — ", " / ", " → "];
  for (const sep of separators) {
    if (raw.includes(sep)) {
      const [first, second] = raw.split(sep);
      return { pl: first.trim(), uk: second.trim() };
    }
  }
  return { pl: raw, uk: "" };
}

export default function QuickAddWord() {
  const { t } = useLocale();
  const { loading, isAuthenticated } = useAuthStatus();
  const [open, setOpen] = useState(false);
  const [pl, setPl] = useState("");
  const [uk, setUk] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "error" | "done">("idle");
  const [zIndex, setZIndex] = useState(50);

  useEffect(() => {
    if (loading || !isAuthenticated) return;
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key.toLowerCase() === "k") {
        event.preventDefault();
        const selection = window.getSelection()?.toString() || "";
        const parsed = parseSelection(selection);
        setPl(parsed.pl);
        setUk(parsed.uk);
        setStatus("idle");
        setOpen(true);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [loading, isAuthenticated]);

  useEffect(() => {
    if (!open) return;
    const win = window as typeof window & { __modalZ?: number };
    win.__modalZ = (win.__modalZ || 50) + 1;
    setZIndex(win.__modalZ);
  }, [open]);

  useEffect(() => {
    if (loading || !isAuthenticated) return;
    function onOpen() {
      const selection = window.getSelection()?.toString() || "";
      const parsed = parseSelection(selection);
      setPl(parsed.pl);
      setUk(parsed.uk);
      setStatus("idle");
      setOpen(true);
    }
    window.addEventListener("open-quick-add", onOpen);
    return () => window.removeEventListener("open-quick-add", onOpen);
  }, [loading, isAuthenticated]);

  async function save() {
    setStatus("saving");
    const res = await fetch("/api/user/words/custom", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pl, uk })
    });
    if (!res.ok) {
      setStatus("error");
      return;
    }
    setStatus("done");
    window.dispatchEvent(new Event("my-words-updated"));
    setPl("");
    setUk("");
    setTimeout(() => setOpen(false), 400);
  }

  if (loading || !isAuthenticated || !open) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-ink/30 px-4" style={{ zIndex }}>
      <div className="w-full max-w-lg rounded-3xl border border-ink/10 bg-paper p-6 shadow-soft">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold">{t.words.quickAdd}</h3>
          <button
            onClick={() => setOpen(false)}
            className="rounded-full border border-ink/20 px-3 py-1 text-xs font-semibold"
          >
            {t.common.cancel}
          </button>
        </div>
        <p className="mt-2 text-xs text-ink/50">{t.words.hotkeyHint}</p>
        <p className="mt-2 text-xs text-ink/50">{t.words.baseFormHint}</p>
        <div className="mt-4 space-y-4">
          <label className="block text-sm text-ink/70">
            {t.common.polish}
            <input
              value={pl}
              onChange={(event) => setPl(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-ink/20 bg-paper px-4 py-3"
              placeholder="np. robić"
            />
          </label>
          <label className="block text-sm text-ink/70">
            {t.common.ukrainian}
            <input
              value={uk}
              onChange={(event) => setUk(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-ink/20 bg-paper px-4 py-3"
              placeholder="напр. робити"
            />
          </label>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            onClick={save}
            className="rounded-full bg-ink px-5 py-2 text-xs font-semibold text-paper disabled:opacity-60"
            disabled={!pl.trim() || !uk.trim() || status === "saving"}
          >
            {status === "saving" ? t.common.loading : t.words.addWord}
          </button>
          {status === "error" && <span className="text-xs text-terracotta">{t.words.addError}</span>}
          {status === "done" && <span className="text-xs text-moss">{t.words.addSuccess}</span>}
        </div>
      </div>
    </div>
  );
}
