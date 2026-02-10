"use client";

import { useEffect, useState } from "react";
import { ClockCounterClockwise, TrendUp, Target, Lightning, CaretDown, CheckCircle, XCircle } from "@phosphor-icons/react";
import Loader from "@/components/ui/Loader";

interface ComprehensionQuestion {
  type: "open" | "truefalse" | "multiple" | "short";
  question: { pl: string; uk: string };
  correctAnswer?: boolean;
  options?: { pl: string; uk: string }[];
  correctOptionIndex?: number;
}

interface UserAnswer {
  type: "open" | "truefalse" | "multiple" | "short";
  textValue?: string;
  boolValue?: boolean;
  optionIndex?: number;
}

interface ResultItem {
  questionIndex: number;
  correct: boolean;
  userAnswer: string;
  expectedAnswer?: string;
  feedback: string;
}

interface SuggestedWord {
  lemma: string;
  meaning: string;
  reason: string;
}

interface HistorySession {
  id: string;
  textId: string;
  textTitle: { pl: string; uk: string };
  textLevel: string;
  textTopic: string;
  score: number;
  points: number;
  feedback: string;
  questionsCount: number;
  questions: ComprehensionQuestion[];
  answers: UserAnswer[];
  resultItems: ResultItem[];
  suggestedVocab: SuggestedWord[];
  viewMode: "pl" | "uk" | "dual";
  createdAt: string;
}

interface HistoryStats {
  totalAttempts: number;
  averageScore: number;
  averagePoints: number;
  bestScore: number;
  bestPoints: number;
}

