"use client";

import { useEffect, useState } from "react";
import { defaultContactContent, ContactContent } from "@/lib/contact-content";
import { useLocale } from "@/components/LocaleProvider";

export default function AdminContactPanel() {
  const { locale } = useLocale();
  const [content, setContent] = useState<ContactContent>(defaultContactContent);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      const res = await fetch("/api/admin/content/contact");
      const data = await res.json().catch(() => ({}));
      if (!mounted) return;
      setContent(data.content || defaultContactContent);
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const update = (patch: Partial<ContactContent>) => {
    setContent((prev) => ({ ...prev, ...patch }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    const res = await fetch("/api/admin/content/contact", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content })
    });
    setSaving(false);
    setMessage(res.ok ? "Збережено" : "Помилка збереження");
  };

  return (
    <div className="rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Контакти</h2>
          <p className="mt-1 text-sm text-ink/60">Сторінка з контактами та поясненням.</p>
        </div>
        <button
          onClick={handleSave}
          className="rounded-full bg-ink px-4 py-2 text-xs font-semibold text-paper transition hover:bg-ink/90 disabled:opacity-60"
          disabled={saving}
        >
          {saving ? "Збереження..." : "Зберегти"}
        </button>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="space-y-3">
          <input
            value={locale === "uk" ? content.titleUk : content.titlePl}
            onChange={(event) =>
              update(locale === "uk" ? { titleUk: event.target.value } : { titlePl: event.target.value })
            }
            className="w-full rounded-2xl border border-ink/20 bg-paper px-4 py-2 text-sm"
            placeholder={locale === "uk" ? "Заголовок" : "Tytuł"}
          />
          <input
            value={locale === "uk" ? content.subtitleUk : content.subtitlePl}
            onChange={(event) =>
              update(locale === "uk" ? { subtitleUk: event.target.value } : { subtitlePl: event.target.value })
            }
            className="w-full rounded-2xl border border-ink/20 bg-paper px-4 py-2 text-sm"
            placeholder={locale === "uk" ? "Підзаголовок" : "Podtytuł"}
          />
          <textarea
            value={locale === "uk" ? content.leadUk : content.leadPl}
            onChange={(event) =>
              update(locale === "uk" ? { leadUk: event.target.value } : { leadPl: event.target.value })
            }
            className="min-h-[140px] w-full rounded-2xl border border-ink/20 bg-paper px-4 py-2 text-sm"
            placeholder={locale === "uk" ? "Опис" : "Opis"}
          />
          <textarea
            value={locale === "uk" ? content.noteUk || "" : content.notePl || ""}
            onChange={(event) =>
              update(locale === "uk" ? { noteUk: event.target.value } : { notePl: event.target.value })
            }
            className="min-h-[100px] w-full rounded-2xl border border-ink/20 bg-paper px-4 py-2 text-sm"
            placeholder={locale === "uk" ? "Нотатка" : "Notatka"}
          />
        </div>
        <div className="space-y-3">
          <input
            value={content.email}
            onChange={(event) => update({ email: event.target.value })}
            className="w-full rounded-2xl border border-ink/20 bg-paper px-4 py-2 text-sm"
            placeholder="Email"
          />
          <input
            value={content.phone || ""}
            onChange={(event) => update({ phone: event.target.value })}
            className="w-full rounded-2xl border border-ink/20 bg-paper px-4 py-2 text-sm"
            placeholder="Телефон (необовʼязково)"
          />
          <input
            value={content.telegram || ""}
            onChange={(event) => update({ telegram: event.target.value })}
            className="w-full rounded-2xl border border-ink/20 bg-paper px-4 py-2 text-sm"
            placeholder="Telegram (необовʼязково)"
          />
          {message && (
            <p className="rounded-2xl border border-ink/10 bg-paper/60 px-4 py-2 text-xs text-ink/70">
              {message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
