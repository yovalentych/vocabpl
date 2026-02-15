"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/components/LocaleProvider";

type LegalPack = {
  title: string;
  updated: string;
  body: string[];
};

type LegalContent = {
  pl: {
    terms: LegalPack;
    privacy: LegalPack;
    subscription: LegalPack;
    cookies: LegalPack;
  };
  uk: {
    terms: LegalPack;
    privacy: LegalPack;
    subscription: LegalPack;
    cookies: LegalPack;
  };
};

const SECTIONS = ["terms", "privacy", "subscription", "cookies"] as const;
type SectionKey = typeof SECTIONS[number];

export default function AdminLegalPanel() {
  const { t, locale } = useLocale();
  const [content, setContent] = useState<LegalContent | null>(null);
  const [section, setSection] = useState<SectionKey>("terms");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      const res = await fetch("/api/admin/content/legal");
      const data = await res.json().catch(() => ({}));
      if (!mounted) return;
      setContent(data.content || null);
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const current = content ? (locale === "uk" ? content.uk : content.pl) : null;

  const updatePack = (patch: Partial<LegalPack>) => {
    if (!content) return;
    const next = { ...content } as LegalContent;
    const target = locale === "uk" ? next.uk : next.pl;
    target[section] = { ...target[section], ...patch };
    setContent(next);
  };

  const handleSave = async () => {
    if (!content) return;
    setSaving(true);
    setMessage(null);
    const res = await fetch("/api/admin/content/legal", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content })
    });
    setSaving(false);
    setMessage(res.ok ? "Збережено" : "Помилка збереження");
  };

  if (!current) {
    return (
      <div className="rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft">
        <p className="text-sm text-ink/60">Завантаження...</p>
      </div>
    );
  }

  const pack = current[section];

  return (
    <div className="rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Юридичні сторінки</h2>
          <p className="mt-1 text-sm text-ink/60">Редагуй Умови, Політику, Оплату та Cookies.</p>
        </div>
        <button
          onClick={handleSave}
          className="rounded-full bg-ink px-4 py-2 text-xs font-semibold text-paper transition hover:bg-ink/90 disabled:opacity-60"
          disabled={saving}
        >
          {saving ? "Збереження..." : "Зберегти"}
        </button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {SECTIONS.map((key) => (
          <button
            key={key}
            onClick={() => setSection(key)}
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              section === key ? "bg-ink text-paper" : "border border-ink/20 text-ink/60"
            }`}
          >
            {key === "terms"
              ? "Умови"
              : key === "privacy"
              ? "Політика"
              : key === "subscription"
              ? "Оплата"
              : "Cookies"}
          </button>
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[0.6fr_0.4fr]">
        <div className="space-y-3">
          <input
            value={pack.title}
            onChange={(event) => updatePack({ title: event.target.value })}
            className="w-full rounded-2xl border border-ink/20 bg-paper px-4 py-2 text-sm"
            placeholder="Заголовок"
          />
          <input
            value={pack.updated}
            onChange={(event) => updatePack({ updated: event.target.value })}
            className="w-full rounded-2xl border border-ink/20 bg-paper px-4 py-2 text-sm"
            placeholder="Оновлено"
          />
          <textarea
            value={pack.body.join("\n")}
            onChange={(event) => updatePack({ body: event.target.value.split("\n").filter(Boolean) })}
            className="min-h-[220px] w-full rounded-2xl border border-ink/20 bg-paper px-4 py-2 text-sm"
            placeholder="Кожен абзац з нового рядка"
          />
        </div>
        <div className="rounded-2xl border border-ink/10 bg-paper/60 p-4 text-xs text-ink/60">
          <p className="font-semibold text-ink/70">Порада</p>
          <p className="mt-2">
            Кожен рядок = окремий абзац. Текст зберігається в базі даних і
            відображається на відповідній сторінці.
          </p>
          {message && (
            <p className="mt-3 rounded-xl border border-ink/10 bg-paper px-3 py-2 text-[11px] text-ink/70">
              {message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
