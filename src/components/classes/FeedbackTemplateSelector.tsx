"use client";

import { useState, useEffect } from "react";
import { Plus, X, Trash, ChatText } from "@phosphor-icons/react";

type FeedbackTemplate = {
  _id: string;
  teacherId?: string;
  title: string;
  comment: string;
  category: string;
  tags?: string[];
  isDefault: boolean;
  usedCount: number;
  createdAt: string;
};

type FeedbackTemplateSelectorProps = {
  locale: 'uk' | 'pl';
  onSelect: (comment: string, templateId: string) => void;
};

export default function FeedbackTemplateSelector({ locale, onSelect }: FeedbackTemplateSelectorProps) {
  const [templates, setTemplates] = useState<FeedbackTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newComment, setNewComment] = useState("");
  const [creating, setCreating] = useState(false);

  const t = locale === 'uk' ? {
    templates: "Шаблони",
    createTemplate: "Створити шаблон",
    title: "Назва",
    comment: "Коментар",
    save: "Зберегти",
    cancel: "Скасувати",
    delete: "Видалити",
    defaultTemplate: "Стандартний",
    customTemplate: "Власний",
    usedTimes: "разів використано",
    titlePlaceholder: "Наприклад: Відмінна робота",
    commentPlaceholder: "Введіть текст фідбеку...",
    creating: "Створення..."
  } : {
    templates: "Szablony",
    createTemplate: "Utwórz szablon",
    title: "Tytuł",
    comment: "Komentarz",
    save: "Zapisz",
    cancel: "Anuluj",
    delete: "Usuń",
    defaultTemplate: "Standardowy",
    customTemplate: "Własny",
    usedTimes: "razy użyto",
    titlePlaceholder: "Np: Świetna robota",
    commentPlaceholder: "Wprowadź tekst feedbacku...",
    creating: "Tworzenie..."
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  async function loadTemplates() {
    try {
      setLoading(true);
      const response = await fetch('/api/feedback-templates');
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoading(false);
    }
  }

  async function createTemplate() {
    if (!newTitle.trim() || !newComment.trim()) return;

    try {
      setCreating(true);
      const response = await fetch('/api/feedback-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle,
          comment: newComment,
          category: 'custom'
        })
      });

      if (response.ok) {
        setNewTitle("");
        setNewComment("");
        setShowCreateModal(false);
        await loadTemplates();
      }
    } catch (error) {
      console.error('Error creating template:', error);
    } finally {
      setCreating(false);
    }
  }

  async function deleteTemplate(templateId: string) {
    if (!confirm(locale === 'uk' ? 'Видалити цей шаблон?' : 'Usunąć ten szablon?')) {
      return;
    }

    try {
      const response = await fetch(`/api/feedback-templates/${templateId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await loadTemplates();
      }
    } catch (error) {
      console.error('Error deleting template:', error);
    }
  }

  async function selectTemplate(template: FeedbackTemplate) {
    // Increment usage count
    try {
      await fetch(`/api/feedback-templates/${template._id}`, {
        method: 'PATCH'
      });
    } catch (error) {
      console.error('Error updating template usage:', error);
    }

    onSelect(template.comment, template._id);
  }

  // Filter templates by locale (based on category/title language)
  const filteredTemplates = templates.filter(t => {
    // Default templates: show based on title language
    if (t.isDefault) {
      const isCyrillic = /[\u0400-\u04FF]/.test(t.title);
      return locale === 'uk' ? isCyrillic : !isCyrillic;
    }
    // Custom templates: show all
    return true;
  });

  if (loading) {
    return (
      <div className="text-sm text-ink/50 mb-3">
        {locale === 'uk' ? 'Завантаження шаблонів...' : 'Ładowanie szablonów...'}
      </div>
    );
  }

  return (
    <div className="mb-3">
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium text-ink/70 flex items-center gap-1">
          <ChatText size={16} />
          {t.templates}
        </label>
        <button
          onClick={() => setShowCreateModal(true)}
          className="text-xs text-moss hover:text-moss/80 flex items-center gap-1 transition-colors"
        >
          <Plus size={14} weight="bold" />
          {t.createTemplate}
        </button>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        {filteredTemplates.map(template => (
          <button
            key={template._id}
            onClick={() => selectTemplate(template)}
            className="relative text-left p-3 rounded-lg border border-ink/10 hover:border-moss/30 hover:bg-moss/5 transition-all group"
          >
            <div className="flex items-start justify-between gap-2 mb-1">
              <div className="text-sm font-medium text-ink line-clamp-1">
                {template.title}
              </div>
              {!template.isDefault && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteTemplate(template._id);
                  }}
                  className="opacity-0 group-hover:opacity-100 text-terracotta hover:text-terracotta/80 transition-opacity"
                >
                  <Trash size={14} />
                </button>
              )}
            </div>
            <div className="text-xs text-ink/50 line-clamp-2 mb-2">
              {template.comment}
            </div>
            <div className="text-xs text-ink/40">
              {template.isDefault ? t.defaultTemplate : t.customTemplate}
              {template.usedCount > 0 && ` · ${template.usedCount} ${t.usedTimes}`}
            </div>
          </button>
        ))}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-paper rounded-2xl max-w-lg w-full p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-ink">{t.createTemplate}</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-ink/50 hover:text-ink transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-ink/70 mb-1">
                  {t.title}
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder={t.titlePlaceholder}
                  className="w-full px-3 py-2 rounded-lg border border-ink/10 focus:border-moss/50 focus:outline-none text-sm"
                  maxLength={100}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-ink/70 mb-1">
                  {t.comment}
                </label>
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder={t.commentPlaceholder}
                  rows={4}
                  className="w-full px-3 py-2 rounded-lg border border-ink/10 focus:border-moss/50 focus:outline-none text-sm resize-none"
                  maxLength={500}
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-lg text-sm text-ink/70 hover:bg-ink/5 transition-colors"
                >
                  {t.cancel}
                </button>
                <button
                  onClick={createTemplate}
                  disabled={!newTitle.trim() || !newComment.trim() || creating}
                  className="px-4 py-2 rounded-lg text-sm bg-moss text-white hover:bg-moss/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creating ? t.creating : t.save}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
