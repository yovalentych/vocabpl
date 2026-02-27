"use client";

import { useState, useEffect } from "react";
import { CheckCircle, Circle, CaretDown, CaretUp, Lightning, BookOpen, Target, Clock } from "@phosphor-icons/react";
import { renderSimpleMarkdown } from "@/components/markdown";
import type { CompendiumSprint, CompendiumRule } from "@/lib/compendium-content";

interface GrammarInteractiveProps {
  sprints: CompendiumSprint[];
  rules: CompendiumRule[];
  locale: string;
}

type ReadingMode = "quick" | "detailed";
type CompletionState = Set<string>;

const DIFFICULTY_CONFIG = {
  A1: { label: "A1", color: "bg-moss/10 text-moss border-moss/30", emoji: "🌱" },
  A2: { label: "A2", color: "bg-gold/10 text-gold border-gold/30", emoji: "🌿" },
  B1: { label: "B1", color: "bg-terracotta/10 text-terracotta border-terracotta/30", emoji: "🌳" },
  B2: { label: "B2", color: "bg-ink/10 text-ink border-ink/30", emoji: "🎯" },
  C1: { label: "C1", color: "bg-moss/20 text-moss border-moss/40", emoji: "⭐" }
};

export default function GrammarInteractive({ sprints, rules, locale }: GrammarInteractiveProps) {
  const [readingMode, setReadingMode] = useState<ReadingMode>("quick");
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [completedSprints, setCompletedSprints] = useState<CompletionState>(new Set());
  const [completedRules, setCompletedRules] = useState<CompletionState>(new Set());
  const [isClient, setIsClient] = useState(false);

  const pick = (uk: string | undefined, pl: string | undefined) => {
    if (!uk && !pl) return "";
    return (locale === "pl" && pl) ? pl : (uk || pl || "");
  };

  // Load from localStorage on client
  useEffect(() => {
    setIsClient(true);
    try {
      const savedCompletedSprints = localStorage.getItem("grammar_completed_sprints");
      const savedCompletedRules = localStorage.getItem("grammar_completed_rules");
      const savedReadingMode = localStorage.getItem("grammar_reading_mode");

      if (savedCompletedSprints) {
        setCompletedSprints(new Set(JSON.parse(savedCompletedSprints)));
      }
      if (savedCompletedRules) {
        setCompletedRules(new Set(JSON.parse(savedCompletedRules)));
      }
      if (savedReadingMode === "quick" || savedReadingMode === "detailed") {
        setReadingMode(savedReadingMode);
      }
    } catch (error) {
      console.error("Failed to load grammar progress:", error);
    }
  }, []);

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  const toggleSprintCompletion = (id: string) => {
    const newCompleted = new Set(completedSprints);
    if (newCompleted.has(id)) {
      newCompleted.delete(id);
    } else {
      newCompleted.add(id);
    }
    setCompletedSprints(newCompleted);
    if (isClient) {
      try {
        localStorage.setItem("grammar_completed_sprints", JSON.stringify([...newCompleted]));
      } catch (error) {
        console.error("Failed to save sprint completion:", error);
      }
    }
  };

  const toggleRuleCompletion = (id: string) => {
    const newCompleted = new Set(completedRules);
    if (newCompleted.has(id)) {
      newCompleted.delete(id);
    } else {
      newCompleted.add(id);
    }
    setCompletedRules(newCompleted);
    if (isClient) {
      try {
        localStorage.setItem("grammar_completed_rules", JSON.stringify([...newCompleted]));
      } catch (error) {
        console.error("Failed to save rule completion:", error);
      }
    }
  };

  const toggleReadingMode = () => {
    const newMode: ReadingMode = readingMode === "quick" ? "detailed" : "quick";
    setReadingMode(newMode);
    if (isClient) {
      try {
        localStorage.setItem("grammar_reading_mode", newMode);
      } catch (error) {
        console.error("Failed to save reading mode:", error);
      }
    }
  };

  const totalSprintsCompleted = completedSprints.size;
  const totalRulesCompleted = completedRules.size;
  const totalItems = sprints.length + rules.length;
  const totalCompleted = totalSprintsCompleted + totalRulesCompleted;
  const progressPercentage = totalItems > 0 ? Math.round((totalCompleted / totalItems) * 100) : 0;

  return (
    <div className="space-y-10">
      {/* Reading Mode Toggle + Progress */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl border border-ink/10 bg-paper/60">
        <div className="flex items-center gap-4">
          <button
            onClick={toggleReadingMode}
            className="inline-flex items-center gap-2 rounded-full border border-ink/20 bg-paper px-4 py-2 text-sm font-semibold text-ink hover:border-moss/40 hover:bg-moss/5 transition-all"
          >
            {readingMode === "quick" ? (
              <>
                <Lightning size={16} weight="fill" className="text-gold" />
                <span>{locale === "uk" ? "Швидкий огляд" : "Szybki przegląd"}</span>
              </>
            ) : (
              <>
                <BookOpen size={16} weight="fill" className="text-moss" />
                <span>{locale === "uk" ? "Детальне вивчення" : "Szczegółowa nauka"}</span>
              </>
            )}
          </button>

          <div className="text-xs text-ink/60">
            {readingMode === "quick"
              ? (locale === "uk" ? "Основна інформація" : "Podstawowe informacje")
              : (locale === "uk" ? "Повний контент + приклади" : "Pełna treść + przykłady")}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Target size={18} className="text-moss" weight="fill" />
          <div className="text-sm">
            <span className="font-bold text-moss">{totalCompleted}</span>
            <span className="text-ink/60"> / {totalItems}</span>
            <span className="ml-2 text-xs text-ink/50">({progressPercentage}%)</span>
          </div>
        </div>
      </div>

      {/* Sprints Section */}
      <section>
        <h2 className="text-2xl font-bold text-ink mb-6 flex items-center gap-3">
          <div className="h-1 w-12 rounded-full bg-gradient-to-r from-moss to-moss/20" />
          {locale === "uk" ? "Спринти" : "Sprinty"}
          <span className="text-sm font-normal text-ink/50">
            ({totalSprintsCompleted}/{sprints.length})
          </span>
        </h2>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {sprints.map((sprint) => {
            const isExpanded = expandedItems.has(sprint.id);
            const isCompleted = completedSprints.has(sprint.id);
            const difficulty = sprint.difficulty ? DIFFICULTY_CONFIG[sprint.difficulty] : null;

            return (
              <div
                key={sprint.id}
                id={`sprint-${sprint.id}`}
                className={`group rounded-[24px] border transition-all duration-300 ${
                  isCompleted
                    ? "border-moss/40 bg-gradient-to-br from-moss/10 to-moss/5 shadow-md"
                    : "border-moss/20 bg-gradient-to-br from-moss/5 to-paper shadow-soft hover:shadow-lg hover:border-moss/40"
                }`}
              >
                {/* Header */}
                <div className="p-6 pb-4">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <h3 className="text-lg font-bold text-ink flex-1">
                      {pick(sprint.titleUk, sprint.titlePl)}
                    </h3>

                    <button
                      onClick={() => toggleSprintCompletion(sprint.id)}
                      className="flex-shrink-0 transition-transform hover:scale-110"
                      title={isCompleted ? (locale === "uk" ? "Позначити невивченим" : "Oznacz jako nieprzeczytane") : (locale === "uk" ? "Позначити вивченим" : "Oznacz jako przeczytane")}
                    >
                      {isCompleted ? (
                        <CheckCircle size={24} weight="fill" className="text-moss" />
                      ) : (
                        <Circle size={24} className="text-ink/30 group-hover:text-moss/50" />
                      )}
                    </button>
                  </div>

                  <div className="flex items-center gap-2 mb-3">
                    {difficulty && (
                      <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-semibold ${difficulty.color}`}>
                        <span>{difficulty.emoji}</span>
                        {difficulty.label}
                      </span>
                    )}
                    {sprint.estimatedMinutes && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-ink/10 bg-paper/60 px-2 py-1 text-xs text-ink/60">
                        <Clock size={12} />
                        {sprint.estimatedMinutes} {locale === "uk" ? "хв" : "min"}
                      </span>
                    )}
                  </div>

                  <div className="text-sm text-ink/70 leading-relaxed prose prose-sm prose-ul:pl-0 prose-li:pl-0 mb-3">
                    {renderSimpleMarkdown(pick(sprint.hintUk, sprint.hintPl))}
                  </div>
                </div>

                {/* Expandable Content */}
                {readingMode === "detailed" && (sprint.detailedUk || sprint.detailedPl || sprint.examplesUk || sprint.examplesPl) && (
                  <div className="border-t border-moss/10">
                    <button
                      onClick={() => toggleExpanded(sprint.id)}
                      className="w-full flex items-center justify-between gap-2 px-6 py-3 text-sm font-semibold text-moss hover:bg-moss/5 transition-colors"
                    >
                      <span>{isExpanded ? (locale === "uk" ? "Згорнути деталі" : "Zwiń szczegóły") : (locale === "uk" ? "Розгорнути деталі" : "Rozwiń szczegóły")}</span>
                      {isExpanded ? <CaretUp size={16} weight="bold" /> : <CaretDown size={16} weight="bold" />}
                    </button>

                    {isExpanded && (
                      <div className="px-6 pb-6 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                        {/* Detailed Explanation */}
                        {(sprint.detailedUk || sprint.detailedPl) && (
                          <div>
                            <h4 className="text-xs uppercase tracking-[0.2em] text-ink/50 font-semibold mb-2">
                              {locale === "uk" ? "Детально" : "Szczegółowo"}
                            </h4>
                            <p className="text-sm text-ink/70 leading-relaxed">
                              {pick(sprint.detailedUk, sprint.detailedPl)}
                            </p>
                          </div>
                        )}

                        {/* Examples */}
                        {((sprint.examplesUk && sprint.examplesUk.length > 0) || (sprint.examplesPl && sprint.examplesPl.length > 0)) && (
                          <div>
                            <h4 className="text-xs uppercase tracking-[0.2em] text-ink/50 font-semibold mb-2">
                              {locale === "uk" ? "Приклади" : "Przykłady"}
                            </h4>
                            <ul className="space-y-2">
                              {(locale === "uk" ? sprint.examplesUk : sprint.examplesPl)?.map((example, idx) => (
                                <li key={idx} className="text-sm text-ink/70 leading-relaxed prose prose-sm">
                                  {renderSimpleMarkdown(example)}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Common Mistakes */}
                        {(sprint.commonMistakesUk || sprint.commonMistakesPl) && (
                          <div className="rounded-xl border border-terracotta/20 bg-terracotta/5 p-3">
                            <h4 className="text-xs uppercase tracking-[0.2em] text-terracotta font-semibold mb-2">
                              {locale === "uk" ? "Типові помилки" : "Częste błędy"}
                            </h4>
                            <div className="text-sm text-ink/70 leading-relaxed prose prose-sm">
                              {renderSimpleMarkdown(pick(sprint.commonMistakesUk, sprint.commonMistakesPl))}
                            </div>
                          </div>
                        )}

                        {/* Tips */}
                        {(sprint.tipsUk || sprint.tipsPl) && (
                          <div className="rounded-xl border border-gold/20 bg-gold/5 p-3">
                            <h4 className="text-xs uppercase tracking-[0.2em] text-gold font-semibold mb-2">
                              {locale === "uk" ? "Поради" : "Wskazówki"}
                            </h4>
                            <div className="text-sm text-ink/70 leading-relaxed prose prose-sm">
                              {renderSimpleMarkdown(pick(sprint.tipsUk, sprint.tipsPl))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Rules Section */}
      <section>
        <h2 className="text-2xl font-bold text-ink mb-6 flex items-center gap-3">
          <div className="h-1 w-12 rounded-full bg-gradient-to-r from-gold to-gold/20" />
          {locale === "uk" ? "Детальні правила" : "Szczegółowe reguły"}
          <span className="text-sm font-normal text-ink/50">
            ({totalRulesCompleted}/{rules.length})
          </span>
        </h2>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rules.map((rule) => {
            const isExpanded = expandedItems.has(rule.id);
            const isCompleted = completedRules.has(rule.id);
            const difficulty = rule.difficulty ? DIFFICULTY_CONFIG[rule.difficulty] : null;

            return (
              <article
                key={rule.id}
                className={`rounded-[24px] border transition-all duration-300 ${
                  isCompleted
                    ? "border-gold/40 bg-gradient-to-br from-gold/10 to-gold/5 shadow-md"
                    : "border-ink/10 bg-paper/80 shadow-soft hover:shadow-md hover:border-gold/30"
                }`}
              >
                {/* Header */}
                <div className="p-5 pb-3">
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2 flex-1">
                      <button
                        onClick={() => toggleRuleCompletion(rule.id)}
                        className="flex-shrink-0 transition-transform hover:scale-110"
                        title={isCompleted ? (locale === "uk" ? "Позначити невивченим" : "Oznacz jako nieprzeczytane") : (locale === "uk" ? "Позначити вивченим" : "Oznacz jako przeczytane")}
                      >
                        {isCompleted ? (
                          <CheckCircle size={20} weight="fill" className="text-gold" />
                        ) : (
                          <Circle size={20} className="text-ink/30 hover:text-gold/50" />
                        )}
                      </button>
                      <h3 className="text-sm font-bold text-ink uppercase tracking-wide">
                        {pick(rule.titleUk, rule.titlePl)}
                      </h3>
                    </div>
                    {difficulty && (
                      <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold ${difficulty.color}`}>
                        {difficulty.emoji} {difficulty.label}
                      </span>
                    )}
                  </div>

                  <div className="text-sm text-ink/70 leading-relaxed prose prose-sm prose-strong:text-moss prose-strong:font-semibold">
                    {renderSimpleMarkdown(pick(rule.bodyUk, rule.bodyPl))}
                  </div>
                </div>

                {/* Expandable Content */}
                {readingMode === "detailed" && (rule.detailedUk || rule.detailedPl || rule.examplesUk || rule.examplesPl) && (
                  <div className="border-t border-ink/10">
                    <button
                      onClick={() => toggleExpanded(rule.id)}
                      className="w-full flex items-center justify-between gap-2 px-5 py-2.5 text-xs font-semibold text-gold hover:bg-gold/5 transition-colors"
                    >
                      <span>{isExpanded ? (locale === "uk" ? "Згорнути" : "Zwiń") : (locale === "uk" ? "Розгорнути" : "Rozwiń")}</span>
                      {isExpanded ? <CaretUp size={14} weight="bold" /> : <CaretDown size={14} weight="bold" />}
                    </button>

                    {isExpanded && (
                      <div className="px-5 pb-5 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                        {/* Detailed */}
                        {(rule.detailedUk || rule.detailedPl) && (
                          <div>
                            <h4 className="text-xs uppercase tracking-[0.2em] text-ink/50 font-semibold mb-1.5">
                              {locale === "uk" ? "Детально" : "Szczegółowo"}
                            </h4>
                            <p className="text-xs text-ink/70 leading-relaxed">
                              {pick(rule.detailedUk, rule.detailedPl)}
                            </p>
                          </div>
                        )}

                        {/* Examples */}
                        {((rule.examplesUk && rule.examplesUk.length > 0) || (rule.examplesPl && rule.examplesPl.length > 0)) && (
                          <div>
                            <h4 className="text-xs uppercase tracking-[0.2em] text-ink/50 font-semibold mb-1.5">
                              {locale === "uk" ? "Приклади" : "Przykłady"}
                            </h4>
                            <ul className="space-y-1.5">
                              {(locale === "uk" ? rule.examplesUk : rule.examplesPl)?.map((example, idx) => (
                                <li key={idx} className="text-xs text-ink/70 leading-relaxed prose prose-xs">
                                  {renderSimpleMarkdown(example)}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Counter Examples */}
                        {((rule.counterExamplesUk && rule.counterExamplesUk.length > 0) || (rule.counterExamplesPl && rule.counterExamplesPl.length > 0)) && (
                          <div className="rounded-lg border border-terracotta/20 bg-terracotta/5 p-2.5">
                            <h4 className="text-xs uppercase tracking-[0.2em] text-terracotta font-semibold mb-1.5">
                              {locale === "uk" ? "Не робити так" : "Nie rób tak"}
                            </h4>
                            <ul className="space-y-1">
                              {(locale === "uk" ? rule.counterExamplesUk : rule.counterExamplesPl)?.map((example, idx) => (
                                <li key={idx} className="text-xs text-ink/70 leading-relaxed prose prose-xs">
                                  {renderSimpleMarkdown(example)}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Mnemonic */}
                        {(rule.mnemonicUk || rule.mnemonicPl) && (
                          <div className="rounded-lg border border-moss/20 bg-moss/5 p-2.5">
                            <h4 className="text-xs uppercase tracking-[0.2em] text-moss font-semibold mb-1.5">
                              {locale === "uk" ? "Запам'ятай" : "Zapamiętaj"}
                            </h4>
                            <div className="text-xs text-ink/70 leading-relaxed prose prose-xs">
                              {renderSimpleMarkdown(pick(rule.mnemonicUk, rule.mnemonicPl))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
