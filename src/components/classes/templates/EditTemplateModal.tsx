"use client";

import { useState, useEffect } from "react";
import { X, Check, Tag as TagIcon } from "@phosphor-icons/react";
import Loader from "@/components/ui/Loader";
import { csrfFetch } from "@/lib/csrf-client";

type EditTemplateModalProps = {
  templateId: string;
  locale: "uk" | "pl";
  onClose: () => void;
  onSuccess: () => void;
};

export default function EditTemplateModal({ templateId, locale, onClose, onSuccess }: EditTemplateModalProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [defaultTitle, setDefaultTitle] = useState("");
  const [defaultDescription, setDefaultDescription] = useState("");
  const [defaultInstructions, setDefaultInstructions] = useState("");
  const [defaultPointsTotal, setDefaultPointsTotal] = useState<number>(100);
  const [defaultPassingScore, setDefaultPassingScore] = useState<number>(60);

  const t = locale === "uk" ? {
    editTemplate: "Редагувати шаблон",
    name: "Назва шаблону",
    description: "Опис",
    descriptionPlaceholder: "Опишіть цей шаблон...",
    tags: "Теги",
    tagsPlaceholder: "Додати тег...",
    addTag: "Додати",
    defaultTitle: "Типова назва завдання",
    defaultTitlePlaceholder: "Залиште порожнім або вкажіть типову назву",
    defaultDescription: "Типовий опис",
    defaultDescriptionPlaceholder: "Опис завдання...",
    defaultInstructions: "Типові інструкції",
    defaultInstructionsPlaceholder: "Інструкції для студентів...",
    pointsTotal: "Максимальна кількість балів",
    passingScore: "Прохідний бал (%)",
    cancel: "Скасувати",
    save: "Зберегти",
    saving: "Збереження...",
    loading: "Завантаження...",
    nameRequired: "Назва обов'язкова",
    error: "Помилка оновлення шаблону"
  } : {
    editTemplate: "Edytuj szablon",
    name: "Nazwa szablonu",
    description: "Opis",
    descriptionPlaceholder: "Opisz ten szablon...",
    tags: "Tagi",
    tagsPlaceholder: "Dodaj tag...",
    addTag: "Dodaj",
    defaultTitle: "Domyślny tytuł zadania",
    defaultTitlePlaceholder: "Pozostaw puste lub podaj domyślny tytuł",
    defaultDescription: "Domyślny opis",
    defaultDescriptionPlaceholder: "Opis zadania...",
    defaultInstructions: "Domyślne instrukcje",
    defaultInstructionsPlaceholder: "Instrukcje dla uczniów...",
    pointsTotal: "Maksymalna liczba punktów",
    passingScore: "Wynik zaliczenia (%)",
    cancel: "Anuluj",
    save: "Zapisz",
    saving: "Zapisywanie...",
    loading: "Ładowanie...",
    nameRequired: "Nazwa jest wymagana",
    error: "Błąd aktualizacji szablonu"
  };

  useEffect(() => {
    loadTemplate();
  }, [templateId]);

  async function loadTemplate() {
    try {
      setLoading(true);
      const res = await fetch(`/api/classes/templates/${templateId}`);
      if (!res.ok) throw new Error("Failed to load");

      const { template } = await res.json();

      setName(template.name || "");
      setDescription(template.description || "");
      setTags(template.tags || []);
      setDefaultTitle(template.defaultTitle || "");
      setDefaultDescription(template.defaultDescription || "");
      setDefaultInstructions(template.defaultInstructions || "");
      setDefaultPointsTotal(template.defaultPointsTotal || 100);
      setDefaultPassingScore(template.defaultPassingScore || 60);
    } catch (error) {
      console.error("Error loading template:", error);
      alert("Failed to load template");
      onClose();
    } finally {
      setLoading(false);
    }
  }

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

    try {
      setSaving(true);

      const payload = {
        name: name.trim(),
        description: description.trim() || undefined,
        tags: tags.length > 0 ? tags : undefined,
        defaultTitle: defaultTitle.trim() || undefined,
        defaultDescription: defaultDescription.trim() || undefined,
        defaultInstructions: defaultInstructions.trim() || undefined,
        defaultPointsTotal: defaultPointsTotal || undefined,
        defaultPassingScore: defaultPassingScore || undefined
      };

      const res = await csrfFetch(`/api/classes/templates/${templateId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update");
      }

      onSuccess();
    } catch (error) {
      console.error("Error updating template:", error);
      alert(t.error);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50">
      <div
        className="absolute inset-0"
        onClick={() => !saving && !loading && onClose()}
      />

      <div className="relative w-full max-w-2xl bg-paper rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-paper border-b border-ink/10 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-ink">{t.editTemplate}</h2>
          <button
            onClick={onClose}
            disabled={saving || loading}
            className="rounded-lg p-2 text-ink/40 hover:bg-ink/5 hover:text-ink transition-colors disabled:opacity-50"
          >
            <X size={24} weight="bold" />
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="px-6 py-12 flex items-center justify-center">
            <Loader size="lg" label={t.loading} />
          </div>
        ) : (
          <div className="px-6 py-6 space-y-6">
            {/* Name */}
            <div>
              <label className="block text-sm font-semibold text-ink mb-2">
                {t.name} <span className="text-terracotta">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-ink/20 bg-paper px-4 py-3 text-ink focus:border-moss focus:outline-none focus:ring-2 focus:ring-moss/20"
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
                        className="hover:text-terracotta transition-colors"
                      >
                        <X size={14} weight="bold" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Default Title */}
            <div>
              <label className="block text-sm font-semibold text-ink mb-2">
                {t.defaultTitle}
              </label>
              <input
                type="text"
                value={defaultTitle}
                onChange={(e) => setDefaultTitle(e.target.value)}
                placeholder={t.defaultTitlePlaceholder}
                className="w-full rounded-xl border border-ink/20 bg-paper px-4 py-3 text-ink focus:border-moss focus:outline-none focus:ring-2 focus:ring-moss/20"
              />
            </div>

            {/* Default Description */}
            <div>
              <label className="block text-sm font-semibold text-ink mb-2">
                {t.defaultDescription}
              </label>
              <textarea
                value={defaultDescription}
                onChange={(e) => setDefaultDescription(e.target.value)}
                placeholder={t.defaultDescriptionPlaceholder}
                rows={3}
                className="w-full rounded-xl border border-ink/20 bg-paper px-4 py-3 text-ink focus:border-moss focus:outline-none focus:ring-2 focus:ring-moss/20 resize-none"
              />
            </div>

            {/* Default Instructions */}
            <div>
              <label className="block text-sm font-semibold text-ink mb-2">
                {t.defaultInstructions}
              </label>
              <textarea
                value={defaultInstructions}
                onChange={(e) => setDefaultInstructions(e.target.value)}
                placeholder={t.defaultInstructionsPlaceholder}
                rows={3}
                className="w-full rounded-xl border border-ink/20 bg-paper px-4 py-3 text-ink focus:border-moss focus:outline-none focus:ring-2 focus:ring-moss/20 resize-none"
              />
            </div>

            {/* Points */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-ink mb-2">
                  {t.pointsTotal}
                </label>
                <input
                  type="number"
                  value={defaultPointsTotal}
                  onChange={(e) => setDefaultPointsTotal(Number(e.target.value))}
                  min={1}
                  className="w-full rounded-xl border border-ink/20 bg-paper px-4 py-3 text-ink focus:border-moss focus:outline-none focus:ring-2 focus:ring-moss/20"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-ink mb-2">
                  {t.passingScore}
                </label>
                <input
                  type="number"
                  value={defaultPassingScore}
                  onChange={(e) => setDefaultPassingScore(Number(e.target.value))}
                  min={0}
                  max={100}
                  className="w-full rounded-xl border border-ink/20 bg-paper px-4 py-3 text-ink focus:border-moss focus:outline-none focus:ring-2 focus:ring-moss/20"
                />
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="sticky bottom-0 bg-paper border-t border-ink/10 px-6 py-4 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={saving || loading}
            className="rounded-full border border-ink/20 bg-paper px-5 py-2.5 text-sm font-semibold text-ink hover:bg-ink/5 transition-colors disabled:opacity-50"
          >
            {t.cancel}
          </button>
          <button
            onClick={handleSave}
            disabled={saving || loading || !name.trim()}
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
                {t.save}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
