"use client";

import { useState } from "react";
import { X, Check, Tag as TagIcon, Sparkle } from "@phosphor-icons/react";
import Loader from "@/components/ui/Loader";

type SaveAsTemplateModalProps = {
  assignmentTitle: string;
  onSave: (name: string, description: string, tags: string[]) => Promise<void>;
  onSkip: () => void;
};

export default function SaveAsTemplateModal({
  assignmentTitle,
  onSave,
  onSkip
}: SaveAsTemplateModalProps) {
  const [name, setName] = useState(assignmentTitle || "");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [saving, setSaving] = useState(false);

  const t = {
    title: "Зберегти як шаблон?",
    subtitle: "Створіть шаблон на основі цього завдання для швидкого повторного використання",
    templateName: "Назва шаблону",
    namePlaceholder: "напр. Діалог про подорожі (A2)",
    description: "Опис",
    descriptionPlaceholder: "Опишіть цей шаблон...",
    tags: "Теги",
    tagsPlaceholder: "Додати тег...",
    addTag: "Додати",
    saveAsTemplate: "Зберегти шаблон",
    skip: "Пропустити",
    saving: "Збереження...",
    nameRequired: "Назва обов'язкова"
  };

  function handleAddTag() {
    const tag = tagInput.trim();
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
      setTagInput("");
    }
  }

  function handleRemoveTag(tag: string) {
    setTags(tags.filter(t => t !== tag));
  }

  async function handleSave() {
    if (!name.trim()) {
      alert(t.nameRequired);
      return;
    }

    setSaving(true);
    try {
      await onSave(name, description, tags);
    } catch (error) {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50">
      <div className="absolute inset-0" onClick={saving ? undefined : onSkip} />

      <div className="relative w-full max-w-lg bg-paper rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-br from-moss/10 to-moss/5 border-b border-moss/20 px-6 py-5">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-moss/20">
                <Sparkle size={22} weight="fill" className="text-moss" />
              </div>
              <h2 className="text-xl font-bold text-ink">{t.title}</h2>
            </div>
            <button
              onClick={onSkip}
              disabled={saving}
              className="rounded-lg p-2 text-ink/40 hover:bg-ink/5 hover:text-ink transition-colors disabled:opacity-50"
            >
              <X size={24} weight="bold" />
            </button>
          </div>
          <p className="text-sm text-ink/60 ml-13">{t.subtitle}</p>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-5">
          {/* Name */}
          <div>
            <label className="block text-sm font-semibold text-ink mb-2">
              {t.templateName} <span className="text-terracotta">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t.namePlaceholder}
              className="w-full rounded-xl border border-ink/20 bg-paper px-4 py-3 text-ink focus:border-moss focus:outline-none focus:ring-2 focus:ring-moss/20"
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-ink mb-2">
              {t.description}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t.descriptionPlaceholder}
              rows={3}
              className="w-full rounded-xl border border-ink/20 bg-paper px-4 py-3 text-ink focus:border-moss focus:outline-none focus:ring-2 focus:ring-moss/20 resize-none"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-semibold text-ink mb-2">
              {t.tags}
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder={t.tagsPlaceholder}
                className="flex-1 rounded-xl border border-ink/20 bg-paper px-4 py-2 text-sm text-ink focus:border-moss focus:outline-none focus:ring-2 focus:ring-moss/20"
              />
              <button
                onClick={handleAddTag}
                type="button"
                className="rounded-xl border border-moss/30 bg-moss/10 px-4 py-2 text-sm font-semibold text-moss hover:bg-moss/20 transition-colors"
              >
                {t.addTag}
              </button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-2 rounded-full bg-moss/10 px-3 py-1.5 text-sm text-moss"
                  >
                    <TagIcon size={14} weight="fill" />
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      type="button"
                      className="hover:text-terracotta transition-colors"
                    >
                      <X size={14} weight="bold" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-ink/10 bg-ink/[0.02]">
          <button
            onClick={onSkip}
            disabled={saving}
            className="rounded-full border border-ink/20 bg-paper px-5 py-2.5 text-sm font-semibold text-ink hover:bg-ink/5 transition-colors disabled:opacity-50"
          >
            {t.skip}
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className="inline-flex items-center gap-2 rounded-full border border-moss/30 bg-moss px-5 py-2.5 text-sm font-semibold text-white hover:bg-moss/90 transition-colors disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader size="sm" />
                {t.saving}
              </>
            ) : (
              <>
                <Check size={18} weight="bold" />
                {t.saveAsTemplate}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
