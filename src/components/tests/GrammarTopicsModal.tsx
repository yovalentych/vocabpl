"use client";

import { useState, useMemo } from "react";
import { X, MagnifyingGlass, Check } from "@phosphor-icons/react";

interface GrammarTopic {
  id: string;
  label: string;
  category: string;
}

const GRAMMAR_TOPICS: GrammarTopic[] = [
  // Іменники
  { id: "noun-cases", label: "Відмінки іменників (Przypadki)", category: "Іменники" },
  { id: "noun-gender", label: "Рід іменників (Rodzaj)", category: "Іменники" },
  { id: "noun-number", label: "Число іменників (Liczba)", category: "Іменники" },
  { id: "noun-declension", label: "Відміна іменників", category: "Іменники" },

  // Прикметники
  { id: "adj-comparison", label: "Ступені порівняння прикметників", category: "Прикметники" },
  { id: "adj-agreement", label: "Узгодження прикметників", category: "Прикметники" },
  { id: "adj-declension", label: "Відміна прикметників", category: "Прикметники" },

  // Займенники
  { id: "pron-personal", label: "Особові займенники (Zaimki osobowe)", category: "Займенники" },
  { id: "pron-possessive", label: "Присвійні займенники", category: "Займенники" },
  { id: "pron-demonstrative", label: "Вказівні займенники", category: "Займенники" },
  { id: "pron-interrogative", label: "Питальні займенники", category: "Займенники" },
  { id: "pron-reflexive", label: "Зворотні займенники", category: "Займенники" },

  // Дієслова
  { id: "verb-present", label: "Теперішній час (Czas teraźniejszy)", category: "Дієслова" },
  { id: "verb-past", label: "Минулий час (Czas przeszły)", category: "Дієслова" },
  { id: "verb-future", label: "Майбутній час (Czas przyszły)", category: "Дієслова" },
  { id: "verb-aspect", label: "Аспекти дієслів (dokonany/niedokonany)", category: "Дієслова" },
  { id: "verb-imperative", label: "Наказовий спосіб (Tryb rozkazujący)", category: "Дієслова" },
  { id: "verb-conditional", label: "Умовний спосіб (Tryb przypuszczający)", category: "Дієслова" },
  { id: "verb-participle", label: "Дієприкметники", category: "Дієслова" },
  { id: "verb-gerund", label: "Дієприслівники", category: "Дієслова" },
  { id: "verb-conjugation", label: "Дієвідміна", category: "Дієслова" },
  { id: "verb-reflexive", label: "Зворотні дієслова (się)", category: "Дієслова" },

  // Прислівники
  { id: "adv-comparison", label: "Ступені порівняння прислівників", category: "Прислівники" },
  { id: "adv-formation", label: "Творення прислівників", category: "Прислівники" },

  // Числівники
  { id: "num-cardinal", label: "Кількісні числівники", category: "Числівники" },
  { id: "num-ordinal", label: "Порядкові числівники", category: "Числівники" },
  { id: "num-collective", label: "Збірні числівники", category: "Числівники" },

  // Прийменники
  { id: "prep-cases", label: "Прийменники з відмінками", category: "Прийменники" },
  { id: "prep-location", label: "Прийменники місця", category: "Прийменники" },
  { id: "prep-time", label: "Прийменники часу", category: "Прийменники" },

  // Сполучники
  { id: "conj-coordinating", label: "Сурядні сполучники", category: "Сполучники" },
  { id: "conj-subordinating", label: "Підрядні сполучники", category: "Сполучники" },

  // Синтаксис
  { id: "syntax-word-order", label: "Порядок слів у реченні", category: "Синтаксис" },
  { id: "syntax-complex", label: "Складні речення", category: "Синтаксис" },
  { id: "syntax-negation", label: "Заперечення (Negacja)", category: "Синтаксис" },

  // Ортографія
  { id: "ortho-capitalization", label: "Великі та малі літери", category: "Ортографія" },
  { id: "ortho-punctuation", label: "Пунктуація", category: "Ортографія" },
  { id: "ortho-spelling", label: "Правопис", category: "Ортографія" },
  { id: "ortho-diacritics", label: "Діакритичні знаки (ą, ę, ł, ...)", category: "Ортографія" },

  // Словотвір
  { id: "word-prefixes", label: "Префікси", category: "Словотвір" },
  { id: "word-suffixes", label: "Суфікси", category: "Словотвір" },
  { id: "word-compound", label: "Складні слова", category: "Словотвір" },
  { id: "word-diminutives", label: "Зменшувальні форми", category: "Словотвір" },
];

