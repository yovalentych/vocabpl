"use client";

import { useEffect, useState } from "react";
import { AboutContent, AboutSection, defaultAboutContent } from "@/lib/about-content";
import { CheckCircle, Plus, Trash, Eye, EyeSlash } from "@phosphor-icons/react";

type Status = "idle" | "saving" | "saved" | "error";

export default function AdminAboutPanel() {
  const [content, setContent] = useState<AboutContent>(defaultAboutContent);
  const [status, setStatus] = useState<Status>("idle");

  useEffect(() => {
    const load = async () => {
      const res = await fetch("/api/admin/content/about");
      if (!res.ok) return;
      const data = await res.json();
      if (data?.content) setContent(data.content);
    };
    load();
  }, []);

  const updateSection = (id: string, patch: Partial<AboutSection>) => {
    setContent((prev) => ({
      ...prev,
      sections: prev.sections.map((section) =>
        section.id === id ? { ...section, ...patch } : section
      )
    }));
  };

  const addSection = () => {
    const id = `section-${Date.now()}`;
    setContent((prev) => ({
      ...prev,
      sections: [
        ...prev.sections,
        {
          id,
          titleUk: "Нова секція",
          titlePl: "Nowa sekcja",
          bodyUk: "",
          bodyPl: "",
          enabled: true,
          accent: "ink"
        }
      ]
    }));
  };

  const removeSection = (id: string) => {
    setContent((prev) => ({
      ...prev,
      sections: prev.sections.filter((section) => section.id !== id)
    }));
  };

  const save = async () => {
    setStatus("saving");
    const res = await fetch("/api/admin/content/about", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content })
    });
    if (res.ok) {
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 1500);
    } else {
      setStatus("error");
    }
  };

  return (
    <section className="rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-ink/40">Контент</p>
          <h2 className="mt-2 text-2xl font-semibold">Сторінка “Про PVS”</h2>
          <p className="mt-1 text-sm text-ink/60">Редагуй текст і керуй видимістю блоків.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={addSection}
            className="inline-flex items-center gap-2 rounded-full border border-ink/20 bg-paper px-4 py-2 text-xs font-semibold text-ink hover:bg-ink/5"
          >
            <Plus size={14} weight="bold" />
            Додати блок
          </button>
          <button
            onClick={save}
            className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-xs font-semibold text-paper"
          >
            <CheckCircle size={14} weight="bold" />
            Зберегти
          </button>
          {status === "saved" && (
            <span className="text-xs font-semibold text-moss">Збережено</span>
          )}
          {status === "error" && (
            <span className="text-xs font-semibold text-terracotta">Помилка</span>
          )}
        </div>
      </div>

      <div className="mt-6 grid gap-4">
        <div className="rounded-2xl border border-ink/10 bg-paper/60 p-4">
          <p className="text-xs uppercase tracking-[0.3em] text-ink/40">Hero</p>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <input
              value={content.hero.titleUk}
              onChange={(event) =>
                setContent((prev) => ({
                  ...prev,
                  hero: { ...prev.hero, titleUk: event.target.value }
                }))
              }
              className="rounded-xl border border-ink/10 bg-paper px-3 py-2 text-sm"
              placeholder="Заголовок (UA)"
            />
            <input
              value={content.hero.titlePl}
              onChange={(event) =>
                setContent((prev) => ({
                  ...prev,
                  hero: { ...prev.hero, titlePl: event.target.value }
                }))
              }
              className="rounded-xl border border-ink/10 bg-paper px-3 py-2 text-sm"
              placeholder="Tytuł (PL)"
            />
            <textarea
              value={content.hero.subtitleUk}
              onChange={(event) =>
                setContent((prev) => ({
                  ...prev,
                  hero: { ...prev.hero, subtitleUk: event.target.value }
                }))
              }
              className="rounded-xl border border-ink/10 bg-paper px-3 py-2 text-sm md:col-span-2"
              placeholder="Підзаголовок (UA)"
              rows={2}
            />
            <textarea
              value={content.hero.subtitlePl}
              onChange={(event) =>
                setContent((prev) => ({
                  ...prev,
                  hero: { ...prev.hero, subtitlePl: event.target.value }
                }))
              }
              className="rounded-xl border border-ink/10 bg-paper px-3 py-2 text-sm md:col-span-2"
              placeholder="Podtytuł (PL)"
              rows={2}
            />
            <textarea
              value={content.hero.leadUk}
              onChange={(event) =>
                setContent((prev) => ({
                  ...prev,
                  hero: { ...prev.hero, leadUk: event.target.value }
                }))
              }
              className="rounded-xl border border-ink/10 bg-paper px-3 py-2 text-sm md:col-span-2"
              placeholder="Лід (UA)"
              rows={3}
            />
            <textarea
              value={content.hero.leadPl}
              onChange={(event) =>
                setContent((prev) => ({
                  ...prev,
                  hero: { ...prev.hero, leadPl: event.target.value }
                }))
              }
              className="rounded-xl border border-ink/10 bg-paper px-3 py-2 text-sm md:col-span-2"
              placeholder="Lead (PL)"
              rows={3}
            />
            <textarea
              value={content.hero.noteUk}
              onChange={(event) =>
                setContent((prev) => ({
                  ...prev,
                  hero: { ...prev.hero, noteUk: event.target.value }
                }))
              }
              className="rounded-xl border border-ink/10 bg-paper px-3 py-2 text-sm"
              placeholder="Нотатка (UA)"
              rows={2}
            />
            <textarea
              value={content.hero.notePl}
              onChange={(event) =>
                setContent((prev) => ({
                  ...prev,
                  hero: { ...prev.hero, notePl: event.target.value }
                }))
              }
              className="rounded-xl border border-ink/10 bg-paper px-3 py-2 text-sm"
              placeholder="Notatka (PL)"
              rows={2}
            />
          </div>
        </div>

        {content.sections.map((section) => (
          <div
            key={section.id}
            className="rounded-2xl border border-ink/10 bg-paper/60 p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <input
                value={section.titleUk}
                onChange={(event) => updateSection(section.id, { titleUk: event.target.value })}
                className="flex-1 rounded-xl border border-ink/10 bg-paper px-3 py-2 text-sm"
                placeholder="Заголовок (UA)"
              />
              <input
                value={section.titlePl}
                onChange={(event) => updateSection(section.id, { titlePl: event.target.value })}
                className="flex-1 rounded-xl border border-ink/10 bg-paper px-3 py-2 text-sm"
                placeholder="Tytuł (PL)"
              />
              <button
                onClick={() => updateSection(section.id, { enabled: !section.enabled })}
                className="inline-flex items-center gap-1 rounded-full border border-ink/20 px-3 py-1 text-xs"
              >
                {section.enabled ? <Eye size={12} /> : <EyeSlash size={12} />}
                {section.enabled ? "Показати" : "Приховано"}
              </button>
              <button
                onClick={() => removeSection(section.id)}
                className="inline-flex items-center gap-1 rounded-full border border-terracotta/30 px-3 py-1 text-xs text-terracotta"
              >
                <Trash size={12} />
                Видалити
              </button>
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <textarea
                value={section.bodyUk}
                onChange={(event) => updateSection(section.id, { bodyUk: event.target.value })}
                className="rounded-xl border border-ink/10 bg-paper px-3 py-2 text-sm"
                placeholder="Текст (UA)"
                rows={4}
              />
              <textarea
                value={section.bodyPl}
                onChange={(event) => updateSection(section.id, { bodyPl: event.target.value })}
                className="rounded-xl border border-ink/10 bg-paper px-3 py-2 text-sm"
                placeholder="Tekst (PL)"
                rows={4}
              />
            </div>
          </div>
        ))}

        <div className="rounded-2xl border border-ink/10 bg-paper/60 p-4">
          <p className="text-xs uppercase tracking-[0.3em] text-ink/40">CTA</p>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <input
              value={content.cta.titleUk}
              onChange={(event) =>
                setContent((prev) => ({
                  ...prev,
                  cta: { ...prev.cta, titleUk: event.target.value }
                }))
              }
              className="rounded-xl border border-ink/10 bg-paper px-3 py-2 text-sm"
              placeholder="Заголовок (UA)"
            />
            <input
              value={content.cta.titlePl}
              onChange={(event) =>
                setContent((prev) => ({
                  ...prev,
                  cta: { ...prev.cta, titlePl: event.target.value }
                }))
              }
              className="rounded-xl border border-ink/10 bg-paper px-3 py-2 text-sm"
              placeholder="Tytuł (PL)"
            />
            <textarea
              value={content.cta.bodyUk}
              onChange={(event) =>
                setContent((prev) => ({
                  ...prev,
                  cta: { ...prev.cta, bodyUk: event.target.value }
                }))
              }
              className="rounded-xl border border-ink/10 bg-paper px-3 py-2 text-sm md:col-span-2"
              placeholder="Текст (UA)"
              rows={3}
            />
            <textarea
              value={content.cta.bodyPl}
              onChange={(event) =>
                setContent((prev) => ({
                  ...prev,
                  cta: { ...prev.cta, bodyPl: event.target.value }
                }))
              }
              className="rounded-xl border border-ink/10 bg-paper px-3 py-2 text-sm md:col-span-2"
              placeholder="Tekst (PL)"
              rows={3}
            />
            <input
              value={content.cta.email}
              onChange={(event) =>
                setContent((prev) => ({
                  ...prev,
                  cta: { ...prev.cta, email: event.target.value }
                }))
              }
              className="rounded-xl border border-ink/10 bg-paper px-3 py-2 text-sm"
              placeholder="Email"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
