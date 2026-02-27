"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { CheckCircle, Circle, Target, Clock, ArrowRight } from "@phosphor-icons/react";
import { renderSimpleMarkdown } from "@/components/markdown";
import type { CompendiumSprint, CompendiumRule } from "@/lib/compendium-content";

interface GrammarInteractiveProps {
  sprints: CompendiumSprint[];
  rules: CompendiumRule[];
  locale: string;
}

type CompletionState = Set<string>;

const DIFFICULTY_CONFIG = {
  A1: { label: "A1", color: "bg-moss/10 text-moss border-moss/30", emoji: "🌱" },
  A2: { label: "A2", color: "bg-gold/10 text-gold border-gold/30", emoji: "🌿" },
  B1: { label: "B1", color: "bg-terracotta/10 text-terracotta border-terracotta/30", emoji: "🌳" },
  B2: { label: "B2", color: "bg-ink/10 text-ink border-ink/30", emoji: "🎯" },
  C1: { label: "C1", color: "bg-moss/20 text-moss border-moss/40", emoji: "⭐" }
};

export default function GrammarInteractive({ sprints, rules, locale }: GrammarInteractiveProps) {
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

      if (savedCompletedSprints) {
        setCompletedSprints(new Set(JSON.parse(savedCompletedSprints)));
      }
      if (savedCompletedRules) {
        setCompletedRules(new Set(JSON.parse(savedCompletedRules)));
      }
    } catch (error) {
      console.error("Failed to load grammar progress:", error);
    }
  }, []);

  const toggleSprintCompletion = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
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

  const toggleRuleCompletion = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
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

  const totalSprintsCompleted = completedSprints.size;
  const totalRulesCompleted = completedRules.size;
  const totalItems = sprints.length + rules.length;
  const totalCompleted = totalSprintsCompleted + totalRulesCompleted;
  const progressPercentage = totalItems > 0 ? Math.round((totalCompleted / totalItems) * 100) : 0;

  return (
    <div className="space-y-10">
      {/* Progress Info */}
      <div className="rounded-2xl border border-moss/20 bg-gradient-to-br from-moss/5 to-paper p-6 shadow-soft">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-ink mb-1 flex items-center gap-2">
              <Target size={18} className="text-moss" weight="fill" />
              {locale === "uk" ? "Прогрес вивчення" : "Postęp nauki"}
            </h3>
            <p className="text-xs text-ink/60">
              {locale === "uk" ? "Клікай на теми щоб вивчати детально" : "Klikaj tematy aby uczyć się szczegółowo"}
            </p>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-moss">{totalCompleted}</span>
            <span className="text-lg text-ink/60">/ {totalItems}</span>
            <span className="ml-2 rounded-full bg-moss/10 px-3 py-1 text-sm font-semibold text-moss">
              {progressPercentage}%
            </span>
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
            const isCompleted = completedSprints.has(sprint.id);
            const difficulty = sprint.difficulty ? DIFFICULTY_CONFIG[sprint.difficulty] : null;

            return (
              <Link
                key={sprint.id}
                href={`/compendium/grammar/${sprint.id}`}
                id={`sprint-${sprint.id}`}
                className={`group rounded-[24px] border transition-all duration-300 block ${
                  isCompleted
                    ? "border-moss/40 bg-gradient-to-br from-moss/10 to-moss/5 shadow-md hover:shadow-lg"
                    : "border-moss/20 bg-gradient-to-br from-moss/5 to-paper shadow-soft hover:shadow-lg hover:border-moss/40"
                }`}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <h3 className="text-lg font-bold text-ink flex-1 group-hover:text-moss transition-colors">
                      {pick(sprint.titleUk, sprint.titlePl)}
                    </h3>

                    <button
                      onClick={(e) => toggleSprintCompletion(sprint.id, e)}
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

                  <div className="text-sm text-ink/70 leading-relaxed prose prose-sm prose-ul:pl-0 prose-li:pl-0 mb-4">
                    {renderSimpleMarkdown(pick(sprint.hintUk, sprint.hintPl))}
                  </div>

                  <div className="flex items-center gap-2 text-sm font-semibold text-moss group-hover:gap-3 transition-all">
                    <span>{locale === "uk" ? "Вивчити тему" : "Ucz się tematu"}</span>
                    <ArrowRight size={16} weight="bold" />
                  </div>
                </div>
              </Link>
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
            const isCompleted = completedRules.has(rule.id);
            const difficulty = rule.difficulty ? DIFFICULTY_CONFIG[rule.difficulty] : null;

            return (
              <Link
                key={rule.id}
                href={`/compendium/grammar/${rule.id}`}
                className={`group rounded-[24px] border transition-all duration-300 block ${
                  isCompleted
                    ? "border-gold/40 bg-gradient-to-br from-gold/10 to-gold/5 shadow-md hover:shadow-lg"
                    : "border-ink/10 bg-paper/80 shadow-soft hover:shadow-md hover:border-gold/30"
                }`}
              >
                <div className="p-5">
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2 flex-1">
                      <button
                        onClick={(e) => toggleRuleCompletion(rule.id, e)}
                        className="flex-shrink-0 transition-transform hover:scale-110"
                        title={isCompleted ? (locale === "uk" ? "Позначити невивченим" : "Oznacz jako nieprzeczytane") : (locale === "uk" ? "Позначити вивченим" : "Oznacz jako przeczytane")}
                      >
                        {isCompleted ? (
                          <CheckCircle size={20} weight="fill" className="text-gold" />
                        ) : (
                          <Circle size={20} className="text-ink/30 hover:text-gold/50" />
                        )}
                      </button>
                      <h3 className="text-sm font-bold text-ink uppercase tracking-wide group-hover:text-gold transition-colors">
                        {pick(rule.titleUk, rule.titlePl)}
                      </h3>
                    </div>
                    {difficulty && (
                      <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold ${difficulty.color}`}>
                        {difficulty.emoji} {difficulty.label}
                      </span>
                    )}
                  </div>

                  <div className="text-sm text-ink/70 leading-relaxed prose prose-sm prose-strong:text-moss prose-strong:font-semibold mb-3">
                    {renderSimpleMarkdown(pick(rule.bodyUk, rule.bodyPl))}
                  </div>

                  <div className="flex items-center gap-2 text-xs font-semibold text-gold group-hover:gap-3 transition-all">
                    <span>{locale === "uk" ? "Детальніше" : "Szczegóły"}</span>
                    <ArrowRight size={14} weight="bold" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
