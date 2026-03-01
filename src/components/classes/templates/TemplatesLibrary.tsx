"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  MagnifyingGlass,
  Funnel,
  Plus,
  BookOpen,
  GraduationCap,
  Article,
  Clipboard
} from "@phosphor-icons/react";
import TemplateCard from "./TemplateCard";
import CreateTemplateModal from "./CreateTemplateModal";
import Loader from "@/components/ui/Loader";

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

type TemplatesLibraryProps = {
  locale: "uk" | "pl";
};

export default function TemplatesLibrary({ locale }: TemplatesLibraryProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [exerciseTypeFilter, setExerciseTypeFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"recent" | "name" | "used">("recent");
  const [showCreateModal, setShowCreateModal] = useState(false);

  const t = locale === "uk" ? {
    title: "Бібліотека шаблонів",
    subtitle: "Створюйте та керуйте шаблонами завдань",
    backToClasses: "Назад до класів",
    createTemplate: "Створити шаблон",
    search: "Шукати шаблони...",
    filters: "Фільтри",
    sortBy: "Сортувати",
    sortRecent: "За датою",
    sortName: "За назвою",
    sortUsed: "За використанням",
    allTypes: "Всі типи",
    exercise: "Вправа",
    test: "Тест",
    reading: "Читання",
    custom: "Власне",
    allExercises: "Всі вправи",
    sentences: "Речення",
    cloze: "Заповнення пропусків",
    match: "Відповідності",
    translate: "Переклад",
    paraphrase: "Перефразування",
    dialogue: "Діалог",
    describe: "Опис",
    story: "Історія",
    noTemplates: "Ще немає шаблонів",
    noTemplatesDesc: "Створіть свій перший шаблон для швидкого створення завдань",
    noResults: "Шаблони не знайдено",
    noResultsDesc: "Спробуйте змінити фільтри або пошуковий запит",
    loading: "Завантаження шаблонів..."
  } : {
    title: "Biblioteka szablonów",
    subtitle: "Twórz i zarządzaj szablonami zadań",
    backToClasses: "Powrót do klas",
    createTemplate: "Utwórz szablon",
    search: "Szukaj szablonów...",
    filters: "Filtry",
    sortBy: "Sortuj",
    sortRecent: "Według daty",
    sortName: "Według nazwy",
    sortUsed: "Według użycia",
    allTypes: "Wszystkie typy",
    exercise: "Ćwiczenie",
    test: "Test",
    reading: "Czytanie",
    custom: "Własne",
    allExercises: "Wszystkie ćwiczenia",
    sentences: "Zdania",
    cloze: "Uzupełnianie luk",
    match: "Dopasowania",
    translate: "Tłumaczenie",
    paraphrase: "Parafrazowanie",
    dialogue: "Dialog",
    describe: "Opis",
    story: "Historia",
    noTemplates: "Nie ma jeszcze szablonów",
    noTemplatesDesc: "Utwórz swój pierwszy szablon, aby szybko tworzyć zadania",
    noResults: "Nie znaleziono szablonów",
    noResultsDesc: "Spróbuj zmienić filtry lub zapytanie wyszukiwania",
    loading: "Ładowanie szablonów..."
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

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(t =>
        t.name.toLowerCase().includes(query) ||
        t.description?.toLowerCase().includes(query) ||
        t.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Type filter
    if (typeFilter !== "all") {
      result = result.filter(t => t.type === typeFilter);
    }

    // Exercise type filter
    if (exerciseTypeFilter !== "all") {
      result = result.filter(t => t.exerciseType === exerciseTypeFilter);
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === "name") {
        return a.name.localeCompare(b.name);
      } else if (sortBy === "used") {
        return b.usedCount - a.usedCount;
      } else {
        // recent
        const dateA = a.lastUsedAt || a.createdAt;
        const dateB = b.lastUsedAt || b.createdAt;
        return new Date(dateB).getTime() - new Date(dateA).getTime();
      }
    });

    return result;
  }, [templates, searchQuery, typeFilter, exerciseTypeFilter, sortBy]);

  const typeIcon = (type: string) => {
    switch (type) {
      case "exercise":
        return <GraduationCap size={18} weight="fill" />;
      case "test":
        return <Clipboard size={18} weight="fill" />;
      case "reading":
        return <BookOpen size={18} weight="fill" />;
      case "custom":
        return <Article size={18} weight="fill" />;
      default:
        return null;
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-5 sm:px-6 py-10">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/classes"
          className="inline-flex items-center gap-2 text-sm text-ink/60 hover:text-ink transition-colors mb-4"
        >
          <ArrowLeft size={16} />
          {t.backToClasses}
        </Link>

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold text-ink mb-2">{t.title}</h1>
            <p className="text-ink/60">{t.subtitle}</p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 rounded-full border border-moss/30 bg-moss px-5 py-3 text-sm font-semibold text-white hover:bg-moss/90 transition-colors"
          >
            <Plus size={18} weight="bold" />
            {t.createTemplate}
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="mb-6 space-y-4">
        <div className="flex gap-3 flex-wrap">
          {/* Search */}
          <div className="flex-1 min-w-[240px]">
            <div className="relative">
              <MagnifyingGlass
                size={20}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/40"
              />
              <input
                type="text"
                placeholder={t.search}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-ink/20 bg-paper pl-11 pr-4 py-3 text-ink focus:border-moss focus:outline-none focus:ring-2 focus:ring-moss/20"
              />
            </div>
          </div>

          {/* Type filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-xl border border-ink/20 bg-paper px-4 py-3 text-ink focus:border-moss focus:outline-none focus:ring-2 focus:ring-moss/20"
          >
            <option value="all">{t.allTypes}</option>
            <option value="exercise">{t.exercise}</option>
            <option value="test">{t.test}</option>
            <option value="reading">{t.reading}</option>
            <option value="custom">{t.custom}</option>
          </select>

          {/* Exercise type filter (only show if type is exercise) */}
          {typeFilter === "exercise" && (
            <select
              value={exerciseTypeFilter}
              onChange={(e) => setExerciseTypeFilter(e.target.value)}
              className="rounded-xl border border-ink/20 bg-paper px-4 py-3 text-ink focus:border-moss focus:outline-none focus:ring-2 focus:ring-moss/20"
            >
              <option value="all">{t.allExercises}</option>
              <option value="sentences">{t.sentences}</option>
              <option value="cloze">{t.cloze}</option>
              <option value="match">{t.match}</option>
              <option value="translate">{t.translate}</option>
              <option value="paraphrase">{t.paraphrase}</option>
              <option value="dialogue">{t.dialogue}</option>
              <option value="describe">{t.describe}</option>
              <option value="story">{t.story}</option>
            </select>
          )}

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="rounded-xl border border-ink/20 bg-paper px-4 py-3 text-ink focus:border-moss focus:outline-none focus:ring-2 focus:ring-moss/20"
          >
            <option value="recent">{t.sortRecent}</option>
            <option value="name">{t.sortName}</option>
            <option value="used">{t.sortUsed}</option>
          </select>
        </div>
      </div>

      {/* Templates Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader size="lg" label={t.loading} />
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="rounded-2xl border border-ink/10 bg-paper p-12 text-center">
          {templates.length === 0 ? (
            <>
              <div className="flex items-center justify-center gap-2 mb-4">
                {typeIcon("exercise")}
                <GraduationCap size={48} className="text-ink/30" />
                {typeIcon("test")}
              </div>
              <h3 className="text-lg font-bold text-ink mb-2">{t.noTemplates}</h3>
              <p className="text-sm text-ink/60 mb-6">{t.noTemplatesDesc}</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 rounded-full border border-moss/30 bg-moss px-5 py-2.5 text-sm font-semibold text-white hover:bg-moss/90 transition-colors"
              >
                <Plus size={18} weight="bold" />
                {t.createTemplate}
              </button>
            </>
          ) : (
            <>
              <MagnifyingGlass size={48} className="mx-auto mb-4 text-ink/30" />
              <h3 className="text-lg font-bold text-ink mb-2">{t.noResults}</h3>
              <p className="text-sm text-ink/60">{t.noResultsDesc}</p>
            </>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTemplates.map(template => (
            <TemplateCard
              key={template._id}
              template={template}
              locale={locale}
              onUpdate={loadTemplates}
            />
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <CreateTemplateModal
          locale={locale}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadTemplates();
          }}
        />
      )}
    </div>
  );
}
