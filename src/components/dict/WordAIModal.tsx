"use client";

import { useState } from "react";
import { X, Sparkle, Lightbulb } from "@phosphor-icons/react";
import { Word } from "@/lib/types";

interface Example {
  sentence: string;
  translation: string;
  difficulty: "easy" | "medium" | "hard";
}

interface GrammarExplanation {
  type: string;
  usage: string;
  notes: string;
  forms: string[];
  examples: string[];
}

interface WordAIModalProps {
  word: Word;
  isOpen: boolean;
  onClose: () => void;
}

export default function WordAIModal({ word, isOpen, onClose }: WordAIModalProps) {
  const [activeTab, setActiveTab] = useState<"examples" | "grammar">("examples");
  const [examples, setExamples] = useState<Example[]>([]);
  const [grammar, setGrammar] = useState<GrammarExplanation | null>(null);
  const [loadingExamples, setLoadingExamples] = useState(false);
  const [loadingGrammar, setLoadingGrammar] = useState(false);
  const [errorExamples, setErrorExamples] = useState<string | null>(null);
  const [errorGrammar, setErrorGrammar] = useState<string | null>(null);

  async function generateExamples() {
    if (examples.length > 0) return; // Already generated

    setLoadingExamples(true);
    setErrorExamples(null);

    try {
      const response = await fetch("/api/ai/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "word_examples",
          userInput: JSON.stringify({
            word: word.pl,
            wordType: word.pos || "unknown",
            level: "A2",
            count: 5
          })
        })
      });

      const data = await response.json();

      if (!response.ok) {
        const errorCode = data?.code;
        const message =
          errorCode === "ai_quota"
            ? "Ліміт AI кредитів вичерпано"
            : errorCode === "pvs_unavailable"
              ? "Потрібен AI план"
              : data?.error || "Помилка генерації";
        setErrorExamples(message);
        return;
      }

      const result = JSON.parse(data.text || "{}");
      setExamples(result.examples || []);
    } catch (err) {
      console.error("Failed to generate examples:", err);
      setErrorExamples("Помилка мережі");
    } finally {
      setLoadingExamples(false);
    }
  }

  async function generateGrammar() {
    if (grammar) return; // Already generated

    setLoadingGrammar(true);
    setErrorGrammar(null);

    try {
      const response = await fetch("/api/ai/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "word_grammar",
          userInput: JSON.stringify({
            word: word.pl,
            wordType: word.pos || "unknown",
            level: "A2"
          })
        })
      });

      const data = await response.json();

      if (!response.ok) {
        const errorCode = data?.code;
        const message =
          errorCode === "ai_quota"
            ? "Ліміт AI кредитів вичерпано"
            : errorCode === "pvs_unavailable"
              ? "Потрібен AI план"
              : data?.error || "Помилка генерації";
        setErrorGrammar(message);
        return;
      }

      const result = JSON.parse(data.text || "{}");
      setGrammar(result.explanation || null);
    } catch (err) {
      console.error("Failed to generate grammar:", err);
      setErrorGrammar("Помилка мережі");
    } finally {
      setLoadingGrammar(false);
    }
  }

  // Auto-generate when tab changes
  const handleTabChange = (tab: "examples" | "grammar") => {
    setActiveTab(tab);
    if (tab === "examples" && examples.length === 0 && !loadingExamples) {
      generateExamples();
    } else if (tab === "grammar" && !grammar && !loadingGrammar) {
      generateGrammar();
    }
  };

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "ЛЕГКО";
      case "medium":
        return "СЕРЕДНЬО";
      case "hard":
        return "ВАЖКО";
      default:
        return difficulty.toUpperCase();
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "bg-moss/10 border-moss/20 text-moss";
      case "medium":
        return "bg-gold/10 border-gold/20 text-gold";
      case "hard":
        return "bg-terracotta/10 border-terracotta/20 text-terracotta";
      default:
        return "bg-ink/10 border-ink/20 text-ink";
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[85vh] overflow-hidden rounded-[32px] border border-ink/10 bg-gradient-to-br from-paper via-paper/98 to-moss/5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-ink/10 bg-paper/95 backdrop-blur-sm px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <p className="text-[10px] uppercase tracking-[0.3em] text-ink/40">
                {word.pos === "verb" ? "ДІЄСЛОВО" :
                 word.pos === "adjective" ? "ПРИКМЕТНИК" :
                 word.pos === "noun" ? "ІМЕННИК" : "СЛОВО"}
              </p>
              <h2 className="mt-2 text-3xl font-bold text-ink">{word.pl}</h2>
              <p className="mt-1 text-lg text-ink/60">{word.uk}</p>
            </div>

            <button
              onClick={onClose}
              className="rounded-full border border-ink/20 p-2 text-ink/60 transition hover:border-ink/30 hover:bg-ink/5 hover:text-ink"
              aria-label="Закрити"
            >
              <X size={20} weight="bold" />
            </button>
          </div>

          {/* Tabs */}
          <div className="mt-5 flex gap-3">
            <button
              onClick={() => handleTabChange("examples")}
              className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition ${
                activeTab === "examples"
                  ? "bg-ink text-paper shadow-soft"
                  : "border border-ink/20 text-ink/70 hover:border-ink/30 hover:bg-ink/5"
              }`}
            >
              <Sparkle size={16} weight="fill" />
              AI приклади
            </button>
            <button
              onClick={() => handleTabChange("grammar")}
              className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition ${
                activeTab === "grammar"
                  ? "bg-gold text-paper shadow-soft"
                  : "border border-ink/20 text-ink/70 hover:border-ink/30 hover:bg-ink/5"
              }`}
            >
              <Lightbulb size={16} weight="fill" />
              AI граматика
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-6" style={{ maxHeight: "calc(85vh - 180px)" }}>
          {activeTab === "examples" && (
            <div className="space-y-4">
              {loadingExamples && (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-moss border-t-transparent" />
                    <p className="text-sm text-ink/60">Генеруємо приклади...</p>
                  </div>
                </div>
              )}

              {errorExamples && (
                <div className="rounded-2xl border border-terracotta/20 bg-terracotta/5 p-4">
                  <p className="text-sm text-terracotta">{errorExamples}</p>
                  <button
                    onClick={generateExamples}
                    className="mt-2 rounded-full border border-terracotta/20 px-3 py-1 text-xs font-semibold text-terracotta hover:bg-terracotta/10"
                  >
                    Спробувати знову
                  </button>
                </div>
              )}

              {!loadingExamples && !errorExamples && examples.length === 0 && (
                <div className="py-12 text-center">
                  <p className="text-sm text-ink/60">Приклади з&apos;являться тут</p>
                </div>
              )}

              {examples.map((example, idx) => (
                <div
                  key={idx}
                  className="group rounded-3xl border border-ink/10 bg-paper/80 p-5 shadow-soft transition hover:border-moss/20 hover:bg-paper hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <p className="flex-1 text-base font-medium text-ink leading-relaxed">
                      {example.sentence}
                    </p>
                    <span
                      className={`shrink-0 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${getDifficultyColor(
                        example.difficulty
                      )}`}
                    >
                      {getDifficultyLabel(example.difficulty)}
                    </span>
                  </div>
                  <p className="text-sm text-ink/60 leading-relaxed">
                    {example.translation}
                  </p>
                </div>
              ))}
            </div>
          )}

          {activeTab === "grammar" && (
            <div className="space-y-5">
              {loadingGrammar && (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-gold border-t-transparent" />
                    <p className="text-sm text-ink/60">Генеруємо пояснення...</p>
                  </div>
                </div>
              )}

              {errorGrammar && (
                <div className="rounded-2xl border border-terracotta/20 bg-terracotta/5 p-4">
                  <p className="text-sm text-terracotta">{errorGrammar}</p>
                  <button
                    onClick={generateGrammar}
                    className="mt-2 rounded-full border border-terracotta/20 px-3 py-1 text-xs font-semibold text-terracotta hover:bg-terracotta/10"
                  >
                    Спробувати знову
                  </button>
                </div>
              )}

              {!loadingGrammar && !errorGrammar && !grammar && (
                <div className="py-12 text-center">
                  <p className="text-sm text-ink/60">Граматичні пояснення з&apos;являться тут</p>
                </div>
              )}

              {grammar && (
                <div className="space-y-5">
                  {/* Type */}
                  {grammar.type && (
                    <div className="rounded-3xl border border-gold/20 bg-gold/5 p-5">
                      <p className="text-xs uppercase tracking-[0.3em] text-gold/80 font-semibold mb-2">
                        ТИП
                      </p>
                      <p className="text-base text-ink">{grammar.type}</p>
                    </div>
                  )}

                  {/* Usage */}
                  {grammar.usage && (
                    <div className="rounded-3xl border border-ink/10 bg-paper/80 p-5">
                      <p className="text-xs uppercase tracking-[0.3em] text-ink/40 font-semibold mb-2">
                        ВИКОРИСТАННЯ
                      </p>
                      <p className="text-sm text-ink/80 leading-relaxed">{grammar.usage}</p>
                    </div>
                  )}

                  {/* Notes */}
                  {grammar.notes && (
                    <div className="rounded-3xl border border-moss/20 bg-moss/5 p-5">
                      <p className="text-xs uppercase tracking-[0.3em] text-moss/80 font-semibold mb-2">
                        ПРИМІТКИ
                      </p>
                      <p className="text-sm text-ink/80 leading-relaxed">{grammar.notes}</p>
                    </div>
                  )}

                  {/* Forms */}
                  {grammar.forms && grammar.forms.length > 0 && (
                    <div className="rounded-3xl border border-ink/10 bg-paper/80 p-5">
                      <p className="text-xs uppercase tracking-[0.3em] text-ink/40 font-semibold mb-3">
                        ФОРМИ
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {grammar.forms.map((form, idx) => (
                          <span
                            key={idx}
                            className="rounded-full border border-ink/20 bg-paper px-3 py-1.5 text-sm text-ink"
                          >
                            {form}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Examples */}
                  {grammar.examples && grammar.examples.length > 0 && (
                    <div className="rounded-3xl border border-ink/10 bg-paper/80 p-5">
                      <p className="text-xs uppercase tracking-[0.3em] text-ink/40 font-semibold mb-3">
                        ПРИКЛАДИ
                      </p>
                      <ul className="space-y-2">
                        {grammar.examples.map((example, idx) => (
                          <li key={idx} className="flex gap-2 text-sm text-ink/80">
                            <span className="text-moss">•</span>
                            <span className="flex-1">{example}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
