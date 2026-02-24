"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import {
  BookOpenText,
  GlobeHemisphereWest,
  Sparkle,
  Theater,
  CheckCircle,
  Plus,
  Trash
} from "@phosphor-icons/react";
import { CompendiumContent, defaultCompendiumContent } from "@/lib/compendium-content";

const MarkdownEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });

const SECTIONS = [
  { id: "grammar", label: "Граматика", icon: BookOpenText },
  { id: "sites", label: "Корисні сайти", icon: GlobeHemisphereWest },
  { id: "facts", label: "Цікаві факти", icon: Sparkle },
  { id: "culture", label: "Культура", icon: Theater }
] as const;

type SectionId = typeof SECTIONS[number]["id"];
type Status = "idle" | "saving" | "saved" | "error";

export default function AdminCompendiumPanel() {
  const [section, setSection] = useState<SectionId>("grammar");
  const [content, setContent] = useState<CompendiumContent>(defaultCompendiumContent);
  const [status, setStatus] = useState<Status>("idle");

  const MarkdownField = ({
    value,
    onChange,
    placeholder,
    height = 140
  }: {
    value: string;
    onChange: (next: string) => void;
    placeholder?: string;
    height?: number;
  }) => (
    <div data-color-mode="light" className="rounded-xl border border-ink/10 bg-paper">
      <MarkdownEditor
        value={value}
        onChange={(next) => onChange(next || "")}
        preview="live"
        height={height}
        textareaProps={{ placeholder }}
      />
    </div>
  );

  useEffect(() => {
    const load = async () => {
      const res = await fetch("/api/admin/content/compendium");
      if (!res.ok) return;
      const data = await res.json();
      if (data?.content) setContent(data.content);
    };
    load();
  }, []);

  const save = async () => {
    setStatus("saving");
    const res = await fetch("/api/admin/content/compendium", {
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

  const updateHero = (
    key: "grammar" | "usefulSites" | "facts" | "culture",
    patch: Partial<CompendiumContent["grammar"]["hero"]>
  ) => {
    setContent((prev) => ({
      ...prev,
      [key]: { ...prev[key], hero: { ...prev[key].hero, ...patch } }
    }));
  };

  const addGrammarSprint = () => {
    const id = `sprint-${Date.now()}`;
    setContent((prev) => ({
      ...prev,
      grammar: {
        ...prev.grammar,
        sprints: [
          ...prev.grammar.sprints,
          { id, titleUk: "Нова тема", titlePl: "Nowy temat", hintUk: "", hintPl: "" }
        ]
      }
    }));
  };

  const updateGrammarSprint = (id: string, patch: Partial<CompendiumContent["grammar"]["sprints"][number]>) => {
    setContent((prev) => ({
      ...prev,
      grammar: {
        ...prev.grammar,
        sprints: prev.grammar.sprints.map((item) => (item.id === id ? { ...item, ...patch } : item))
      }
    }));
  };

  const removeGrammarSprint = (id: string) => {
    setContent((prev) => ({
      ...prev,
      grammar: { ...prev.grammar, sprints: prev.grammar.sprints.filter((item) => item.id !== id) }
    }));
  };

  const addGrammarRule = () => {
    const id = `rule-${Date.now()}`;
    setContent((prev) => ({
      ...prev,
      grammar: {
        ...prev.grammar,
        rules: [
          ...prev.grammar.rules,
          { id, titleUk: "Нове правило", titlePl: "Nowa reguła", bodyUk: "", bodyPl: "" }
        ]
      }
    }));
  };

  const updateGrammarRule = (id: string, patch: Partial<CompendiumContent["grammar"]["rules"][number]>) => {
    setContent((prev) => ({
      ...prev,
      grammar: {
        ...prev.grammar,
        rules: prev.grammar.rules.map((item) => (item.id === id ? { ...item, ...patch } : item))
      }
    }));
  };

  const removeGrammarRule = (id: string) => {
    setContent((prev) => ({
      ...prev,
      grammar: { ...prev.grammar, rules: prev.grammar.rules.filter((item) => item.id !== id) }
    }));
  };

  const addSiteGroup = () => {
    const id = `group-${Date.now()}`;
    setContent((prev) => ({
      ...prev,
      usefulSites: {
        ...prev.usefulSites,
        groups: [
          ...prev.usefulSites.groups,
          { id, titleUk: "Нова група", titlePl: "Nowa grupa", items: [] }
        ]
      }
    }));
  };

  const updateSiteGroup = (id: string, patch: Partial<CompendiumContent["usefulSites"]["groups"][number]>) => {
    setContent((prev) => ({
      ...prev,
      usefulSites: {
        ...prev.usefulSites,
        groups: prev.usefulSites.groups.map((item) => (item.id === id ? { ...item, ...patch } : item))
      }
    }));
  };

  const removeSiteGroup = (id: string) => {
    setContent((prev) => ({
      ...prev,
      usefulSites: {
        ...prev.usefulSites,
        groups: prev.usefulSites.groups.filter((item) => item.id !== id)
      }
    }));
  };

  const addSiteItem = (groupId: string) => {
    const id = `site-${Date.now()}`;
    setContent((prev) => ({
      ...prev,
      usefulSites: {
        ...prev.usefulSites,
        groups: prev.usefulSites.groups.map((group) =>
          group.id === groupId
            ? {
                ...group,
                items: [
                  ...group.items,
                  { id, name: "Новий ресурс", url: "", noteUk: "", notePl: "" }
                ]
              }
            : group
        )
      }
    }));
  };

  const updateSiteItem = (
    groupId: string,
    itemId: string,
    patch: Partial<CompendiumContent["usefulSites"]["groups"][number]["items"][number]>
  ) => {
    setContent((prev) => ({
      ...prev,
      usefulSites: {
        ...prev.usefulSites,
        groups: prev.usefulSites.groups.map((group) =>
          group.id === groupId
            ? {
                ...group,
                items: group.items.map((item) => (item.id === itemId ? { ...item, ...patch } : item))
              }
            : group
        )
      }
    }));
  };

  const removeSiteItem = (groupId: string, itemId: string) => {
    setContent((prev) => ({
      ...prev,
      usefulSites: {
        ...prev.usefulSites,
        groups: prev.usefulSites.groups.map((group) =>
          group.id === groupId
            ? { ...group, items: group.items.filter((item) => item.id !== itemId) }
            : group
        )
      }
    }));
  };

  const addFact = () => {
    const id = `fact-${Date.now()}`;
    setContent((prev) => ({
      ...prev,
      facts: {
        ...prev.facts,
        items: [
          ...prev.facts.items,
          { id, titleUk: "Новий факт", titlePl: "Nowy fakt", bodyUk: "", bodyPl: "" }
        ]
      }
    }));
  };

  const updateFact = (id: string, patch: Partial<CompendiumContent["facts"]["items"][number]>) => {
    setContent((prev) => ({
      ...prev,
      facts: {
        ...prev.facts,
        items: prev.facts.items.map((item) => (item.id === id ? { ...item, ...patch } : item))
      }
    }));
  };

  const removeFact = (id: string) => {
    setContent((prev) => ({
      ...prev,
      facts: { ...prev.facts, items: prev.facts.items.filter((item) => item.id !== id) }
    }));
  };

  const addCulturePulse = () => {
    const id = `pulse-${Date.now()}`;
    setContent((prev) => ({
      ...prev,
      culture: {
        ...prev.culture,
        pulses: [
          ...prev.culture.pulses,
          { id, titleUk: "Новий блок", titlePl: "Nowy blok", bodyUk: "", bodyPl: "" }
        ]
      }
    }));
  };

  const updateCulturePulse = (id: string, patch: Partial<CompendiumContent["culture"]["pulses"][number]>) => {
    setContent((prev) => ({
      ...prev,
      culture: {
        ...prev.culture,
        pulses: prev.culture.pulses.map((item) => (item.id === id ? { ...item, ...patch } : item))
      }
    }));
  };

  const removeCulturePulse = (id: string) => {
    setContent((prev) => ({
      ...prev,
      culture: { ...prev.culture, pulses: prev.culture.pulses.filter((item) => item.id !== id) }
    }));
  };

  return (
    <section className="rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-ink/40">Довідник</p>
          <h2 className="mt-2 text-2xl font-semibold">Compendium</h2>
          <p className="mt-1 text-sm text-ink/60">
            Markdown поля для текстів. Дизайн сторінок підтягує ці структури.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={save}
            className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-xs font-semibold text-paper"
          >
            <CheckCircle size={14} weight="bold" />
            Зберегти
          </button>
          {status === "saved" && <span className="text-xs font-semibold text-moss">Збережено</span>}
          {status === "error" && <span className="text-xs font-semibold text-terracotta">Помилка</span>}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {SECTIONS.map((item) => (
          <button
            key={item.id}
            onClick={() => setSection(item.id)}
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
              section === item.id ? "bg-ink text-paper" : "border border-ink/20 text-ink/60"
            }`}
          >
            <item.icon size={14} weight="bold" />
            {item.label}
          </button>
        ))}
      </div>

      {section === "grammar" && (
        <div className="mt-6 space-y-6">
          <div className="rounded-2xl border border-ink/10 bg-paper/60 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-ink/40">Hero</p>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <input
                value={content.grammar.hero.titleUk}
                onChange={(event) => updateHero("grammar", { titleUk: event.target.value })}
                className="rounded-xl border border-ink/10 bg-paper px-3 py-2 text-sm"
                placeholder="Заголовок (UA)"
              />
              <input
                value={content.grammar.hero.titlePl}
                onChange={(event) => updateHero("grammar", { titlePl: event.target.value })}
                className="rounded-xl border border-ink/10 bg-paper px-3 py-2 text-sm"
                placeholder="Tytuł (PL)"
              />
              <div className="md:col-span-2">
                <MarkdownField
                  value={content.grammar.hero.subtitleUk}
                  onChange={(next) => updateHero("grammar", { subtitleUk: next })}
                  placeholder="Підзаголовок (UA, markdown)"
                  height={120}
                />
              </div>
              <div className="md:col-span-2">
                <MarkdownField
                  value={content.grammar.hero.subtitlePl}
                  onChange={(next) => updateHero("grammar", { subtitlePl: next })}
                  placeholder="Podtytuł (PL, markdown)"
                  height={120}
                />
              </div>
              <div className="md:col-span-2">
                <MarkdownField
                  value={content.grammar.hero.leadUk}
                  onChange={(next) => updateHero("grammar", { leadUk: next })}
                  placeholder="Лід (UA, markdown)"
                  height={160}
                />
              </div>
              <div className="md:col-span-2">
                <MarkdownField
                  value={content.grammar.hero.leadPl}
                  onChange={(next) => updateHero("grammar", { leadPl: next })}
                  placeholder="Lead (PL, markdown)"
                  height={160}
                />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-ink/10 bg-paper/60 p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.3em] text-ink/40">Спринти</p>
              <button
                onClick={addGrammarSprint}
                className="inline-flex items-center gap-2 rounded-full border border-ink/20 bg-paper px-3 py-1 text-xs font-semibold text-ink/70"
              >
                <Plus size={12} weight="bold" />
                Додати
              </button>
            </div>
            <div className="mt-4 space-y-4">
              {content.grammar.sprints.map((item) => (
                <div key={item.id} className="rounded-xl border border-ink/10 bg-paper p-4">
                  <div className="flex justify-between gap-2">
                    <input
                      value={item.titleUk}
                      onChange={(event) => updateGrammarSprint(item.id, { titleUk: event.target.value })}
                      className="flex-1 rounded-lg border border-ink/10 bg-paper px-3 py-2 text-sm"
                      placeholder="Назва (UA)"
                    />
                    <button
                      onClick={() => removeGrammarSprint(item.id)}
                      className="rounded-full border border-ink/10 p-2 text-ink/40 hover:text-terracotta"
                      aria-label="Видалити"
                    >
                      <Trash size={14} />
                    </button>
                  </div>
                  <input
                    value={item.titlePl}
                    onChange={(event) => updateGrammarSprint(item.id, { titlePl: event.target.value })}
                    className="mt-2 w-full rounded-lg border border-ink/10 bg-paper px-3 py-2 text-sm"
                    placeholder="Nazwa (PL)"
                  />
                  <div className="mt-2">
                    <MarkdownField
                      value={item.hintUk}
                      onChange={(next) => updateGrammarSprint(item.id, { hintUk: next })}
                      placeholder="Підказка (UA, markdown)"
                      height={120}
                    />
                  </div>
                  <div className="mt-2">
                    <MarkdownField
                      value={item.hintPl}
                      onChange={(next) => updateGrammarSprint(item.id, { hintPl: next })}
                      placeholder="Wskazówka (PL, markdown)"
                      height={120}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-ink/10 bg-paper/60 p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.3em] text-ink/40">Правила</p>
              <button
                onClick={addGrammarRule}
                className="inline-flex items-center gap-2 rounded-full border border-ink/20 bg-paper px-3 py-1 text-xs font-semibold text-ink/70"
              >
                <Plus size={12} weight="bold" />
                Додати
              </button>
            </div>
            <div className="mt-4 space-y-4">
              {content.grammar.rules.map((item) => (
                <div key={item.id} className="rounded-xl border border-ink/10 bg-paper p-4">
                  <div className="flex justify-between gap-2">
                    <input
                      value={item.titleUk}
                      onChange={(event) => updateGrammarRule(item.id, { titleUk: event.target.value })}
                      className="flex-1 rounded-lg border border-ink/10 bg-paper px-3 py-2 text-sm"
                      placeholder="Назва (UA)"
                    />
                    <button
                      onClick={() => removeGrammarRule(item.id)}
                      className="rounded-full border border-ink/10 p-2 text-ink/40 hover:text-terracotta"
                      aria-label="Видалити"
                    >
                      <Trash size={14} />
                    </button>
                  </div>
                  <input
                    value={item.titlePl}
                    onChange={(event) => updateGrammarRule(item.id, { titlePl: event.target.value })}
                    className="mt-2 w-full rounded-lg border border-ink/10 bg-paper px-3 py-2 text-sm"
                    placeholder="Nazwa (PL)"
                  />
                  <div className="mt-2">
                    <MarkdownField
                      value={item.bodyUk}
                      onChange={(next) => updateGrammarRule(item.id, { bodyUk: next })}
                      placeholder="Текст (UA, markdown)"
                      height={160}
                    />
                  </div>
                  <div className="mt-2">
                    <MarkdownField
                      value={item.bodyPl}
                      onChange={(next) => updateGrammarRule(item.id, { bodyPl: next })}
                      placeholder="Tekst (PL, markdown)"
                      height={160}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {section === "sites" && (
        <div className="mt-6 space-y-6">
          <div className="rounded-2xl border border-ink/10 bg-paper/60 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-ink/40">Hero</p>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <input
                value={content.usefulSites.hero.titleUk}
                onChange={(event) => updateHero("usefulSites", { titleUk: event.target.value })}
                className="rounded-xl border border-ink/10 bg-paper px-3 py-2 text-sm"
                placeholder="Заголовок (UA)"
              />
              <input
                value={content.usefulSites.hero.titlePl}
                onChange={(event) => updateHero("usefulSites", { titlePl: event.target.value })}
                className="rounded-xl border border-ink/10 bg-paper px-3 py-2 text-sm"
                placeholder="Tytuł (PL)"
              />
              <div className="md:col-span-2">
                <MarkdownField
                  value={content.usefulSites.hero.subtitleUk}
                  onChange={(next) => updateHero("usefulSites", { subtitleUk: next })}
                  placeholder="Підзаголовок (UA, markdown)"
                  height={120}
                />
              </div>
              <div className="md:col-span-2">
                <MarkdownField
                  value={content.usefulSites.hero.subtitlePl}
                  onChange={(next) => updateHero("usefulSites", { subtitlePl: next })}
                  placeholder="Podtytuł (PL, markdown)"
                  height={120}
                />
              </div>
              <div className="md:col-span-2">
                <MarkdownField
                  value={content.usefulSites.hero.leadUk}
                  onChange={(next) => updateHero("usefulSites", { leadUk: next })}
                  placeholder="Лід (UA, markdown)"
                  height={160}
                />
              </div>
              <div className="md:col-span-2">
                <MarkdownField
                  value={content.usefulSites.hero.leadPl}
                  onChange={(next) => updateHero("usefulSites", { leadPl: next })}
                  placeholder="Lead (PL, markdown)"
                  height={160}
                />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-ink/10 bg-paper/60 p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.3em] text-ink/40">Групи ресурсів</p>
              <button
                onClick={addSiteGroup}
                className="inline-flex items-center gap-2 rounded-full border border-ink/20 bg-paper px-3 py-1 text-xs font-semibold text-ink/70"
              >
                <Plus size={12} weight="bold" />
                Додати групу
              </button>
            </div>
            <div className="mt-4 space-y-4">
              {content.usefulSites.groups.map((group) => (
                <div key={group.id} className="rounded-xl border border-ink/10 bg-paper p-4">
                  <div className="flex justify-between gap-2">
                    <input
                      value={group.titleUk}
                      onChange={(event) => updateSiteGroup(group.id, { titleUk: event.target.value })}
                      className="flex-1 rounded-lg border border-ink/10 bg-paper px-3 py-2 text-sm"
                      placeholder="Назва (UA)"
                    />
                    <button
                      onClick={() => removeSiteGroup(group.id)}
                      className="rounded-full border border-ink/10 p-2 text-ink/40 hover:text-terracotta"
                      aria-label="Видалити"
                    >
                      <Trash size={14} />
                    </button>
                  </div>
                  <input
                    value={group.titlePl}
                    onChange={(event) => updateSiteGroup(group.id, { titlePl: event.target.value })}
                    className="mt-2 w-full rounded-lg border border-ink/10 bg-paper px-3 py-2 text-sm"
                    placeholder="Nazwa (PL)"
                  />
                  <div className="mt-3 space-y-3">
                    {group.items.map((item) => (
                      <div key={item.id} className="rounded-lg border border-ink/10 bg-paper/80 p-3">
                        <div className="flex justify-between gap-2">
                          <input
                            value={item.name}
                            onChange={(event) => updateSiteItem(group.id, item.id, { name: event.target.value })}
                            className="flex-1 rounded-lg border border-ink/10 bg-paper px-3 py-2 text-sm"
                            placeholder="Назва ресурсу"
                          />
                          <button
                            onClick={() => removeSiteItem(group.id, item.id)}
                            className="rounded-full border border-ink/10 p-2 text-ink/40 hover:text-terracotta"
                            aria-label="Видалити"
                          >
                            <Trash size={14} />
                          </button>
                        </div>
                        <input
                          value={item.url}
                          onChange={(event) => updateSiteItem(group.id, item.id, { url: event.target.value })}
                          className="mt-2 w-full rounded-lg border border-ink/10 bg-paper px-3 py-2 text-sm"
                          placeholder="URL"
                        />
                        <div className="mt-2">
                          <MarkdownField
                            value={item.noteUk}
                            onChange={(next) => updateSiteItem(group.id, item.id, { noteUk: next })}
                            placeholder="Опис (UA, markdown)"
                            height={120}
                          />
                        </div>
                        <div className="mt-2">
                          <MarkdownField
                            value={item.notePl}
                            onChange={(next) => updateSiteItem(group.id, item.id, { notePl: next })}
                            placeholder="Opis (PL, markdown)"
                            height={120}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => addSiteItem(group.id)}
                    className="mt-3 inline-flex items-center gap-2 rounded-full border border-ink/20 bg-paper px-3 py-1 text-xs font-semibold text-ink/70"
                  >
                    <Plus size={12} weight="bold" />
                    Додати ресурс
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-ink/10 bg-paper/60 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-ink/40">Sidebar</p>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <MarkdownField
                value={content.usefulSites.sidebarNoteUk}
                onChange={(next) => setContent((prev) => ({
                  ...prev,
                  usefulSites: { ...prev.usefulSites, sidebarNoteUk: next }
                }))}
                placeholder="Нотатка (UA, markdown)"
                height={120}
              />
              <MarkdownField
                value={content.usefulSites.sidebarNotePl}
                onChange={(next) => setContent((prev) => ({
                  ...prev,
                  usefulSites: { ...prev.usefulSites, sidebarNotePl: next }
                }))}
                placeholder="Notatka (PL, markdown)"
                height={120}
              />
              <MarkdownField
                value={content.usefulSites.sidebarPlanUk}
                onChange={(next) => setContent((prev) => ({
                  ...prev,
                  usefulSites: { ...prev.usefulSites, sidebarPlanUk: next }
                }))}
                placeholder="План (UA, markdown)"
                height={120}
              />
              <MarkdownField
                value={content.usefulSites.sidebarPlanPl}
                onChange={(next) => setContent((prev) => ({
                  ...prev,
                  usefulSites: { ...prev.usefulSites, sidebarPlanPl: next }
                }))}
                placeholder="Plan (PL, markdown)"
                height={120}
              />
            </div>
          </div>
        </div>
      )}

      {section === "facts" && (
        <div className="mt-6 space-y-6">
          <div className="rounded-2xl border border-ink/10 bg-paper/60 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-ink/40">Hero</p>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <input
                value={content.facts.hero.titleUk}
                onChange={(event) => updateHero("facts", { titleUk: event.target.value })}
                className="rounded-xl border border-ink/10 bg-paper px-3 py-2 text-sm"
                placeholder="Заголовок (UA)"
              />
              <input
                value={content.facts.hero.titlePl}
                onChange={(event) => updateHero("facts", { titlePl: event.target.value })}
                className="rounded-xl border border-ink/10 bg-paper px-3 py-2 text-sm"
                placeholder="Tytuł (PL)"
              />
              <div className="md:col-span-2">
                <MarkdownField
                  value={content.facts.hero.subtitleUk}
                  onChange={(next) => updateHero("facts", { subtitleUk: next })}
                  placeholder="Підзаголовок (UA, markdown)"
                  height={120}
                />
              </div>
              <div className="md:col-span-2">
                <MarkdownField
                  value={content.facts.hero.subtitlePl}
                  onChange={(next) => updateHero("facts", { subtitlePl: next })}
                  placeholder="Podtytuł (PL, markdown)"
                  height={120}
                />
              </div>
              <div className="md:col-span-2">
                <MarkdownField
                  value={content.facts.hero.leadUk}
                  onChange={(next) => updateHero("facts", { leadUk: next })}
                  placeholder="Лід (UA, markdown)"
                  height={160}
                />
              </div>
              <div className="md:col-span-2">
                <MarkdownField
                  value={content.facts.hero.leadPl}
                  onChange={(next) => updateHero("facts", { leadPl: next })}
                  placeholder="Lead (PL, markdown)"
                  height={160}
                />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-ink/10 bg-paper/60 p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.3em] text-ink/40">Факти</p>
              <button
                onClick={addFact}
                className="inline-flex items-center gap-2 rounded-full border border-ink/20 bg-paper px-3 py-1 text-xs font-semibold text-ink/70"
              >
                <Plus size={12} weight="bold" />
                Додати
              </button>
            </div>
            <div className="mt-4 space-y-4">
              {content.facts.items.map((item) => (
                <div key={item.id} className="rounded-xl border border-ink/10 bg-paper p-4">
                  <div className="flex justify-between gap-2">
                    <input
                      value={item.titleUk}
                      onChange={(event) => updateFact(item.id, { titleUk: event.target.value })}
                      className="flex-1 rounded-lg border border-ink/10 bg-paper px-3 py-2 text-sm"
                      placeholder="Назва (UA)"
                    />
                    <button
                      onClick={() => removeFact(item.id)}
                      className="rounded-full border border-ink/10 p-2 text-ink/40 hover:text-terracotta"
                      aria-label="Видалити"
                    >
                      <Trash size={14} />
                    </button>
                  </div>
                  <input
                    value={item.titlePl}
                    onChange={(event) => updateFact(item.id, { titlePl: event.target.value })}
                    className="mt-2 w-full rounded-lg border border-ink/10 bg-paper px-3 py-2 text-sm"
                    placeholder="Nazwa (PL)"
                  />
                  <div className="mt-2">
                    <MarkdownField
                      value={item.bodyUk}
                      onChange={(next) => updateFact(item.id, { bodyUk: next })}
                      placeholder="Текст (UA, markdown)"
                      height={160}
                    />
                  </div>
                  <div className="mt-2">
                    <MarkdownField
                      value={item.bodyPl}
                      onChange={(next) => updateFact(item.id, { bodyPl: next })}
                      placeholder="Tekst (PL, markdown)"
                      height={160}
                    />
                  </div>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    <input
                      value={item.sourceLabel || ""}
                      onChange={(event) => updateFact(item.id, { sourceLabel: event.target.value })}
                      className="rounded-lg border border-ink/10 bg-paper px-3 py-2 text-sm"
                      placeholder="Джерело (назва)"
                    />
                    <input
                      value={item.sourceUrl || ""}
                      onChange={(event) => updateFact(item.id, { sourceUrl: event.target.value })}
                      className="rounded-lg border border-ink/10 bg-paper px-3 py-2 text-sm"
                      placeholder="URL джерела"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-ink/10 bg-paper/60 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-ink/40">Sidebar</p>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <MarkdownField
                value={content.facts.sidebarNoteUk}
                onChange={(next) => setContent((prev) => ({
                  ...prev,
                  facts: { ...prev.facts, sidebarNoteUk: next }
                }))}
                placeholder="Нотатка (UA, markdown)"
                height={120}
              />
              <MarkdownField
                value={content.facts.sidebarNotePl}
                onChange={(next) => setContent((prev) => ({
                  ...prev,
                  facts: { ...prev.facts, sidebarNotePl: next }
                }))}
                placeholder="Notatka (PL, markdown)"
                height={120}
              />
              <MarkdownField
                value={content.facts.sidebarPlanUk}
                onChange={(next) => setContent((prev) => ({
                  ...prev,
                  facts: { ...prev.facts, sidebarPlanUk: next }
                }))}
                placeholder="План (UA, markdown)"
                height={120}
              />
              <MarkdownField
                value={content.facts.sidebarPlanPl}
                onChange={(next) => setContent((prev) => ({
                  ...prev,
                  facts: { ...prev.facts, sidebarPlanPl: next }
                }))}
                placeholder="Plan (PL, markdown)"
                height={120}
              />
            </div>
          </div>
        </div>
      )}

      {section === "culture" && (
        <div className="mt-6 space-y-6">
          <div className="rounded-2xl border border-ink/10 bg-paper/60 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-ink/40">Hero</p>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <input
                value={content.culture.hero.titleUk}
                onChange={(event) => updateHero("culture", { titleUk: event.target.value })}
                className="rounded-xl border border-ink/10 bg-paper px-3 py-2 text-sm"
                placeholder="Заголовок (UA)"
              />
              <input
                value={content.culture.hero.titlePl}
                onChange={(event) => updateHero("culture", { titlePl: event.target.value })}
                className="rounded-xl border border-ink/10 bg-paper px-3 py-2 text-sm"
                placeholder="Tytuł (PL)"
              />
              <div className="md:col-span-2">
                <MarkdownField
                  value={content.culture.hero.subtitleUk}
                  onChange={(next) => updateHero("culture", { subtitleUk: next })}
                  placeholder="Підзаголовок (UA, markdown)"
                  height={120}
                />
              </div>
              <div className="md:col-span-2">
                <MarkdownField
                  value={content.culture.hero.subtitlePl}
                  onChange={(next) => updateHero("culture", { subtitlePl: next })}
                  placeholder="Podtytuł (PL, markdown)"
                  height={120}
                />
              </div>
              <div className="md:col-span-2">
                <MarkdownField
                  value={content.culture.hero.leadUk}
                  onChange={(next) => updateHero("culture", { leadUk: next })}
                  placeholder="Лід (UA, markdown)"
                  height={160}
                />
              </div>
              <div className="md:col-span-2">
                <MarkdownField
                  value={content.culture.hero.leadPl}
                  onChange={(next) => updateHero("culture", { leadPl: next })}
                  placeholder="Lead (PL, markdown)"
                  height={160}
                />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-ink/10 bg-paper/60 p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.3em] text-ink/40">Блоки</p>
              <button
                onClick={addCulturePulse}
                className="inline-flex items-center gap-2 rounded-full border border-ink/20 bg-paper px-3 py-1 text-xs font-semibold text-ink/70"
              >
                <Plus size={12} weight="bold" />
                Додати
              </button>
            </div>
            <div className="mt-4 space-y-4">
              {content.culture.pulses.map((item) => (
                <div key={item.id} className="rounded-xl border border-ink/10 bg-paper p-4">
                  <div className="flex justify-between gap-2">
                    <input
                      value={item.titleUk}
                      onChange={(event) => updateCulturePulse(item.id, { titleUk: event.target.value })}
                      className="flex-1 rounded-lg border border-ink/10 bg-paper px-3 py-2 text-sm"
                      placeholder="Назва (UA)"
                    />
                    <button
                      onClick={() => removeCulturePulse(item.id)}
                      className="rounded-full border border-ink/10 p-2 text-ink/40 hover:text-terracotta"
                      aria-label="Видалити"
                    >
                      <Trash size={14} />
                    </button>
                  </div>
                  <input
                    value={item.titlePl}
                    onChange={(event) => updateCulturePulse(item.id, { titlePl: event.target.value })}
                    className="mt-2 w-full rounded-lg border border-ink/10 bg-paper px-3 py-2 text-sm"
                    placeholder="Nazwa (PL)"
                  />
                  <div className="mt-2">
                    <MarkdownField
                      value={item.bodyUk}
                      onChange={(next) => updateCulturePulse(item.id, { bodyUk: next })}
                      placeholder="Текст (UA, markdown)"
                      height={160}
                    />
                  </div>
                  <div className="mt-2">
                    <MarkdownField
                      value={item.bodyPl}
                      onChange={(next) => updateCulturePulse(item.id, { bodyPl: next })}
                      placeholder="Tekst (PL, markdown)"
                      height={160}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-ink/10 bg-paper/60 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-ink/40">Sidebar</p>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <MarkdownField
                value={content.culture.sidebarNoteUk}
                onChange={(next) => setContent((prev) => ({
                  ...prev,
                  culture: { ...prev.culture, sidebarNoteUk: next }
                }))}
                placeholder="Нотатка (UA, markdown)"
                height={120}
              />
              <MarkdownField
                value={content.culture.sidebarNotePl}
                onChange={(next) => setContent((prev) => ({
                  ...prev,
                  culture: { ...prev.culture, sidebarNotePl: next }
                }))}
                placeholder="Notatka (PL, markdown)"
                height={120}
              />
              <MarkdownField
                value={content.culture.sidebarPlanUk}
                onChange={(next) => setContent((prev) => ({
                  ...prev,
                  culture: { ...prev.culture, sidebarPlanUk: next }
                }))}
                placeholder="План (UA, markdown)"
                height={120}
              />
              <MarkdownField
                value={content.culture.sidebarPlanPl}
                onChange={(next) => setContent((prev) => ({
                  ...prev,
                  culture: { ...prev.culture, sidebarPlanPl: next }
                }))}
                placeholder="Plan (PL, markdown)"
                height={120}
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
