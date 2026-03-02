"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Check, Sparkle, FileText } from "@phosphor-icons/react";
import SelectTemplateModal from "@/components/classes/templates/SelectTemplateModal";
import SaveAsTemplateModal from "@/components/classes/templates/SaveAsTemplateModal";

type AssignmentType = 'exercise' | 'test' | 'reading' | 'custom';
type ExerciseType = 'sentences' | 'cloze' | 'match' | 'translate' | 'paraphrase' | 'dialogue' | 'describe' | 'story';

type Template = {
  _id: string;
  name: string;
  type: AssignmentType;
  exerciseType?: ExerciseType;
  exerciseConfig?: any;
  defaultTitle?: string;
  defaultDescription?: string;
  defaultInstructions?: string;
  defaultPointsTotal?: number;
  defaultPassingScore?: number;
};

export default function NewAssignmentPage() {
  const params = useParams();
  const classId = params.id as string;

  const [creationMode, setCreationMode] = useState<'scratch' | 'template' | null>(null);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);

  const [type, setType] = useState<AssignmentType>('exercise');
  const [exerciseType, setExerciseType] = useState<ExerciseType>('sentences');
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [topic, setTopic] = useState("");
  const [level, setLevel] = useState("A1");
  const [publishAt, setPublishAt] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [pointsTotal, setPointsTotal] = useState(100);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [showSaveAsTemplateModal, setShowSaveAsTemplateModal] = useState(false);
  const [createdAssignmentId, setCreatedAssignmentId] = useState<string | null>(null);

  const t = {
    title: "Створити завдання",
    backToClass: "Назад до класу",
    chooseMode: "Оберіть спосіб створення",
    fromScratch: "Створити з нуля",
    fromScratchDesc: "Налаштувати все вручну",
    fromTemplate: "Використати шаблон",
    fromTemplateDesc: "Швидке створення з готової конфігурації",
    usingTemplate: "Використовується шаблон",
    changeTemplate: "Змінити шаблон",
    clearTemplate: "Очистити",
    assignmentType: "Тип завдання",
    exercise: "Вправа",
    test: "Тест",
    reading: "Читання",
    custom: "Власне завдання",
    exerciseType: "Тип вправи",
    sentences: "Речення",
    cloze: "Заповнити пропуски",
    match: "Співставити",
    translate: "Переклад",
    paraphrase: "Перефразувати",
    dialogue: "Діалог",
    describe: "Опис",
    story: "Історія",
    assignmentTitle: "Назва завдання",
    assignmentTitlePlaceholder: "напр. Вправа: Минулий час",
    descriptionLabel: "Опис (опціонально)",
    descriptionPlaceholder: "Що студенти мають зробити",
    topicLabel: "Тема для AI",
    topicPlaceholder: "напр. Минулий час дієслів",
    level: "Рівень",
    publishDate: "Дата публікації (опціонально)",
    publishDateHint: "Залиште порожнім для негайної публікації",
    dueDate: "Дедлайн (опціонально)",
    points: "Максимальна к-сть балів",
    cancel: "Скасувати",
    create: "Створити завдання",
    creating: "Створення..."
  };

  const exerciseTypes = [
    { value: 'sentences', label: t.sentences, icon: '📝' },
    { value: 'cloze', label: t.cloze, icon: '🔤' },
    { value: 'match', label: t.match, icon: '🔗' },
    { value: 'translate', label: t.translate, icon: '🌐' },
    { value: 'paraphrase', label: t.paraphrase, icon: '💬' },
    { value: 'dialogue', label: t.dialogue, icon: '🗣️' },
    { value: 'describe', label: t.describe, icon: '🖼️' },
    { value: 'story', label: t.story, icon: '📖' }
  ];

  function handleSelectTemplate(template: Template) {
    setSelectedTemplate(template);
    setCreationMode('template');
    setShowTemplateModal(false);

    // Auto-fill fields from template
    setType(template.type);
    if (template.exerciseType) {
      setExerciseType(template.exerciseType as ExerciseType);
    }
    if (template.defaultTitle) {
      setTitle(template.defaultTitle);
    }
    if (template.defaultDescription) {
      setDescription(template.defaultDescription);
    }
    if (template.exerciseConfig) {
      if (template.exerciseConfig.topic) setTopic(template.exerciseConfig.topic);
      if (template.exerciseConfig.level) setLevel(template.exerciseConfig.level);
    }
    if (template.defaultPointsTotal) {
      setPointsTotal(template.defaultPointsTotal);
    }
  }

  function handleClearTemplate() {
    setSelectedTemplate(null);
    setCreationMode('scratch');
    setTitle("");
    setDescription("");
    setTopic("");
    setLevel("A1");
    setPointsTotal(100);
  }

  function handleSkipTemplate() {
    window.location.href = `/classes/${classId}?tab=assignments`;
  }

  async function handleSaveAsTemplate(templateName: string, templateDescription: string, tags: string[]) {
    try {
      const payload: any = {
        name: templateName,
        description: templateDescription || undefined,
        tags: tags.length > 0 ? tags : undefined,
        type,
        defaultTitle: title,
        defaultDescription: description || undefined,
        defaultPointsTotal: pointsTotal,
        defaultPassingScore: Math.floor(pointsTotal * 0.6)
      };

      if (type === 'exercise') {
        payload.exerciseType = exerciseType;
        payload.exerciseConfig = {
          topic: topic,
          level: level,
          difficulty: level
        };
      }

      const res = await fetch("/api/classes/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create template");
      }

      // Redirect to assignments list
      window.location.href = `/classes/${classId}?tab=assignments`;
    } catch (error) {
      console.error("Error saving template:", error);
      alert("Помилка збереження шаблону");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!title.trim()) {
      setError("Введіть назву завдання");
      return;
    }

    if (type === 'exercise' && !topic.trim()) {
      setError("Введіть тему для AI генерації");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`/api/classes/${classId}/assignments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          title: title.trim(),
          description: description.trim() || undefined,
          exerciseType: type === 'exercise' ? exerciseType : undefined,
          exerciseConfig: type === 'exercise' ? {
            topic: topic.trim(),
            level,
            difficulty: level
          } : undefined,
          publishAt: publishAt || undefined,
          dueAt: dueAt || undefined,
          pointsTotal,
          passingScore: Math.floor(pointsTotal * 0.6), // 60% для проходження
          assignedTo: 'all', // Phase 2: додамо вибір студентів
          settings: {
            allowLateSubmission: true,
            showResultsImmediately: true,
            allowRetake: false,
            maxAttempts: 1
          }
        })
      });

      const data = await res.json();

      if (res.ok) {
        // Update template usage count if template was used
        if (selectedTemplate) {
          await fetch(`/api/classes/templates/${selectedTemplate._id}/use`, {
            method: "POST"
          }).catch(err => console.error("Failed to update template usage:", err));
        }

        // Save assignment ID and show "Save as template" modal
        setCreatedAssignmentId(data.assignmentId);
        setShowSaveAsTemplateModal(true);
      } else {
        setError(data.error || "Помилка створення завдання");
      }
    } catch (err) {
      setError("Помилка з'єднання з сервером");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-5 sm:px-6 py-10">
      {/* Header */}
      <div className="mb-8">
        <Link
          href={`/classes/${classId}`}
          className="inline-flex items-center gap-2 text-sm text-ink/60 hover:text-ink transition-colors mb-4"
        >
          <ArrowLeft size={16} />
          {t.backToClass}
        </Link>
        <h1 className="text-3xl font-bold text-ink">{t.title}</h1>
      </div>

      {/* Mode Selection */}
      {!creationMode && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-ink mb-4">{t.chooseMode}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setCreationMode('scratch')}
              className="group rounded-2xl border-2 border-ink/20 bg-paper p-6 text-left hover:border-moss hover:bg-moss/5 transition-all"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-ink/5 group-hover:bg-moss/10 transition-colors">
                  <Sparkle size={24} weight="fill" className="text-ink/60 group-hover:text-moss transition-colors" />
                </div>
                <div>
                  <h3 className="font-bold text-ink">{t.fromScratch}</h3>
                  <p className="text-xs text-ink/60">{t.fromScratchDesc}</p>
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setShowTemplateModal(true)}
              className="group rounded-2xl border-2 border-moss/30 bg-moss/5 p-6 text-left hover:border-moss hover:bg-moss/10 transition-all"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-moss/10 group-hover:bg-moss/20 transition-colors">
                  <FileText size={24} weight="fill" className="text-moss" />
                </div>
                <div>
                  <h3 className="font-bold text-ink">{t.fromTemplate}</h3>
                  <p className="text-xs text-ink/60">{t.fromTemplateDesc}</p>
                </div>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Template Badge */}
      {selectedTemplate && creationMode === 'template' && (
        <div className="mb-6 rounded-2xl border border-moss/30 bg-moss/10 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-moss/70 uppercase tracking-wide mb-1">
                {t.usingTemplate}
              </p>
              <p className="font-bold text-moss">{selectedTemplate.name}</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowTemplateModal(true)}
                className="rounded-lg border border-moss/30 bg-paper px-3 py-1.5 text-xs font-semibold text-moss hover:bg-moss/10 transition-colors"
              >
                {t.changeTemplate}
              </button>
              <button
                type="button"
                onClick={handleClearTemplate}
                className="rounded-lg border border-ink/20 bg-paper px-3 py-1.5 text-xs font-semibold text-ink/60 hover:bg-ink/5 transition-colors"
              >
                {t.clearTemplate}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Form */}
      {creationMode && (
        <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="rounded-2xl border border-terracotta/30 bg-terracotta/10 p-4 text-sm text-terracotta">
            {error}
          </div>
        )}

        {/* Assignment Type */}
        <div>
          <label className="block text-sm font-semibold text-ink mb-3">
            {t.assignmentType}
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { value: 'exercise', label: t.exercise, icon: '📝' },
              { value: 'test', label: t.test, icon: '✅', disabled: true },
              { value: 'reading', label: t.reading, icon: '📚', disabled: true },
              { value: 'custom', label: t.custom, icon: '✏️', disabled: true }
            ].map(item => (
              <button
                key={item.value}
                type="button"
                onClick={() => !item.disabled && setType(item.value as AssignmentType)}
                disabled={item.disabled}
                className={`relative rounded-xl border p-4 text-sm font-semibold transition-all ${
                  type === item.value
                    ? 'border-moss bg-moss/10 text-moss'
                    : item.disabled
                    ? 'border-ink/10 bg-ink/5 text-ink/30 cursor-not-allowed'
                    : 'border-ink/20 bg-paper text-ink/70 hover:border-moss/30'
                }`}
              >
                {type === item.value && !item.disabled && (
                  <Check size={16} weight="bold" className="absolute top-2 right-2" />
                )}
                <div className="text-2xl mb-1">{item.icon}</div>
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Exercise Type (якщо вибрано exercise) */}
        {type === 'exercise' && (
          <div>
            <label className="block text-sm font-semibold text-ink mb-3">
              {t.exerciseType}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {exerciseTypes.map(item => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setExerciseType(item.value as ExerciseType)}
                  className={`relative rounded-xl border p-3 text-xs font-semibold transition-all ${
                    exerciseType === item.value
                      ? 'border-moss bg-moss/10 text-moss'
                      : 'border-ink/20 bg-paper text-ink/70 hover:border-moss/30'
                  }`}
                >
                  {exerciseType === item.value && (
                    <Check size={12} weight="bold" className="absolute top-1 right-1" />
                  )}
                  <div className="text-xl mb-0.5">{item.icon}</div>
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Title */}
        <div>
          <label className="block text-sm font-semibold text-ink mb-2">
            {t.assignmentTitle} <span className="text-terracotta">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t.assignmentTitlePlaceholder}
            className="w-full rounded-2xl border border-ink/20 bg-paper px-4 py-3 text-ink placeholder:text-ink/40 focus:border-moss/50 focus:outline-none focus:ring-2 focus:ring-moss/20"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-semibold text-ink mb-2">
            {t.descriptionLabel}
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t.descriptionPlaceholder}
            rows={3}
            className="w-full rounded-2xl border border-ink/20 bg-paper px-4 py-3 text-ink placeholder:text-ink/40 focus:border-moss/50 focus:outline-none focus:ring-2 focus:ring-moss/20 resize-none"
          />
        </div>

        {/* Topic (для exercise) */}
        {type === 'exercise' && (
          <div>
            <label className="block text-sm font-semibold text-ink mb-2">
              {t.topicLabel} <span className="text-terracotta">*</span>
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder={t.topicPlaceholder}
              className="w-full rounded-2xl border border-ink/20 bg-paper px-4 py-3 text-ink placeholder:text-ink/40 focus:border-moss/50 focus:outline-none focus:ring-2 focus:ring-moss/20"
            />
          </div>
        )}

        {/* Level (для exercise) */}
        {type === 'exercise' && (
          <div>
            <label className="block text-sm font-semibold text-ink mb-2">
              {t.level}
            </label>
            <div className="grid grid-cols-5 gap-2">
              {['A1', 'A2', 'B1', 'B2', 'C1'].map(lvl => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setLevel(lvl)}
                  className={`rounded-xl border p-2 text-sm font-semibold transition-all ${
                    level === lvl
                      ? 'border-moss bg-moss text-white'
                      : 'border-ink/20 bg-paper text-ink/70 hover:border-moss/30'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Publish Date */}
        <div>
          <label className="block text-sm font-semibold text-ink mb-2">
            {t.publishDate}
          </label>
          <input
            type="datetime-local"
            value={publishAt}
            onChange={(e) => setPublishAt(e.target.value)}
            className="w-full rounded-2xl border border-ink/20 bg-paper px-4 py-3 text-ink focus:border-moss/50 focus:outline-none focus:ring-2 focus:ring-moss/20"
          />
          <p className="text-xs text-ink/50 mt-1">{t.publishDateHint}</p>
        </div>

        {/* Due Date */}
        <div>
          <label className="block text-sm font-semibold text-ink mb-2">
            {t.dueDate}
          </label>
          <input
            type="datetime-local"
            value={dueAt}
            onChange={(e) => setDueAt(e.target.value)}
            className="w-full rounded-2xl border border-ink/20 bg-paper px-4 py-3 text-ink focus:border-moss/50 focus:outline-none focus:ring-2 focus:ring-moss/20"
          />
        </div>

        {/* Points */}
        <div>
          <label className="block text-sm font-semibold text-ink mb-2">
            {t.points}
          </label>
          <input
            type="number"
            value={pointsTotal}
            onChange={(e) => setPointsTotal(Number(e.target.value))}
            min={1}
            max={1000}
            className="w-full rounded-2xl border border-ink/20 bg-paper px-4 py-3 text-ink focus:border-moss/50 focus:outline-none focus:ring-2 focus:ring-moss/20"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <Link
            href={`/classes/${classId}`}
            className="flex-1 rounded-full border border-ink/20 bg-paper px-6 py-3 text-center text-sm font-semibold text-ink hover:bg-ink/5 transition-colors"
          >
            {t.cancel}
          </Link>
          <button
            type="submit"
            disabled={loading || !title.trim() || (type === 'exercise' && !topic.trim())}
            className="flex-1 rounded-full border border-moss/30 bg-moss px-6 py-3 text-sm font-semibold text-white hover:bg-moss/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? t.creating : t.create}
          </button>
        </div>
      </form>
      )}

      {/* Select Template Modal */}
      {showTemplateModal && (
        <SelectTemplateModal
          onSelect={handleSelectTemplate}
          onClose={() => setShowTemplateModal(false)}
        />
      )}

      {/* Save As Template Modal */}
      {showSaveAsTemplateModal && (
        <SaveAsTemplateModal
          assignmentTitle={title}
          onSave={handleSaveAsTemplate}
          onSkip={handleSkipTemplate}
        />
      )}
    </div>
  );
}