interface GrammarTopicsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTopics: string[];
  onToggleTopic: (topicId: string) => void;
  onClearAll: () => void;
  onSelectAll: () => void;
  maxSelection?: number;
}

export default function GrammarTopicsModal({
  isOpen,
  onClose,
  selectedTopics,
  onToggleTopic,
  onClearAll,
  onSelectAll,
  maxSelection = 5
}: GrammarTopicsModalProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const canSelectMore = selectedTopics.length < maxSelection;

  const filteredTopics = useMemo(() => {
    if (!searchQuery.trim()) return GRAMMAR_TOPICS;
    const query = searchQuery.toLowerCase();
    return GRAMMAR_TOPICS.filter(
      (topic) =>
        topic.label.toLowerCase().includes(query) || topic.category.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const categorizedTopics = useMemo(() => {
    const categories = new Map<string, GrammarTopic[]>();
    for (const topic of filteredTopics) {
      if (!categories.has(topic.category)) {
        categories.set(topic.category, []);
      }
      categories.get(topic.category)!.push(topic);
    }
    return Array.from(categories.entries());
  }, [filteredTopics]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4 backdrop-blur-sm">
      <div className="max-h-[85vh] w-full max-w-3xl overflow-hidden rounded-3xl border border-ink/10 bg-paper shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-ink/10 p-6">
          <div>
            <h3 className="text-2xl font-bold">Граматичні теми</h3>
            <p className="mt-1 text-sm text-ink/60">
              Обрано: {selectedTopics.length} / {maxSelection}
              {selectedTopics.length >= maxSelection && (
                <span className="ml-2 text-terracotta">(максимум досягнуто)</span>
              )}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-ink/40 transition hover:bg-ink/5 hover:text-ink/70"
          >
            <X size={24} />
          </button>
        </div>

        {/* Search */}
        <div className="border-b border-ink/10 p-4">
          <div className="relative">
            <MagnifyingGlass size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Пошук тем..."
              className="w-full rounded-2xl border border-ink/20 bg-paper py-2 pl-12 pr-4 text-sm focus:border-moss/40 focus:outline-none"
            />
          </div>

          <div className="mt-3 flex gap-2">
            <button
              onClick={onSelectAll}
              className="rounded-full border border-ink/20 px-4 py-1.5 text-xs font-semibold text-ink transition hover:bg-ink/5"
            >
              Обрати всі
            </button>
            <button
              onClick={onClearAll}
              className="rounded-full border border-ink/20 px-4 py-1.5 text-xs font-semibold text-ink transition hover:bg-ink/5"
            >
              Скасувати всі
            </button>
          </div>
        </div>

        {/* Topics List */}
        <div className="max-h-[50vh] overflow-y-auto p-6">
          {categorizedTopics.length === 0 ? (
            <p className="text-center text-sm text-ink/60">Нічого не знайдено</p>
          ) : (
            <div className="space-y-6">
              {categorizedTopics.map(([category, topics]) => (
                <div key={category}>
                  <h4 className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-ink/40">
                    {category}
                  </h4>
                  <div className="grid gap-2 md:grid-cols-2">
                    {topics.map((topic) => {
                      const isSelected = selectedTopics.includes(topic.id);
                      const isDisabled = !isSelected && !canSelectMore;
                      return (
                        <button
                          key={topic.id}
                          onClick={() => onToggleTopic(topic.id)}
                          disabled={isDisabled}
                          className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-left text-sm transition ${
                            isSelected
                              ? "border-moss bg-moss/10 text-moss"
                              : isDisabled
                              ? "border-ink/5 bg-ink/5 text-ink/30 cursor-not-allowed"
                              : "border-ink/10 bg-paper/60 text-ink/70 hover:border-ink/20"
                          }`}
                        >
                          <div
                            className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border ${
                              isSelected
                                ? "border-moss bg-moss"
                                : "border-ink/20 bg-paper"
                            }`}
                          >
                            {isSelected && <Check size={14} weight="bold" className="text-paper" />}
                          </div>
                          <span className={isSelected ? "font-medium" : ""}>{topic.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-ink/10 p-6">
          <p className="text-sm text-ink/60">
            {selectedTopics.length > 0
              ? `Обрано ${selectedTopics.length} з ${maxSelection} ${
                  selectedTopics.length === 1
                    ? "теми"
                    : selectedTopics.length < 5
                    ? "тем"
                    : "тем"
                }`
              : `Оберіть до ${maxSelection} граматичних тем для тесту`}
          </p>
          <button
            onClick={onClose}
            className="rounded-full bg-ink px-6 py-2.5 text-sm font-semibold text-paper transition hover:bg-ink/90"
          >
            Готово
          </button>
        </div>
      </div>
    </div>
  );
}
