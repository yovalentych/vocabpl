"use client";

import { useState, useEffect } from "react";
import { Lightning, Sparkle, TrendUp } from "@phosphor-icons/react";

interface GrammarSidebarProps {
  sprints: Array<{ id: string; titleUk: string; titlePl: string }>;
  totalTopics: number;
  locale: string;
  focusTitle: string;
  focusRule1: string;
  focusRule2: string;
  focusRule3: string;
  sprintsLabel: string;
  focusLabel: string;
}

export default function GrammarSidebar({
  sprints,
  totalTopics,
  locale,
  focusTitle,
  focusRule1,
  focusRule2,
  focusRule3,
  sprintsLabel,
  focusLabel
}: GrammarSidebarProps) {
  const [completedSprints, setCompletedSprints] = useState<Set<string>>(new Set());
  const [completedRules, setCompletedRules] = useState<Set<string>>(new Set());
  const [isClient, setIsClient] = useState(false);

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
      console.error("Failed to load progress:", error);
    }
  }, []);

  // Listen for storage changes from GrammarInteractive
  useEffect(() => {
    if (!isClient) return;

    const handleStorageChange = () => {
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
        console.error("Failed to update progress:", error);
      }
    };

    // Poll for changes every second (simple approach)
    const interval = setInterval(handleStorageChange, 1000);

    return () => clearInterval(interval);
  }, [isClient]);

  const totalCompleted = completedSprints.size + completedRules.size;
  const progressPercentage = totalTopics > 0 ? Math.round((totalCompleted / totalTopics) * 100) : 0;

  return (
    <aside className="lg:sticky lg:top-6 lg:self-start">
      <div className="rounded-[28px] border border-ink/10 bg-paper/80 p-6 shadow-soft">
        {/* Navigation */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Lightning size={16} className="text-moss" weight="fill" />
            <h3 className="text-xs uppercase tracking-[0.3em] text-ink/50 font-semibold">
              {sprintsLabel}
            </h3>
          </div>

          <nav className="space-y-2">
            {sprints.map((sprint, idx) => {
              const isCompleted = completedSprints.has(sprint.id);
              return (
                <a
                  key={sprint.id}
                  href={`#sprint-${sprint.id}`}
                  className={`flex items-center gap-3 rounded-xl border px-3 py-2 text-sm transition-all group ${
                    isCompleted
                      ? "border-moss/30 bg-moss/10 text-moss"
                      : "border-ink/10 bg-paper/60 text-ink/70 hover:border-moss/30 hover:bg-moss/5 hover:text-moss"
                  }`}
                >
                  <span className={`flex h-6 w-6 items-center justify-center rounded-full border text-xs font-semibold transition-all ${
                    isCompleted
                      ? "border-moss/40 bg-moss/20 text-moss"
                      : "border-ink/20 bg-paper text-ink/50 group-hover:border-moss/40 group-hover:bg-moss/10 group-hover:text-moss"
                  }`}>
                    {idx + 1}
                  </span>
                  <span className="font-medium">
                    {locale === "uk" ? sprint.titleUk : sprint.titlePl}
                  </span>
                </a>
              );
            })}
          </nav>
        </div>

        {/* Progress */}
        <div className="rounded-2xl border border-moss/20 bg-moss/5 p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs uppercase tracking-[0.2em] text-ink/50 font-semibold flex items-center gap-1.5">
              <TrendUp size={14} className="text-moss" weight="bold" />
              {locale === "uk" ? "Прогрес" : "Postęp"}
            </span>
            <span className="text-sm font-bold text-moss">{progressPercentage}%</span>
          </div>
          <div className="h-2 rounded-full bg-ink/10 overflow-hidden mb-3">
            <div
              className="h-full bg-moss transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <p className="text-xs text-ink/60">
            <span className="font-semibold text-moss">{totalCompleted}</span>
            {" / "}
            {totalTopics}
            {" "}
            {locale === "uk" ? "тем завершено" : "tematów ukończonych"}
          </p>
        </div>

        {/* Focus Tips */}
        <div className="rounded-2xl border border-gold/20 bg-gold/5 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Sparkle size={14} className="text-gold" weight="fill" />
            <h4 className="text-xs uppercase tracking-[0.2em] text-ink/50 font-semibold">
              {focusLabel}
            </h4>
          </div>
          <p className="text-xs font-semibold text-ink mb-2">{focusTitle}</p>
          <ul className="space-y-1 text-xs text-ink/60">
            <li>→ {focusRule1}</li>
            <li>→ {focusRule2}</li>
            <li>→ {focusRule3}</li>
          </ul>
        </div>
      </div>
    </aside>
  );
}
