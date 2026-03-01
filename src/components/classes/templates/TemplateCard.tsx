"use client";

import { useState } from "react";
import {
  DotsThree,
  GraduationCap,
  Clipboard,
  BookOpen,
  Article,
  PencilSimple,
  TrashSimple,
  Copy,
  Tag,
  TrendUp
} from "@phosphor-icons/react";
import EditTemplateModal from "./EditTemplateModal";

type Template = {
  _id: string;
  name: string;
  description?: string;
  tags?: string[];
  type: string;
  exerciseType?: string;
  usedCount: number;
  lastUsedAt?: string;
  createdAt: string;
};

type TemplateCardProps = {
  template: Template;
  locale: "uk" | "pl";
  onUpdate: () => void;
};

export default function TemplateCard({ template, locale, onUpdate }: TemplateCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const t = locale === "uk" ? {
    edit: "Редагувати",
    delete: "Видалити",
    duplicate: "Дублювати",
    used: "Використано",
    times: "раз(и)",
    exercise: "Вправа",
    test: "Тест",
    reading: "Читання",
    custom: "Власне",
    confirmDelete: "Видалити цей шаблон?",
    sentences: "Речення",
    cloze: "Пропуски",
    match: "Відповідності",
    translate: "Переклад",
    paraphrase: "Перефразування",
    dialogue: "Діалог",
    describe: "Опис",
    story: "Історія"
  } : {
    edit: "Edytuj",
    delete: "Usuń",
    duplicate: "Duplikuj",
    used: "Użyto",
    times: "raz(y)",
    exercise: "Ćwiczenie",
    test: "Test",
    reading: "Czytanie",
    custom: "Własne",
    confirmDelete: "Usunąć ten szablon?",
    sentences: "Zdania",
    cloze: "Luki",
    match: "Dopasowania",
    translate: "Tłumaczenie",
    paraphrase: "Parafrazowanie",
    dialogue: "Dialog",
    describe: "Opis",
    story: "Historia"
  };

  const typeLabel = {
    exercise: t.exercise,
    test: t.test,
    reading: t.reading,
    custom: t.custom
  }[template.type] || template.type;

  const exerciseTypeLabel = template.exerciseType ? {
    sentences: t.sentences,
    cloze: t.cloze,
    match: t.match,
    translate: t.translate,
    paraphrase: t.paraphrase,
    dialogue: t.dialogue,
    describe: t.describe,
    story: t.story
  }[template.exerciseType] : null;

  const typeIcon = () => {
    switch (template.type) {
      case "exercise":
        return <GraduationCap size={20} weight="fill" className="text-moss" />;
      case "test":
        return <Clipboard size={20} weight="fill" className="text-gold" />;
      case "reading":
        return <BookOpen size={20} weight="fill" className="text-ink" />;
      case "custom":
        return <Article size={20} weight="fill" className="text-terracotta" />;
      default:
        return null;
    }
  };

  async function handleDelete() {
    if (!confirm(t.confirmDelete)) return;

    try {
      setDeleting(true);
      const res = await fetch(`/api/classes/templates/${template._id}`, {
        method: "DELETE"
      });

      if (!res.ok) {
        throw new Error("Failed to delete");
      }

      onUpdate();
    } catch (error) {
      console.error("Error deleting template:", error);
      alert("Failed to delete template");
    } finally {
      setDeleting(false);
      setShowMenu(false);
    }
  }

  async function handleDuplicate() {
    try {
      const res = await fetch(`/api/classes/templates/${template._id}`);
      if (!res.ok) throw new Error("Failed to fetch template");

      const { template: originalTemplate } = await res.json();

      const duplicateRes = await fetch("/api/classes/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...originalTemplate,
          name: `${originalTemplate.name} (copy)`,
          _id: undefined,
          teacherId: undefined,
          usedCount: undefined,
          lastUsedAt: undefined,
          createdAt: undefined,
          updatedAt: undefined
        })
      });

      if (!duplicateRes.ok) throw new Error("Failed to duplicate");

      onUpdate();
      setShowMenu(false);
    } catch (error) {
      console.error("Error duplicating template:", error);
      alert("Failed to duplicate template");
    }
  }

  return (
    <>
      <div className="group relative rounded-2xl border border-ink/10 bg-paper p-5 hover:border-moss/30 hover:shadow-md transition-all">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            {typeIcon()}
            <span className="text-xs font-semibold text-ink/60 uppercase tracking-wide">
              {typeLabel}
              {exerciseTypeLabel && ` · ${exerciseTypeLabel}`}
            </span>
          </div>

          {/* Menu */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="rounded-lg p-1.5 text-ink/40 hover:bg-ink/5 hover:text-ink transition-colors"
            >
              <DotsThree size={20} weight="bold" />
            </button>

            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 top-8 z-20 w-48 rounded-xl border border-ink/10 bg-paper shadow-lg overflow-hidden">
                  <button
                    onClick={() => {
                      setShowEditModal(true);
                      setShowMenu(false);
                    }}
                    className="flex w-full items-center gap-3 px-4 py-3 text-sm text-ink hover:bg-ink/5 transition-colors"
                  >
                    <PencilSimple size={18} />
                    {t.edit}
                  </button>
                  <button
                    onClick={handleDuplicate}
                    className="flex w-full items-center gap-3 px-4 py-3 text-sm text-ink hover:bg-ink/5 transition-colors"
                  >
                    <Copy size={18} />
                    {t.duplicate}
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="flex w-full items-center gap-3 px-4 py-3 text-sm text-terracotta hover:bg-terracotta/5 transition-colors disabled:opacity-50"
                  >
                    <TrashSimple size={18} weight="fill" />
                    {t.delete}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Name */}
        <h3 className="font-bold text-ink text-lg mb-2 line-clamp-2">
          {template.name}
        </h3>

        {/* Description */}
        {template.description && (
          <p className="text-sm text-ink/60 mb-3 line-clamp-2">
            {template.description}
          </p>
        )}

        {/* Tags */}
        {template.tags && template.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {template.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 rounded-full bg-ink/5 px-2.5 py-1 text-xs text-ink/70"
              >
                <Tag size={12} weight="fill" />
                {tag}
              </span>
            ))}
            {template.tags.length > 3 && (
              <span className="inline-flex items-center rounded-full bg-ink/5 px-2.5 py-1 text-xs text-ink/50">
                +{template.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center gap-4 text-xs text-ink/50 pt-3 border-t border-ink/5">
          <div className="flex items-center gap-1.5">
            <TrendUp size={14} weight="bold" />
            <span>
              {t.used}: {template.usedCount} {t.times}
            </span>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <EditTemplateModal
          templateId={template._id}
          locale={locale}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => {
            setShowEditModal(false);
            onUpdate();
          }}
        />
      )}
    </>
  );
}
