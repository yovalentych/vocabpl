"use client";

import { useState } from "react";
import { X, Plus, Tag as TagIcon } from "@phosphor-icons/react";
import Loader from "@/components/ui/Loader";

type CreateTemplateModalProps = {
  locale: "uk" | "pl";
  onClose: () => void;
  onSuccess: () => void;
};

export default function CreateTemplateModal({ locale, onClose, onSuccess }: CreateTemplateModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [saving, setSaving] = useState(false);

  // Template data
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [type, setType] = useState<"exercise" | "test" | "reading" | "custom">("exercise");
  const [exerciseType, setExerciseType] = useState<string>("sentences");

  // Default values
  const [defaultTitle, setDefaultTitle] = useState("");
  const [defaultDescription, setDefaultDescription] = useState("");
  const [defaultInstructions, setDefaultInstructions] = useState("");
  const [defaultPointsTotal, setDefaultPointsTotal] = useState<number>(100);
  const [defaultPassingScore, setDefaultPassingScore] = useState<number>(60);

  const t = locale === "uk" ? {
    createTemplate: "Створити шаблон",
    step: "Крок",
    of: "з",
    basicInfo: "Основна інформація",
    defaults: "Типові значення",
    name: "Назва шаблону",
    namePlaceholder: "напр. Діалог про подорожі (A2)",
    description: "Опис",
    descriptionPlaceholder: "Опишіть цей шаблон...",
    tags: "Теги",
    tagsPlaceholder: "Додати тег...",
    addTag: "Додати",
    type: "Тип завдання",
    exercise: "Вправа",
    test: "Тест",
    reading: "Читання",
    custom: "Власне",
    exerciseType: "Тип вправи",
    sentences: "Речення",
    cloze: "Заповнення пропусків",
    match: "Відповідності",
    translate: "Переклад",
    paraphrase: "Перефразування",
    dialogue: "Діалог",
    describe: "Опис",
    story: "Історія",
    defaultTitle: "Типова назва завдання",
    defaultTitlePlaceholder: "Залиште порожнім або вкажіть типову назву",
    defaultDescription: "Типовий опис",
    defaultDescriptionPlaceholder: "Опис завдання...",
    defaultInstructions: "Типові інструкції",
    defaultInstructionsPlaceholder: "Інструкції для студентів...",
    pointsTotal: "Максимальна кількість балів",
    passingScore: "Прохідний бал (%)",
    cancel: "Скасувати",
    next: "Далі",
    back: "Назад",
    create: "Створити",
    creating: "Створення...",
    nameRequired: "Назва обов'язкова",
    error: "Помилка створення шаблону"
  } : {
    createTemplate: "Utwórz szablon",
    step: "Krok",
    of: "z",
    basicInfo: "Podstawowe informacje",
    defaults: "Wartości domyślne",
    name: "Nazwa szablonu",
    namePlaceholder: "np. Dialog o podróżach (A2)",
    description: "Opis",
    descriptionPlaceholder: "Opisz ten szablon...",
    tags: "Tagi",
    tagsPlaceholder: "Dodaj tag...",
    addTag: "Dodaj",
    type: "Typ zadania",
    exercise: "Ćwiczenie",
    test: "Test",
    reading: "Czytanie",
    custom: "Własne",
    exerciseType: "Typ ćwiczenia",
    sentences: "Zdania",
    cloze: "Uzupełnianie luk",
    match: "Dopasowania",
    translate: "Tłumaczenie",
    paraphrase: "Parafrazowanie",
    dialogue: "Dialog",
    describe: "Opis",
    story: "Historia",
    defaultTitle: "Domyślny tytuł zadania",
    defaultTitlePlaceholder: "Pozostaw puste lub podaj domyślny tytuł",
    defaultDescription: "Domyślny opis",
    defaultDescriptionPlaceholder: "Opis zadania...",
    defaultInstructions: "Domyślne instrukcje",
    defaultInstructionsPlaceholder: "Instrukcje dla uczniów...",
    pointsTotal: "Maksymalna liczba punktów",
    passingScore: "Wynik zaliczenia (%)",
    cancel: "Anuluj",
    next: "Dalej",
    back: "Wstecz",
    create: "Utwórz",
    creating: "Tworzenie...",
    nameRequired: "Nazwa jest wymagana",
    error: "Błąd tworzenia szablonu"
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

  async function handleSubmit() {
    if (!name.trim()) {
      alert(t.nameRequired);
      return;
    }

    try {
      setSaving(true);

      const payload: any = {
        name: name.trim(),
        description: description.trim() || undefined,
        tags: tags.length > 0 ? tags : undefined,
        type,
        defaultTitle: defaultTitle.trim() || undefined,
        defaultDescription: defaultDescription.trim() || undefined,
        defaultInstructions: defaultInstructions.trim() || undefined,
        defaultPointsTotal: defaultPointsTotal || undefined,
        defaultPassingScore: defaultPassingScore || undefined,
        defaultSettings: {
          allowLateSubmission: false,
          showResultsImmediately: true,
          allowRetake: false,
          maxAttempts: 1
        }
      };

      if (type === "exercise") {
        payload.exerciseType = exerciseType;
        // exerciseConfig can be added later through edit
      }

      const res = await fetch("/api/classes/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create");
      }

      onSuccess();
    } catch (error) {
      console.error("Error creating template:", error);
      alert(t.error);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50">
      <div
        className="absolute inset-0"
        onClick={() => !saving && onClose()}
      />

      <div className="relative w-full max-w-2xl bg-paper rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-paper border-b border-ink/10 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-ink">{t.createTemplate}</h2>
            <p className="text-sm text-ink/60 mt-1">
              {t.step} {step} {t.of} 2: {step === 1 ? t.basicInfo : t.defaults}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={saving}
            className="rounded-lg p-2 text-ink/40 hover:bg-ink/5 hover:text-ink transition-colors disabled:opacity-50"
          >
            <X size={24} weight="bold" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-6">
          {step === 1 ? (
            <>
              {/* Name */}
              <div>
                <label className="block text-sm font-semibold text-ink mb-2">
                  {t.name} <span className="text-terracotta">*</span>
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

              {/* Type */}
              <div>
                <label className="block text-sm font-semibold text-ink mb-2">
                  {t.type} <span className="text-terracotta">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {(['exercise', 'test', 'reading', 'custom'] as const).map((typeOption) => (
                    <label
                      key={typeOption}
                      className={`flex items-center gap-3 rounded-xl border-2 p-4 cursor-pointer transition-all ${
                        type === typeOption
                          ? "border-moss bg-moss/5"
                          : "border-ink/10 hover:border-ink/20"
                      }`}
                    >
                      <input
                        type="radio"
                        checked={type === typeOption}
                        onChange={() => setType(typeOption)}
                        className="sr-only"
                      />
                      <span className="text-sm font-semibold text-ink">
                        {t[typeOption]}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Exercise Type (only for exercise) */}
              {type === "exercise" && (
                <div>
                  <label className="block text-sm font-semibold text-ink mb-2">
                    {t.exerciseType} <span className="text-terracotta">*</span>
                  </label>
                  <select
                    value={exerciseType}
                    onChange={(e) => setExerciseType(e.target.value)}
                    className="w-full rounded-xl border border-ink/20 bg-paper px-4 py-3 text-ink focus:border-moss focus:outline-none focus:ring-2 focus:ring-moss/20"
                  >
                    <option value="sentences">{t.sentences}</option>
                    <option value="cloze">{t.cloze}</option>
                    <option value="match">{t.match}</option>
                    <option value="translate">{t.translate}</option>
                    <option value="paraphrase">{t.paraphrase}</option>
                    <option value="dialogue">{t.dialogue}</option>
                    <option value="describe">{t.describe}</option>
                    <option value="story">{t.story}</option>
                  </select>
                </div>
              )}
            </>
          ) : (
            <>
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
            </>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-paper border-t border-ink/10 px-6 py-4 flex items-center justify-between">
          <button
            onClick={step === 1 ? onClose : () => setStep(1)}
            disabled={saving}
            className="rounded-full border border-ink/20 bg-paper px-5 py-2.5 text-sm font-semibold text-ink hover:bg-ink/5 transition-colors disabled:opacity-50"
          >
            {step === 1 ? t.cancel : t.back}
          </button>

          {step === 1 ? (
            <button
              onClick={() => setStep(2)}
              disabled={!name.trim() || (type === "exercise" && !exerciseType)}
              className="rounded-full border border-moss/30 bg-moss px-5 py-2.5 text-sm font-semibold text-white hover:bg-moss/90 transition-colors disabled:opacity-50"
            >
              {t.next}
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-full border border-moss/30 bg-moss px-5 py-2.5 text-sm font-semibold text-white hover:bg-moss/90 transition-colors disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader size="sm" />
                  {t.creating}
                </>
              ) : (
                <>
                  <Plus size={18} weight="bold" />
                  {t.create}
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
