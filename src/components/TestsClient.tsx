"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { ArrowClockwise, PlayCircle, Sparkle, ClockCounterClockwise } from "@phosphor-icons/react";
import type { Test, TestQuestion } from "@/lib/types";
import TestAIWizard from "./tests/TestAIWizard";

type TabKey = "all" | "inProgress" | "history" | "ai" | "aiHistory";

type TestProgress = {
  testId: string;
  roundQuestionIds: string[];
  answers: Record<string, string | string[]>;
  checked: Record<string, string | string[]>;
  index: number;
  remediationRound: number;
  updatedAt?: string;
};

type TestHistoryEntry = { testId: string; correct: number; total: number; completedAt: string };

type AiHistoryEntry = {
  id: string;
  testTopic: string;
  testLevel: string;
  testFocus: string[];
  questionsCount: number;
  score: number;
  points: number;
  feedback: string;
  createdAt: string;
};

type AiHistoryStats = {
  totalAttempts: number;
  averageScore: number;
  averagePoints: number;
  bestScore: number;
  bestPoints: number;
};

function toAnswerList(value: string | string[] | undefined) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function isMulti(question: TestQuestion) {
  return question.type === "multi" || Array.isArray(question.answer);
}

function isCorrect(question: TestQuestion, value: string | string[] | undefined) {
  const expected = toAnswerList(question.answer as string | string[]);
  const actual = toAnswerList(value);

  if (!expected.length) return false;
  if (actual.length !== expected.length) return false;

  const expectedSet = new Set(expected);
  return actual.every((item) => expectedSet.has(item));
}

