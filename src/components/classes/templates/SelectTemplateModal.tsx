"use client";

import { useState, useEffect, useMemo } from "react";
import {
  X,
  MagnifyingGlass,
  GraduationCap,
  Clipboard,
  BookOpen,
  Article,
  Tag,
  TrendUp,
  Check
} from "@phosphor-icons/react";
import Loader from "@/components/ui/Loader";

type AssignmentType = 'exercise' | 'test' | 'reading' | 'custom';
type ExerciseType = 'sentences' | 'cloze' | 'match' | 'translate' | 'paraphrase' | 'dialogue' | 'describe' | 'story';

type Template = {
  _id: string;
  name: string;
  description?: string;
  tags?: string[];
  type: AssignmentType;
  exerciseType?: ExerciseType;
  exerciseConfig?: any;
  defaultTitle?: string;
  defaultDescription?: string;
  defaultInstructions?: string;
  defaultPointsTotal?: number;
  defaultPassingScore?: number;
  usedCount: number;
  lastUsedAt?: string;
  createdAt: string;
};

type SelectTemplateModalProps = {
  onSelect: (template: Template) => void;
  onClose: () => void;
};

export default function SelectTemplateModal({ onSelect, onClose }: SelectTemplateModalProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const t = {
    title: "Вибрати шаблон",
    search: "Шукати...",
    allTypes: "Всі типи",
    exercise: "Вправа",
    test: "Тест",
    reading: "Читання",
    custom: "Власне",
    used: "Використано",
    times: "раз(и)",
    select: "Вибрати",
    cancel: "Скасувати",
    noTemplates: "Шаблони не знайдено",
    loading: "Завантаження...",
    sentences: "Речення",
    cloze: "Пропуски",
    match: "Відповідності",
    translate: "Переклад",
    paraphrase: "Перефразування",
    dialogue: "Діалог",
    describe: "Опис",
    story: "Історія"
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  async function loadTemplates() {
    try {
      setLoading(true);
      const res = await fetch("/api/classes/templates");
      if (res.ok) {
        const data = await res.json();
        setTemplates(data.templates);
      }
    } catch (error) {
      console.error("Failed to load templates:", error);
    } finally {
      setLoading(false);
    }
  }

  const filteredTemplates = useMemo(() => {
    let result = [...templates];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(t =>
        t.name.toLowerCase().includes(query) ||
        t.description?.toLowerCase().includes(query) ||
        t.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }

    if (typeFilter !== "all") {
      result = result.filter(t => t.type === typeFilter);
    }

    // Sort by usage
    result.sort((a, b) => {
      const dateA = a.lastUsedAt || a.createdAt;
      const dateB = b.lastUsedAt || b.createdAt;
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    });

    return result;
  }, [templates, searchQuery, typeFilter]);

  const typeIcon = (type: string) => {
    switch (type) {
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

  const exerciseTypeLabel = (exerciseType?: string) => {
    if (!exerciseType) return null;
    const labels: Record<string, string> = {
      sentences: t.sentences,
      cloze: t.cloze,
      match: t.match,
      translate: t.translate,
      paraphrase: t.paraphrase,
      dialogue: t.dialogue,
      describe: t.describe,
      story: t.story
    };
    return labels[exerciseType];
  };

  function handleSelect() {
    const template = templates.find(t => t._id === selectedId);
    if (template) {
      onSelect(template);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-4xl bg-paper rounded-2xl shadow-2xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-ink/10">
          <h2 className="text-xl font-bold text-ink">{t.title}</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-ink/40 hover:bg-ink/5 hover:text-ink transition-colors"
          >
            <X size={24} weight="bold" />
          </button>
        </div>

        {/* Filters */}
        <div className="px-6 py-4 border-b border-ink/5 space-y-3">
          <div className="flex gap-3">
            {/* Search */}
            <div className="flex-1 relative">
              <MagnifyingGlass
                size={20}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40"
              />
              <input
                type="text"
                placeholder={t.search}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-ink/20 bg-paper pl-10 pr-4 py-2 text-sm text-ink focus:border-moss focus:outline-none focus:ring-2 focus:ring-moss/20"
              />
            </div>

            {/* Type filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="rounded-xl border border-ink/20 bg-paper px-3 py-2 text-sm text-ink focus:border-moss focus:outline-none focus:ring-2 focus:ring-moss/20"
            >
              <option value="all">{t.allTypes}</option>
              <option value="exercise">{t.exercise}</option>
              <option value="test">{t.test}</option>
              <option value="reading">{t.reading}</option>
              <option value="custom">{t.custom}</option>
            </select>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader size="lg" label={t.loading} />
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-ink/60">{t.noTemplates}</p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {filteredTemplates.map((template) => (
                <button
                  key={template._id}
                  type="button"
                  onClick={() => setSelectedId(template._id)}
                  className={`relative rounded-xl border-2 p-4 text-left transition-all ${
                    selectedId === template._id
                      ? "border-moss bg-moss/10"
                      : "border-ink/10 hover:border-moss/30"
                  }`}
                >
                  {selectedId === template._id && (
                    <div className="absolute top-3 right-3">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-moss">
                        <Check size={14} weight="bold" className="text-white" />
                      </div>
                    </div>
                  )}

                  {/* Header */}
                  <div className="flex items-center gap-2 mb-2">
                    {typeIcon(template.type)}
                    <span className="text-xs font-semibold text-ink/60 uppercase tracking-wide">
                      {t[template.type as keyof typeof t] || template.type}
                      {template.exerciseType && ` · ${exerciseTypeLabel(template.exerciseType)}`}
                    </span>
                  </div>

                  {/* Name */}
                  <h3 className="font-bold text-ink mb-1 line-clamp-1">{template.name}</h3>

                  {/* Description */}
                  {template.description && (
                    <p className="text-xs text-ink/60 mb-2 line-clamp-2">{template.description}</p>
                  )}

                  {/* Tags */}
                  {template.tags && template.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {template.tags.slice(0, 2).map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-1 rounded-full bg-ink/5 px-2 py-0.5 text-xs text-ink/70"
                        >
                          <Tag size={10} weight="fill" />
                          {tag}
                        </span>
                      ))}
                      {template.tags.length > 2 && (
                        <span className="inline-flex items-center rounded-full bg-ink/5 px-2 py-0.5 text-xs text-ink/50">
                          +{template.tags.length - 2}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Stats */}
                  <div className="flex items-center gap-1 text-xs text-ink/50 pt-2 border-t border-ink/5">
                    <TrendUp size={12} weight="bold" />
                    <span>
                      {template.usedCount} {t.times}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-ink/10">
          <button
            onClick={onClose}
            className="rounded-full border border-ink/20 bg-paper px-5 py-2.5 text-sm font-semibold text-ink hover:bg-ink/5 transition-colors"
          >
            {t.cancel}
          </button>
          <button
            onClick={handleSelect}
            disabled={!selectedId}
            className="rounded-full border border-moss/30 bg-moss px-5 py-2.5 text-sm font-semibold text-white hover:bg-moss/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t.select}
          </button>
        </div>
      </div>
    </div>
  );
}