export default function ReadingHistory() {
  const [sessions, setSessions] = useState<HistorySession[]>([]);
  const [stats, setStats] = useState<HistoryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  async function loadHistory() {
    setLoading(true);
    try {
      const res = await fetch("/api/reading/comprehension/history");
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions || []);
        setStats(data.stats);
      }
    } catch (err) {
      console.error("Load history error:", err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-3xl border border-ink/10 bg-paper/80 p-12 shadow-soft text-center">
        <Loader label="Завантаження історії..." />
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="rounded-3xl border border-ink/10 bg-paper/80 p-12 shadow-soft text-center">
        <ClockCounterClockwise size={48} weight="thin" className="mx-auto text-ink/20" />
        <p className="mt-4 text-sm text-ink/60">
          Ще немає збережених результатів.<br />
          Пройдіть перевірку розуміння та збережіть результати!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-moss/20 bg-moss/5 p-4">
            <div className="flex items-center gap-2 text-moss">
              <Lightning size={20} weight="fill" />
              <p className="text-xs uppercase tracking-[0.2em]">Спроб</p>
            </div>
            <p className="mt-2 text-2xl font-bold text-ink">{stats.totalAttempts}</p>
          </div>

          <div className="rounded-2xl border border-gold/20 bg-gold/5 p-4">
            <div className="flex items-center gap-2 text-gold">
              <Target size={20} weight="fill" />
              <p className="text-xs uppercase tracking-[0.2em]">Середній бал</p>
            </div>
            <p className="mt-2 text-2xl font-bold text-ink">
              {stats.averagePoints.toFixed(1)}/10
            </p>
          </div>

          <div className="rounded-2xl border border-terracotta/20 bg-terracotta/5 p-4">
            <div className="flex items-center gap-2 text-terracotta">
              <TrendUp size={20} weight="fill" />
              <p className="text-xs uppercase tracking-[0.2em]">Найкращий</p>
            </div>
            <p className="mt-2 text-2xl font-bold text-ink">{stats.bestPoints}/10</p>
          </div>

          <div className="rounded-2xl border border-ink/20 bg-ink/5 p-4">
            <div className="flex items-center gap-2 text-ink">
              <ClockCounterClockwise size={20} weight="fill" />
              <p className="text-xs uppercase tracking-[0.2em]">Точність</p>
            </div>
            <p className="mt-2 text-2xl font-bold text-ink">
              {Math.round(stats.averageScore * 100)}%
            </p>
          </div>
        </div>
      )}

      {/* History List */}
      <div className="rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft">
        <div className="flex items-center gap-2 mb-6">
          <ClockCounterClockwise size={24} weight="duotone" className="text-ink/60" />
          <h3 className="text-xl font-semibold">Історія перевірок</h3>
        </div>

        <div className="space-y-3">
          {sessions.map((session) => {
            const isExpanded = expandedId === session.id;
            const displayLang = session.viewMode === "uk" ? "uk" : "pl";

            return (
              <div
                key={session.id}
                className="rounded-2xl border border-ink/10 bg-paper/60 p-4 transition hover:border-ink/20 hover:shadow-sm"
              >
                <button
                  onClick={() => setExpandedId(isExpanded ? null : session.id)}
                  className="w-full text-left"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-semibold text-ink">{session.textTitle.uk}</h4>
                        <span className="rounded-full bg-moss/10 px-2 py-0.5 text-xs font-semibold text-moss">
                          {session.textLevel}
                        </span>
                        {session.textTopic && (
                          <span className="rounded-full bg-gold/10 px-2 py-0.5 text-xs font-semibold text-gold">
                            {session.textTopic}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-ink/60">{session.textTitle.pl}</p>
                      <p className="mt-2 text-xs text-ink/50">
                        {new Date(session.createdAt).toLocaleDateString("uk-UA", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </p>
                    </div>

                    <div className="text-right flex items-center gap-3">
                      <div>
                        <div className={`text-2xl font-bold ${
                          session.points >= 8 ? "text-moss" :
                          session.points >= 6 ? "text-gold" :
                          "text-terracotta"
                        }`}>
                          {session.points}/10
                        </div>
                        <p className="text-xs text-ink/50">
                          {session.questionsCount} {session.questionsCount === 1 ? "питання" : "питань"}
                        </p>
                      </div>
                      <CaretDown
                        size={20}
                        className={`text-ink/40 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                      />
                    </div>
                  </div>

                  {session.feedback && !isExpanded && (
                    <p className="mt-3 text-sm text-ink/70 italic border-l-2 border-ink/10 pl-3">
                      {session.feedback}
                    </p>
                  )}
                </button>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="mt-4 space-y-4 border-t border-ink/10 pt-4">
                    {/* Overall Feedback */}
                    <div className="rounded-2xl border border-gold/20 bg-gold/5 p-4">
                      <p className="text-sm font-semibold text-gold">📊 Загальний результат</p>
                      <p className="mt-2 text-sm text-ink/70">{session.feedback}</p>
                    </div>

                    {/* Questions & Answers */}
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink/40 mb-3">
                        Питання та відповіді
                      </p>
                      <div className="space-y-3">
                        {session.questions.map((question, idx) => {
                          const answer = session.answers[idx];
                          const resultItem = session.resultItems.find(r => r.questionIndex === idx);

                          return (
                            <div
                              key={idx}
                              className={`rounded-2xl border p-4 ${
                                resultItem?.correct
                                  ? "border-moss/20 bg-moss/5"
                                  : "border-terracotta/20 bg-terracotta/5"
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                {resultItem?.correct ? (
                                  <CheckCircle size={24} weight="fill" className="text-moss flex-shrink-0 mt-0.5" />
                                ) : (
                                  <XCircle size={24} weight="fill" className="text-terracotta flex-shrink-0 mt-0.5" />
                                )}
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-ink">
                                    {idx + 1}. {question.question[displayLang]}
                                  </p>

                                  {/* Display answer based on type */}
                                  {answer && (
                                    <div className="mt-2">
                                      {answer.type === "open" || answer.type === "short" ? (
                                        <p className="text-sm text-ink/70">
                                          <span className="font-medium">Ваша відповідь:</span> {answer.textValue}
                                        </p>
                                      ) : answer.type === "truefalse" ? (
                                        <p className="text-sm text-ink/70">
                                          <span className="font-medium">Ваша відповідь:</span>{" "}
                                          {answer.boolValue ? "Правда" : "Неправда"}
                                        </p>
                                      ) : answer.type === "multiple" && question.options && answer.optionIndex !== undefined ? (
                                        <p className="text-sm text-ink/70">
                                          <span className="font-medium">Ваша відповідь:</span>{" "}
                                          {question.options[answer.optionIndex]?.[displayLang]}
                                        </p>
                                      ) : null}
                                    </div>
                                  )}

                                  {/* Feedback */}
                                  {resultItem && (
                                    <div className="mt-2">
                                      <p className="text-sm text-ink/70">{resultItem.feedback}</p>
                                      {!resultItem.correct && resultItem.expectedAnswer && (
                                        <p className="mt-1 text-sm text-ink/60">
                                          <span className="font-medium">Очікувана відповідь:</span> {resultItem.expectedAnswer}
                                        </p>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Suggested Vocabulary */}
                    {session.suggestedVocab && session.suggestedVocab.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink/40 mb-3">
                          📚 Рекомендовані слова
                        </p>
                        <div className="space-y-2">
                          {session.suggestedVocab.map((word, idx) => (
                            <div
                              key={idx}
                              className="rounded-2xl border border-ink/10 bg-paper/60 p-3 text-sm"
                            >
                              <div className="flex items-baseline gap-2">
                                <span className="font-semibold text-ink">{word.lemma}</span>
                                <span className="text-ink/40">—</span>
                                <span className="text-ink/70">{word.meaning}</span>
                              </div>
                              <p className="mt-1 text-xs text-ink/50">{word.reason}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