export default function TestsClient() {
  const { t, locale } = useLocale();

  const [tests, setTests] = useState<Test[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [tab, setTab] = useState<TabKey>("all");

  const [baseQuestions, setBaseQuestions] = useState<TestQuestion[]>([]);
  const [roundQuestions, setRoundQuestions] = useState<TestQuestion[]>([]);

  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [index, setIndex] = useState(0);

  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [checked, setChecked] = useState<Record<string, string | string[]>>({});

  const [remediationRound, setRemediationRound] = useState(0);

  const [savedProgress, setSavedProgress] = useState<TestProgress | null>(null);
  const [progressMap, setProgressMap] = useState<Record<string, TestProgress | null>>({});

  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const [history, setHistory] = useState<TestHistoryEntry[]>([]);
  const [locked, setLocked] = useState(false);
  const [aiHistory, setAiHistory] = useState<AiHistoryEntry[]>([]);
  const [aiStats, setAiStats] = useState<AiHistoryStats | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // We store a final score snapshot so the "Finished" screen never shows a stale score.
  const [finalScore, setFinalScore] = useState<{ correct: number; total: number } | null>(null);

  // -----------------------------
  // Initial load (tests + history + progress map)
  // -----------------------------
  useEffect(() => {
    let mounted = true;

    async function loadTests() {
      const res = await fetch("/api/tests");
      const data = await res.json().catch(() => ({}));
      if (!mounted) return;

      setTests(data.tests || []);
      setLocked(Boolean(data.locked));

      if (data.tests?.length) {
        setSelectedId((prev) => prev || data.tests[0].id);
      }
    }

    async function loadHistory() {
      const res = await fetch("/api/user/tests/history");
      if (!res.ok) return;
      const data = await res.json();
      if (!mounted) return;
      setHistory(data.testHistory || []);
    }

    async function loadProgressMap() {
      const res = await fetch("/api/user/tests/progress");
      if (!res.ok) return;
      const data = await res.json();
      if (!mounted) return;
      setProgressMap(data.progress || {});
    }

    loadTests();
    loadHistory();
    loadProgressMap();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (tab !== "aiHistory") return;
    let mounted = true;

    async function loadAiHistory() {
      setAiLoading(true);
      const res = await fetch("/api/tests/ai-sessions?limit=30");
      if (!res.ok) {
        setAiLoading(false);
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (!mounted) return;
      setAiHistory(data.sessions || []);
      setAiStats(data.stats || null);
      setAiLoading(false);
    }

    loadAiHistory();

    return () => {
      mounted = false;
    };
  }, [tab]);

  // -----------------------------
  // Load selected test + its saved progress (if any)
  // -----------------------------
  useEffect(() => {
    if (!selectedId) return;

    let mounted = true;

    async function loadTestAndProgress() {
      // reset view state quickly (so UI doesn’t show old question)
      setStarted(false);
      setFinished(false);
      setFinalScore(null);
      setIndex(0);
      setAnswers({});
      setChecked({});
      setRemediationRound(0);
      setSaveStatus("idle");
      setSavedProgress(null);

      // load test questions
      const res = await fetch(`/api/tests?id=${selectedId}`);
      const data = await res.json().catch(() => ({}));
      const list: TestQuestion[] = data.test?.questions || [];

      if (!mounted) return;
      setBaseQuestions(list);
      setRoundQuestions(list);

      // load progress for this test
      const progressRes = await fetch(`/api/user/tests/progress?testId=${selectedId}`);
      if (!mounted) return;

      if (!progressRes.ok) {
        setSavedProgress(null);
        setProgressMap((prev) => ({ ...prev, [selectedId]: null }));
        return;
      }

      const progressData = await progressRes.json().catch(() => ({}));
      const progress = (progressData.progress || null) as TestProgress | null;
      setSavedProgress(progress);
      setProgressMap((prev) => ({ ...prev, [selectedId]: progress }));
    }

    loadTestAndProgress();

    return () => {
      mounted = false;
    };
  }, [selectedId]);

  const selectedTest = useMemo(() => tests.find((test) => test.id === selectedId), [tests, selectedId]);

  const currentQuestion = roundQuestions[index];

  // Score of *current round* (what the user already confirmed via Next/Finish).
  const roundScore = useMemo(() => {
    const correct = roundQuestions.filter((q) => isCorrect(q, checked[q.id])).length;
    return { correct, total: roundQuestions.length };
  }, [checked, roundQuestions]);

  // Score used for display: when finished, show final snapshot; otherwise current round score.
  const score = finished && finalScore ? finalScore : roundScore;
  const percentage = score.total ? Math.round((score.correct / score.total) * 100) : 0;

  // Latest history entry per test (by completedAt)
  const historyLatestMap = useMemo(() => {
    const map = new Map<string, TestHistoryEntry>();
    for (const entry of history) {
      const prev = map.get(entry.testId);
      if (!prev) {
        map.set(entry.testId, entry);
        continue;
      }
      if (new Date(entry.completedAt).getTime() > new Date(prev.completedAt).getTime()) {
        map.set(entry.testId, entry);
      }
    }
    return map;
  }, [history]);

  const progressIds = useMemo(() => new Set(Object.keys(progressMap || {}).filter((id) => !!progressMap[id])), [progressMap]);
  const historyIds = useMemo(() => new Set(history.map((entry) => entry.testId)), [history]);

  // -----------------------------
  // Tabs behavior: show different lists
  // -----------------------------
  const filteredTests = useMemo(() => {
    if (tab === "inProgress") return tests.filter((test) => progressIds.has(test.id));
    if (tab === "history") return tests.filter((test) => historyIds.has(test.id));
    return tests;
  }, [tests, tab, progressIds, historyIds]);

  const listEmptyText = useMemo(() => {
    if (tab === "inProgress") return t.tests.noInProgress;
    if (tab === "history") return t.tests.noHistory;
    return t.tests.noTests;
  }, [tab, t]);

  // -----------------------------
  // Actions
  // -----------------------------
  function handleAnswer(optionId: string) {
    if (!currentQuestion) return;

    if (isMulti(currentQuestion)) {
      setAnswers((prev) => {
        const current = toAnswerList(prev[currentQuestion.id]);
        const next = current.includes(optionId)
          ? current.filter((item) => item !== optionId)
          : [...current, optionId];
        return { ...prev, [currentQuestion.id]: next };
      });
      return;
    }

    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: optionId }));
  }

  function commitCurrentAnswer() {
    if (!currentQuestion) return false;

    const currentAnswer = answers[currentQuestion.id];

    if (isMulti(currentQuestion)) {
      if (!Array.isArray(currentAnswer) || currentAnswer.length === 0) return false;
    } else {
      if (!currentAnswer || Array.isArray(currentAnswer)) return false;
    }

    setChecked((prev) => ({ ...prev, [currentQuestion.id]: currentAnswer }));
    return true;
  }

  function nextQuestion() {
    const ok = commitCurrentAnswer();
    if (!ok) return;
    setIndex((prev) => Math.min(prev + 1, Math.max(roundQuestions.length - 1, 0)));
  }

  async function finishRound() {
    if (!currentQuestion) return;

    const currentAnswer = answers[currentQuestion.id];
    const finalCheckedThisRound: Record<string, string | string[]> = {
      ...checked,
      [currentQuestion.id]: currentAnswer
    };

    const runFinish = async () => {
      // Determine wrong answers in this round
      const wrong = roundQuestions.filter((q) => !isCorrect(q, finalCheckedThisRound[q.id]));

      // If any wrong — remediation round = only wrong questions; reset in-round state.
      if (wrong.length) {
        setRoundQuestions(wrong);
        setIndex(0);
        setAnswers({});
        setChecked({});
        setRemediationRound((prev) => prev + 1);
        setSaveStatus("idle");
        return;
      }

      // Round is complete and all are correct.
      // Snapshot final score as 100% of the *baseQuestions* length (since remediation ensures correctness).
      const total = baseQuestions.length || roundQuestions.length || 0;
      const final = { correct: total, total };
      setFinalScore(final);

      setChecked(finalCheckedThisRound);
      setFinished(true);
      setStarted(false);

      // Save to history
      await fetch("/api/user/tests/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testId: selectedId, correct: total, total })
      }).catch(() => null);

      // Clear saved progress for this test
      await fetch(`/api/user/tests/progress?testId=${selectedId}`, { method: "DELETE" }).catch(() => null);

      setSavedProgress(null);
      setProgressMap((prev) => {
        const next = { ...prev };
        delete next[selectedId];
        return next;
      });

      // Refresh history panel
      const res = await fetch("/api/user/tests/history");
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        setHistory(data.testHistory || []);
      }
    };
    const ok = commitCurrentAnswer();
    if (!ok) return;
    runFinish();
  }

  async function saveProgress(exitAfter: boolean) {
    if (!selectedId || !roundQuestions.length) return;

    setSaveStatus("saving");

    const payload: TestProgress = {
      testId: selectedId,
      roundQuestionIds: roundQuestions.map((q) => q.id),
      answers,
      checked,
      index,
      remediationRound
    };

    const res = await fetch("/api/user/tests/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      setSaveStatus("error");
      return;
    }

    const updatedAt = new Date().toISOString();
    const saved: TestProgress = { ...payload, updatedAt };

    setSavedProgress(saved);
    setProgressMap((prev) => ({ ...prev, [selectedId]: saved }));
    setSaveStatus("saved");

    if (exitAfter) {
      // Exit to overview
      setStarted(false);
      setFinished(false);
      setFinalScore(null);
      setIndex(0);
      setAnswers({});
      setChecked({});
      setRoundQuestions(baseQuestions);
      setRemediationRound(0);
    }
  }

  async function clearSavedProgress() {
    if (!selectedId) return;
    await fetch(`/api/user/tests/progress?testId=${selectedId}`, { method: "DELETE" }).catch(() => null);

    setSavedProgress(null);
    setProgressMap((prev) => {
      const next = { ...prev };
      delete next[selectedId];
      return next;
    });

    setSaveStatus("idle");
  }

  function resumeSavedProgress() {
    if (!savedProgress || !baseQuestions.length) return;

    const map = new Map(baseQuestions.map((q) => [q.id, q]));
    const restoredRound = savedProgress.roundQuestionIds
      .map((id) => map.get(id))
      .filter(Boolean) as TestQuestion[];

    const finalRound = restoredRound.length ? restoredRound : baseQuestions;
    const nextIndex = Math.min(savedProgress.index || 0, Math.max(finalRound.length - 1, 0));

    setRoundQuestions(finalRound);
    setIndex(nextIndex);
    setAnswers(savedProgress.answers || {});
    setChecked(savedProgress.checked || {});
    setRemediationRound(savedProgress.remediationRound || 0);

    setFinished(false);
    setFinalScore(null);
    setStarted(true);
  }

  const canAnswerCurrent = useMemo(() => {
    if (!currentQuestion) return false;
    const v = answers[currentQuestion.id];
    if (isMulti(currentQuestion)) return Array.isArray(v) && v.length > 0;
    return typeof v === "string" && v.length > 0;
  }, [answers, currentQuestion]);

  // -----------------------------
  // UI helpers for the left list depending on tab
  // -----------------------------
  function renderStatusPill(testId: string) {
    const progress = progressMap[testId];
    const historyEntry = historyLatestMap.get(testId);

    const status = progress ? t.tests.inProgress : historyEntry ? t.tests.completed : t.tests.new;

    return (
      <span className="rounded-full border border-ink/10 bg-paper px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-ink/50">
        {status}
      </span>
    );
  }

  function renderRowMeta(testId: string) {
    const progress = progressMap[testId];
    const historyEntry = historyLatestMap.get(testId);

    if (tab === "inProgress") {
      if (!progress) return null;
      return (
        <p className="mt-2 text-xs text-ink/50">
          {t.tests.progress}: {progress.index + 1}/{progress.roundQuestionIds?.length || 0}
        </p>
      );
    }

    if (tab === "history") {
      if (!historyEntry) return null;
      return (
        <p className="mt-2 text-xs text-ink/50">
          {t.tests.lastScore}: {historyEntry.correct}/{historyEntry.total}
        </p>
      );
    }

    // tab === "all"
    if (progress) {
      return (
        <p className="mt-2 text-xs text-ink/50">
          {t.tests.progress}: {progress.index + 1}/{progress.roundQuestionIds?.length || 0}
        </p>
      );
    }
    if (historyEntry) {
      return (
        <p className="mt-2 text-xs text-ink/50">
          {t.tests.lastScore}: {historyEntry.correct}/{historyEntry.total}
        </p>
      );
    }
    return null;
  }

  return (
    <div className="space-y-8">
      {locked && (
        <div className="rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft">
          <h2 className="text-2xl font-semibold">{t.paywall.title}</h2>
          <p className="mt-2 text-sm text-ink/60">{t.paywall.tests}</p>
        </div>
      )}

      <div className={`space-y-6 ${locked ? "pointer-events-none opacity-50" : ""}`}>
        {/* Tabs */}
        <div className="flex flex-wrap gap-2">
          {[
            { id: "all", label: t.tests.tabs.all, icon: null },
            { id: "inProgress", label: t.tests.tabs.inProgress, icon: null },
            { id: "history", label: t.tests.tabs.history, icon: null },
            { id: "ai", label: "AI Тести", icon: <Sparkle size={16} weight="fill" /> },
            { id: "aiHistory", label: "Історія AI", icon: <ClockCounterClockwise size={16} /> }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id as TabKey)}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition ${
                tab === item.id ? "bg-ink text-paper" : "border border-ink/20 text-ink hover:bg-ink/5"
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>

        {/* AI Tests Tab */}
        {tab === "ai" && <TestAIWizard locale={locale} />}

        {/* AI History Tab */}
        {tab === "aiHistory" && (
          <div className="space-y-6">
            <div className="rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.3em] text-ink/40">AI Історія</p>
                <span className="text-xs text-ink/40">{aiHistory.length}</span>
              </div>
              {aiStats && (
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-2xl border border-ink/10 bg-paper/60 p-3">
                    <p className="text-xs text-ink/50">Спроби</p>
                    <p className="text-lg font-semibold">{aiStats.totalAttempts}</p>
                  </div>
                  <div className="rounded-2xl border border-ink/10 bg-paper/60 p-3">
                    <p className="text-xs text-ink/50">Середній бал</p>
                    <p className="text-lg font-semibold">{Math.round(aiStats.averagePoints || 0)}/10</p>
                  </div>
                  <div className="rounded-2xl border border-ink/10 bg-paper/60 p-3">
                    <p className="text-xs text-ink/50">Найкращий бал</p>
                    <p className="text-lg font-semibold">{Math.round(aiStats.bestPoints || 0)}/10</p>
                  </div>
                  <div className="rounded-2xl border border-ink/10 bg-paper/60 p-3">
                    <p className="text-xs text-ink/50">Середній %</p>
                    <p className="text-lg font-semibold">{Math.round((aiStats.averageScore || 0) * 100)}%</p>
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft">
              {aiLoading && (
                <div className="text-sm text-ink/60">Завантаження історії...</div>
              )}
              {!aiLoading && aiHistory.length === 0 && (
                <div className="text-center text-sm text-ink/60">
                  <ClockCounterClockwise size={48} weight="thin" className="mx-auto text-ink/20" />
                  <p className="mt-4">Поки що немає завершених AI тестів.</p>
                </div>
              )}
              {!aiLoading && aiHistory.length > 0 && (
                <div className="space-y-3">
                  {aiHistory.map((entry) => (
                    <div
                      key={entry.id}
                      className="rounded-2xl border border-ink/10 bg-paper/60 p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold">{entry.testTopic}</p>
                          <p className="text-xs text-ink/50">
                            {entry.testLevel} · {entry.questionsCount} питань · {new Date(entry.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <span className="rounded-full border border-ink/10 bg-paper px-3 py-1 text-xs font-semibold text-ink/70">
                          {Math.round(entry.points || 0)}/10
                        </span>
                      </div>
                      {entry.feedback && (
                        <p className="mt-3 text-sm text-ink/70">{entry.feedback}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Static Tests Tabs */}
        {tab !== "ai" && tab !== "aiHistory" && (
        <div className="grid gap-6 lg:grid-cols-[0.35fr_0.65fr]">
          {/* Left list */}
          <div className="rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.3em] text-ink/40">{t.tests.menuTitle}</p>
              <span className="text-xs text-ink/40">{filteredTests.length}</span>
            </div>

            <div className="mt-4 space-y-2">
              {filteredTests.map((test) => (
                <button
                  key={test.id}
                  onClick={() => setSelectedId(test.id)}
                  className={`w-full rounded-2xl border px-4 py-3 text-left ${
                    selectedId === test.id
                      ? "border-ink bg-ink/5"
                      : "border-ink/10 bg-paper/70 hover:border-ink/30"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">{test.title}</p>
                      <p className="text-xs text-ink/50">{test.id}</p>
                    </div>
                    {renderStatusPill(test.id)}
                  </div>

                  {renderRowMeta(test.id)}
                </button>
              ))}

              {!filteredTests.length && <p className="text-sm text-ink/60">{listEmptyText}</p>}
            </div>
          </div>

          {/* Right overview */}
          <div className="space-y-6">
            <div className="rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft">
              <div className="pattern-grid rounded-2xl border border-ink/5 bg-paper/70 p-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-ink/40">{t.tests.title}</p>
                    <h3 className="mt-2 text-2xl font-semibold">{selectedTest?.title || "-"}</h3>
                    <p className="text-sm text-ink/60">{selectedTest?.id || ""}</p>
                  </div>

                  {savedProgress && (
                    <div className="rounded-2xl border border-ink/10 bg-paper/80 px-4 py-3 text-xs text-ink/60">
                      <p className="font-semibold text-ink">{t.tests.savedNotice}</p>
                      <p>
                        {t.tests.saved}
                        {savedProgress.updatedAt
                          ? ` · ${new Date(savedProgress.updatedAt).toLocaleDateString()}`
                          : ""}
                      </p>
                    </div>
                  )}
                </div>

                {/* Actions depend on tab */}
                <div className="mt-4 flex flex-wrap gap-3">
                  {/* In progress tab: emphasize Resume */}
                  {!started && !finished && tab === "inProgress" && (
                    <>
                      {savedProgress ? (
                        <>
                          <button
                            onClick={resumeSavedProgress}
                            className="rounded-full bg-ink px-5 py-2 text-sm font-semibold text-paper"
                            disabled={!tests.length}
                          >
                            <span className="flex items-center gap-2">
                              <PlayCircle size={18} weight="fill" />
                              {t.tests.resume}
                            </span>
                          </button>
                          <button
                            onClick={async () => {
                              await clearSavedProgress();
                              setStarted(true);
                            }}
                            className="rounded-full border border-ink/20 px-5 py-2 text-sm font-semibold text-ink"
                            disabled={!tests.length}
                          >
                            <span className="flex items-center gap-2">
                              <ArrowClockwise size={18} />
                              {t.tests.startOver}
                            </span>
                          </button>
                        </>
                      ) : (
                        <p className="text-sm text-ink/60">{t.tests.noSavedForThisTest}</p>
                      )}
                    </>
                  )}

                  {/* History tab: show quick restart */}
                  {!started && !finished && tab === "history" && (
                    <button
                      onClick={() => {
                        setStarted(true);
                        setFinished(false);
                        setFinalScore(null);
                      }}
                      className="rounded-full bg-ink px-5 py-2 text-sm font-semibold text-paper"
                      disabled={!tests.length}
                    >
                      <span className="flex items-center gap-2">
                        <ArrowClockwise size={18} />
                        {t.tests.restart}
                      </span>
                    </button>
                  )}

                  {/* All tab: normal behavior */}
                  {!started && !finished && tab === "all" && (
                    <>
                      {savedProgress ? (
                        <>
                          <button
                            onClick={resumeSavedProgress}
                            className="rounded-full bg-ink px-5 py-2 text-sm font-semibold text-paper"
                            disabled={!tests.length}
                          >
                            <span className="flex items-center gap-2">
                              <PlayCircle size={18} weight="fill" />
                              {t.tests.resume}
                            </span>
                          </button>
                          <button
                            onClick={async () => {
                              await clearSavedProgress();
                              setStarted(true);
                            }}
                            className="rounded-full border border-ink/20 px-5 py-2 text-sm font-semibold text-ink"
                            disabled={!tests.length}
                          >
                            <span className="flex items-center gap-2">
                              <ArrowClockwise size={18} />
                              {t.tests.startOver}
                            </span>
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => setStarted(true)}
                          className="rounded-full bg-ink px-5 py-2 text-sm font-semibold text-paper"
                          disabled={!tests.length}
                        >
                          <span className="flex items-center gap-2">
                            <PlayCircle size={18} weight="fill" />
                            {t.tests.start}
                          </span>
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Score card */}
            <div className="rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.3em] text-ink/40">{t.tests.score}</p>
                <span className="rounded-full border border-ink/20 px-3 py-1 text-xs uppercase tracking-[0.2em] text-ink/60">
                  {percentage}%
                </span>
              </div>

              <div className="mt-4 flex items-end justify-between">
                <div>
                  <p className="text-5xl font-semibold">{percentage}%</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.3em] text-ink/40">{t.tests.percentage}</p>
                </div>
                <div className="text-right text-sm text-ink/70">
                  <p>
                    {t.tests.correct}: <span className="font-semibold">{score.correct}</span>
                  </p>
                  <p>
                    {t.tests.incorrect}: <span className="font-semibold">{score.total - score.correct}</span>
                  </p>
                </div>
              </div>

              <div className="mt-5 h-2 w-full rounded-full bg-ink/10">
                <div className="h-2 rounded-full bg-moss" style={{ width: `${percentage}%` }} />
              </div>
            </div>
          </div>
        </div>
        )}
      </div>

      {/* Right side column */}
      {tab !== "ai" && tab !== "aiHistory" && (
      <div className="space-y-6">
        {/* Progress card */}
        {started && currentQuestion && !finished && (
          <div className="rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.3em] text-ink/40">{t.tests.progress}</p>
                <span className="rounded-full border border-ink/20 px-3 py-1 text-xs text-ink/60">
                  {index + 1}/{roundQuestions.length}
                </span>
              </div>

              <div className="mt-4 h-2 w-full rounded-full bg-ink/10">
                <div
                  className="h-2 rounded-full bg-ink"
                  style={{ width: `${Math.round(((index + 1) / roundQuestions.length) * 100)}%` }}
                />
              </div>

              <div className="mt-4 flex items-center justify-between text-xs text-ink/60">
                <span>
                  {t.tests.correct}: {roundScore.correct}
                </span>
                <span>
                  {t.tests.incorrect}: {roundScore.total - roundScore.correct}
                </span>
              </div>
            </div>
          )}

          {/* History card */}
          {history.length > 0 && (
            <div className="rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft">
              <h3 className="text-xl font-semibold">{t.tests.history}</h3>

              <div className="mt-4 space-y-3 text-sm text-ink/70">
                {history
                  .slice()
                  .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
                  .slice(0, 8)
                  .map((entry, idx) => (
                    <div
                      key={`${entry.testId}-${idx}`}
                      className="flex items-center justify-between rounded-2xl border border-ink/10 bg-paper/60 px-4 py-3"
                    >
                      <span>{tests.find((test) => test.id === entry.testId)?.title || entry.testId}</span>
                      <span className="text-ink/60">
                        {entry.correct}/{entry.total}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}
      </div>
      )}

      {(started || finished) && tab !== "ai" && tab !== "aiHistory" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-6 py-10 backdrop-blur-sm">
          <div className="flex max-h-[80vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-ink/10 bg-paper/95 shadow-xl">
            <div className="p-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-ink/40">{t.tests.title}</p>
                <h2 className="mt-2 text-2xl font-semibold">{selectedTest?.title || "-"}</h2>
              </div>
              <div className="text-right text-xs text-ink/60">
                <p>
                  {t.tests.progress}: {index + 1}/{roundQuestions.length}
                </p>
                <p>
                  {t.tests.correct}: {roundScore.correct} · {t.tests.incorrect}: {roundScore.total - roundScore.correct}
                </p>
              </div>
            </div>

              <div className="mt-4 h-2 w-full rounded-full bg-ink/10">
                <div
                  className="h-2 rounded-full bg-ink"
                  style={{ width: `${Math.round(((index + 1) / roundQuestions.length) * 100)}%` }}
                />
              </div>
              <div className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(8px,1fr))] gap-1">
                {roundQuestions.map((q) => {
                  const value = checked[q.id];
                  const isAnswered = value !== undefined;
                  const correct = isAnswered ? isCorrect(q, value) : false;
                  return (
                    <span
                      key={q.id}
                      className={`h-2 rounded-full ${
                        !isAnswered ? "bg-ink/10" : correct ? "bg-moss" : "bg-terracotta"
                      }`}
                    />
                  );
                })}
              </div>
            </div>

            {remediationRound > 0 && !finished && (
              <div className="px-8">
                <div className="mt-5 rounded-2xl border border-terracotta/30 bg-terracotta/10 px-4 py-3 text-sm text-ink/70">
                {t.tests.remediation} {remediationRound}
                </div>
              </div>
            )}

            {!finished && currentQuestion && (
              <div className="mt-6 flex-1 overflow-y-auto px-8 pb-6">
                <>
                  <p className="text-xs uppercase tracking-[0.3em] text-ink/40">
                    {index + 1} / {roundQuestions.length}
                  </p>
                  <h3 className="mt-4 text-2xl font-semibold">{currentQuestion.prompt}</h3>

                  <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {currentQuestion.options.map((option) => {
                      const active = isMulti(currentQuestion)
                        ? toAnswerList(answers[currentQuestion.id]).includes(option.id)
                        : answers[currentQuestion.id] === option.id;

                      return (
                        <label
                          key={option.id}
                          className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 transition ${
                            active ? "border-ink bg-ink/5" : "border-ink/10 bg-paper/60"
                          }`}
                        >
                          <input
                            type={isMulti(currentQuestion) ? "checkbox" : "radio"}
                            name={`question-${currentQuestion.id}`}
                            value={option.id}
                            checked={active}
                            onChange={() => handleAnswer(option.id)}
                            className="accent-ink"
                          />
                          <span className="text-sm text-ink/70">{option.text}</span>
                        </label>
                      );
                    })}
                  </div>

                  {!canAnswerCurrent && <p className="mt-4 text-sm text-ink/50">{t.tests.selectAnswer}</p>}
                </>

              </div>
            )}

            {finished && (
              <div className="mt-6 px-8 pb-6">
                <h3 className="text-2xl font-semibold">{t.tests.score}</h3>

                <div className="mt-3 grid gap-2 text-sm text-ink/70">
                  <div className="flex items-center justify-between">
                    <span>{t.tests.correct}</span>
                    <span className="font-semibold">
                      {score.correct} / {score.total}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>{t.tests.incorrect}</span>
                    <span className="font-semibold">{score.total - score.correct}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>{t.tests.percentage}</span>
                    <span className="font-semibold">{percentage}%</span>
                  </div>
                </div>

              </div>
            )}
            <div className="mt-auto flex flex-wrap gap-3 border-t border-ink/10 bg-paper/80 px-8 py-5">
              {!finished && index < roundQuestions.length - 1 && (
                <button
                  onClick={nextQuestion}
                  className="rounded-full bg-ink px-5 py-2 text-sm font-semibold text-paper disabled:opacity-60"
                  disabled={!canAnswerCurrent}
                >
                  {t.tests.next}
                </button>
              )}

              {!finished && index >= roundQuestions.length - 1 && (
                <button
                  onClick={finishRound}
                  className="rounded-full bg-ink px-5 py-2 text-sm font-semibold text-paper disabled:opacity-60"
                  disabled={!canAnswerCurrent}
                >
                  {t.tests.finish}
                </button>
              )}

              {!finished && (
                <button
                  onClick={() => saveProgress(true)}
                  className="rounded-full border border-ink/20 px-5 py-2 text-sm font-semibold text-ink disabled:opacity-60"
                >
                  {saveStatus === "saving" ? t.tests.saving : t.tests.saveExit}
                </button>
              )}

              {finished && (
                <>
                  <button
                    onClick={() => {
                      setStarted(true);
                      setFinished(false);
                      setFinalScore(null);
                      setIndex(0);
                      setAnswers({});
                      setChecked({});
                      setRoundQuestions(baseQuestions);
                      setRemediationRound(0);
                      setSaveStatus("idle");
                    }}
                    className="rounded-full bg-ink px-5 py-2 text-sm font-semibold text-paper"
                  >
                    {t.tests.restart}
                  </button>

                  <button
                    onClick={() => {
                      setStarted(false);
                      setFinished(false);
                      setFinalScore(null);
                      setIndex(0);
                      setAnswers({});
                      setChecked({});
                      setRoundQuestions(baseQuestions);
                      setRemediationRound(0);
                      setSaveStatus("idle");
                    }}
                    className="rounded-full border border-ink/20 px-5 py-2 text-sm font-semibold"
                  >
                    {t.tests.backToList}
                  </button>
                </>
              )}

              {saveStatus === "saved" && <span className="text-xs text-ink/50">{t.tests.saved}</span>}
              {saveStatus === "error" && <span className="text-xs text-terracotta">{t.tests.saveError}</span>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
