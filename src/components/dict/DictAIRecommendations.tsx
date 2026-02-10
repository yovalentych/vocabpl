"use client";

import { useState } from "react";
import { Sparkle, ArrowRight } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import type { Route } from "next";

interface RecommendedWord {
  word: string;
  translation: string;
  reason: string;
  category: string;
  priority: "high" | "medium" | "low";
}

interface DictAIRecommendationsProps {
  learnedWords: string[];
  level: "A1" | "A2" | "B1" | "B2";
}

export default function DictAIRecommendations({
  learnedWords,
  level
}: DictAIRecommendationsProps) {
  const router = useRouter();
  const [recommendations, setRecommendations] = useState<RecommendedWord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generated, setGenerated] = useState(false);

  async function generateRecommendations() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "word_recommendations",
          userInput: JSON.stringify({
            learnedWords: learnedWords.slice(0, 20), // Limit to avoid too large payload
            level,
            count: 5,
            context: "General vocabulary expansion"
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
        setError(message);
        return;
      }

      const result = JSON.parse(data.text || "{}");
      setRecommendations(result.recommendations || []);
      setGenerated(true);
    } catch (err) {
      console.error("Failed to generate recommendations:", err);
      setError("Помилка мережі");
    } finally {
      setLoading(false);
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-terracotta/10 border-terracotta/20 text-terracotta";
      case "medium":
        return "bg-gold/10 border-gold/20 text-gold";
      case "low":
        return "bg-moss/10 border-moss/20 text-moss";
      default:
        return "bg-ink/10 border-ink/20 text-ink";
    }
  };

  return (
    <div className="rounded-3xl border border-moss/20 bg-moss/5 p-6 shadow-soft">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Sparkle size={24} weight="fill" className="text-moss" />
            <h3 className="text-xl font-semibold text-ink">
              AI рекомендує вивчити
            </h3>
          </div>
          <p className="mt-2 text-sm text-ink/60">
            На основі твого рівня ({level}) та прогресу
          </p>
        </div>

        {!generated && (
          <button
            onClick={generateRecommendations}
            disabled={loading}
            className="rounded-full bg-moss px-4 py-2 text-sm font-semibold text-paper transition hover:bg-moss/90 disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-paper/20 border-t-paper" />
                Генерація...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Sparkle size={16} weight="fill" />
                Згенерувати
              </span>
            )}
          </button>
        )}
      </div>

      {error && (
        <div className="mt-4 rounded-2xl border border-terracotta/20 bg-terracotta/5 p-4">
          <p className="text-sm text-terracotta">{error}</p>
          <button
            onClick={generateRecommendations}
            className="mt-2 rounded-full border border-terracotta/20 px-3 py-1 text-xs font-semibold text-terracotta hover:bg-terracotta/10"
          >
            Спробувати знову
          </button>
        </div>
      )}

      {generated && recommendations.length > 0 && (
        <div className="mt-6 space-y-3">
          {recommendations.map((rec, idx) => (
            <div
              key={idx}
              className="group rounded-2xl border border-ink/10 bg-paper/95 p-4 transition hover:border-moss/30 hover:bg-paper hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-lg font-semibold text-ink">{rec.word}</p>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${getPriorityColor(
                        rec.priority
                      )}`}
                    >
                      {rec.priority === "high"
                        ? "Пріоритет"
                        : rec.priority === "medium"
                          ? "Рекоменд."
                          : "Опціонально"}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-ink/70">{rec.translation}</p>
                  <p className="mt-2 text-xs text-ink/50">{rec.reason}</p>
                  {rec.category && (
                    <span className="mt-2 inline-block rounded-full bg-ink/5 px-2 py-1 text-[10px] font-medium text-ink/60">
                      {rec.category}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => router.push(`/class/dict/browse?search=${encodeURIComponent(rec.word)}` as Route)}
                  className="rounded-full border border-ink/10 p-2 opacity-0 transition hover:bg-moss/10 hover:border-moss/20 group-hover:opacity-100"
                  aria-label="Перейти до слова"
                >
                  <ArrowRight size={16} className="text-moss" />
                </button>
              </div>
            </div>
          ))}

          <button
            onClick={generateRecommendations}
            disabled={loading}
            className="w-full rounded-2xl border border-ink/10 bg-paper/50 py-3 text-sm font-semibold text-ink transition hover:bg-paper hover:border-moss/20"
          >
            <span className="flex items-center justify-center gap-2">
              <Sparkle size={16} weight="fill" className="text-moss" />
              Згенерувати нові рекомендації
            </span>
          </button>
        </div>
      )}

      {generated && recommendations.length === 0 && !error && (
        <div className="mt-4 text-center">
          <p className="text-sm text-ink/60">
            Не вдалося згенерувати рекомендації. Спробуй пізніше.
          </p>
        </div>
      )}
    </div>
  );
}
