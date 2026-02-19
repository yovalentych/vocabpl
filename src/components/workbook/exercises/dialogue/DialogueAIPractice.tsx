// @ts-nocheck
"use client";

import { useState, useEffect, useRef } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { Sparkle, User, PaperPlaneTilt, CheckCircle } from "@phosphor-icons/react";
import { safeParseAIResponse } from "@/lib/workbook";
import { calculatePoints } from "@/lib/scoring";
import DialogueResults from "./DialogueResults";

interface Turn {
  speaker: "ai" | "user";
  text: string;
}

interface DialogueAIPracticeProps {
  config: {
    situation: string;
    level: "A1" | "A2" | "B1" | "B2";
  };
  onComplete: () => void;
}

export default function DialogueAIPractice({ config, onComplete }: DialogueAIPracticeProps) {
  const { t, locale } = useLocale();
  const [turns, setTurns] = useState<Turn[]>([]);
  const [currentInput, setCurrentInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(true);
  const [isWaitingForAI, setIsWaitingForAI] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [checkResult, setCheckResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns, isWaitingForAI]);

  // Generate initial dialogue
  useEffect(() => {
    let cancelled = false;

    async function generateDialogue() {
      try {
        setError(null);
        const res = await fetch("/api/ai/run", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode: "mini_dialog_generate",
            userInput: JSON.stringify({
              situation: config.situation,
              level: config.level
            }),
            context: JSON.stringify({ uiLanguage: locale })
          })
        });

        if (cancelled) return;

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          const errorCode = data?.code;
          const message =
            errorCode === "ai_quota"
              ? "Ліміт AI кредитів вичерпано"
              : errorCode === "pvs_unavailable"
                ? "Потрібен AI план"
                : data?.error || "Помилка AI";
          if (!cancelled) setError(message);
          if (!cancelled) setIsGenerating(false);
          return;
        }

        const result = safeParseAIResponse(data?.text);
        if (!cancelled && result?.firstTurn) {
          setTurns([{ speaker: "ai", text: result.firstTurn }]);
        } else if (!cancelled) {
          setError("AI не змогла створити діалог. Спробуйте іншу ситуацію.");
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to generate dialogue:", error);
          setError("Помилка мережі");
        }
      } finally {
        if (!cancelled) setIsGenerating(false);
      }
    }

    generateDialogue();
    return () => { cancelled = true; };
  }, [config.situation, config.level, locale]);

  const handleSendResponse = async () => {
    if (!currentInput.trim() || isWaitingForAI) return;

    const userMessage = currentInput.trim();
    setCurrentInput("");

    // Add user's message
    const newTurns = [...turns, { speaker: "user", text: userMessage }];
    setTurns(newTurns);

    // Get AI response
    setIsWaitingForAI(true);
    setError(null);

    try {
      const requestBody = {
        mode: "mini_dialog_continue",
        userInput: JSON.stringify({
          situation: config.situation,
          level: config.level,
          conversationHistory: newTurns
        }),
        context: JSON.stringify({ uiLanguage: locale })
      };

      const res = await fetch("/api/ai/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody)
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const errorCode = data?.code;
        const message =
          errorCode === "ai_quota"
            ? "Ліміт AI кредитів вичерпано"
            : errorCode === "pvs_unavailable"
              ? "Потрібен AI план"
              : data?.error || "Помилка AI";
        setError(message);
        setIsWaitingForAI(false);
        return;
      }

      const result = safeParseAIResponse(data?.text);

      if (result?.nextTurn && result.nextTurn.trim()) {
        setTurns(prev => [...prev, { speaker: "ai", text: result.nextTurn }]);
      } else {
        setError("AI не надав відповіді. Спробуйте ще раз.");
      }
    } catch (error) {
      console.error("Failed to get AI response:", error);
      setError("Помилка мережі");
    } finally {
      setIsWaitingForAI(false);
    }
  };

  const handleCheckDialogue = async () => {
    setIsChecking(true);
    setError(null);

    try {
      const res = await fetch("/api/ai/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "dialogue_check",
          userInput: JSON.stringify({
            situation: config.situation,
            level: config.level,
            turns: turns
          }),
          context: JSON.stringify({ uiLanguage: locale })
        })
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const errorCode = data?.code;
        const message =
          errorCode === "ai_quota"
            ? "Ліміт AI кредитів вичерпано"
            : errorCode === "pvs_unavailable"
              ? "Потрібен AI план"
              : data?.error || "Помилка AI";
        setError(message);
        setIsChecking(false);
        return;
      }

      const result = safeParseAIResponse(data?.text);
      if (!result) {
        setError("AI повернула неправильний формат відповіді. Спробуйте ще раз.");
        setIsChecking(false);
        return;
      }
      setCheckResult(result);

      // Save points
      const score01 = result?.overall?.score01;
      if (score01 !== undefined) {
        const userTurnsCount = turns.filter(t => t.speaker === "user").length;
        try {
          await fetch("/api/exercises/attempt", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              exercise: "dialogue",
              points: calculatePoints({ score01, level: config.level, itemCount: userTurnsCount, exercise: "dialogue" })
            })
          });
        } catch (error) {
          console.error("Failed to save points:", error);
        }
      }

      setShowResults(true);
    } catch (error) {
      console.error("Failed to check dialogue:", error);
      setError("Помилка мережі");
    } finally {
      setIsChecking(false);
    }
  };

  if (isGenerating) {
    return (
      <div className="rounded-3xl border border-ink/10 bg-paper/80 p-8 shadow-soft text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Sparkle size={24} weight="fill" className="text-moss animate-pulse" />
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-moss/20 border-t-moss" />
        </div>
        <p className="text-sm font-semibold text-ink mb-2">AI створює діалог...</p>
        <p className="text-xs text-ink/60">
          Ситуація: <span className="font-medium">{config.situation}</span> · Рівень: <span className="font-medium">{config.level}</span>
        </p>
      </div>
    );
  }

  if (error && turns.length === 0) {
    return (
      <div className="rounded-3xl border border-terracotta/20 bg-terracotta/5 p-8 shadow-soft text-center">
        <p className="text-sm font-semibold text-terracotta mb-2">Помилка</p>
        <p className="text-sm text-ink/70">{error}</p>
        <button
          onClick={onComplete}
          className="mt-4 inline-flex items-center gap-2 rounded-full border border-ink/20 px-4 py-2 text-xs font-semibold text-ink transition hover:bg-ink/5"
        >
          Спробувати знову
        </button>
      </div>
    );
  }

  const userTurnCount = turns.filter(t => t.speaker === "user").length;

  return (
    <>
      {/* Single chat container */}
      <div className="rounded-3xl border border-ink/10 bg-paper/80 shadow-soft flex flex-col h-[70vh] max-h-[600px]">
        {/* Compact header */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-ink/10 flex-shrink-0">
          <Sparkle size={16} weight="fill" className="text-moss" />
          <span className="text-xs font-semibold text-moss/70 uppercase tracking-wider">AI режим</span>
          <span className="text-xs text-ink/40">·</span>
          <span className="text-sm text-ink truncate">{config.situation}</span>
          <span className="text-xs text-ink/40">·</span>
          <span className="text-xs text-ink/50">{config.level}</span>
          <span className="text-xs text-ink/40">·</span>
          <span className="text-xs text-ink/50">{userTurnCount} обмінів</span>
        </div>

        {/* Scrollable messages area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {turns.map((turn, idx) => (
            <div key={idx}>
              {turn.speaker === "ai" ? (
                <div className="flex gap-3">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-moss/10">
                    <Sparkle size={20} weight="fill" className="text-moss" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-moss mb-1">AI співрозмовник</p>
                    <div className="rounded-2xl border border-moss/20 bg-moss/5 px-4 py-3">
                      <p className="text-sm text-ink">{turn.text}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex gap-3 justify-end">
                  <div className="flex-1 max-w-[80%]">
                    <p className="text-xs font-semibold text-gold mb-1 text-right">Ви</p>
                    <div className="rounded-2xl border border-gold/20 bg-gold/5 px-4 py-3">
                      <p className="text-sm text-ink">{turn.text}</p>
                    </div>
                  </div>
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gold/10">
                    <User size={20} weight="fill" className="text-gold" />
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Waiting indicator */}
          {isWaitingForAI && (
            <div className="flex gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-moss/10">
                <Sparkle size={20} weight="fill" className="text-moss animate-pulse" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-moss mb-1">AI співрозмовник</p>
                <div className="rounded-2xl border border-moss/20 bg-moss/5 px-4 py-3">
                  <div className="flex gap-1">
                    <span className="h-2 w-2 rounded-full bg-moss/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="h-2 w-2 rounded-full bg-moss/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="h-2 w-2 rounded-full bg-moss/40 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Scroll anchor */}
          <div ref={messagesEndRef} />
        </div>

        {/* Error inside chat window */}
        {error && (
          <div className="mx-4 mb-2 rounded-xl border border-terracotta/20 bg-terracotta/5 px-4 py-2 text-sm text-terracotta flex-shrink-0">
            {error}
          </div>
        )}

        {/* Sticky bottom: input or completion */}
        <div className="border-t border-ink/10 px-4 py-3 flex-shrink-0">
          {!isComplete ? (
            <>
              <div className="flex items-end gap-2">
                {userTurnCount > 0 && (
                  <button
                    onClick={() => setIsComplete(true)}
                    title="Завершити діалог"
                    className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-ink/20 text-ink/60 transition hover:bg-ink/5 hover:text-ink"
                  >
                    <CheckCircle size={20} weight="bold" />
                  </button>
                )}
                <textarea
                  value={currentInput}
                  onChange={(e) => setCurrentInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendResponse();
                    }
                  }}
                  placeholder="Напишіть вашу відповідь польською..."
                  rows={2}
                  maxLength={500}
                  disabled={isWaitingForAI}
                  className="flex-1 rounded-2xl border border-ink/20 bg-paper px-4 py-2 text-sm text-ink placeholder:text-ink/40 focus:border-moss/40 focus:outline-none focus:ring-0 disabled:opacity-50 resize-none"
                />
                <button
                  onClick={handleSendResponse}
                  disabled={!currentInput.trim() || isWaitingForAI}
                  className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-moss text-paper transition hover:bg-moss/90 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <PaperPlaneTilt size={20} weight="fill" />
                </button>
              </div>
              <p className="mt-1 text-xs text-ink/40">
                Enter — відправити · Shift+Enter — новий рядок
              </p>
            </>
          ) : (
            <div className="flex justify-center py-1">
              <button
                onClick={handleCheckDialogue}
                disabled={isChecking}
                className="inline-flex items-center gap-2 rounded-full bg-moss px-8 py-3 text-sm font-semibold text-paper transition hover:bg-moss/90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isChecking ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-paper/20 border-t-paper" />
                    <span>Перевірка AI...</span>
                  </>
                ) : (
                  <>
                    <Sparkle size={18} weight="fill" />
                    <span>Отримати фідбек</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Results Modal */}
      {showResults && checkResult && (
        <DialogueResults
          results={{
            mode: "ai",
            situation: config.situation,
            level: config.level,
            totalTurns: userTurnCount,
            filledTurns: userTurnCount,
            qualityScore: checkResult.overall?.score01 ?? checkResult.qualityScore ?? 0,
            aiFeedback: checkResult
          }}
          onClose={() => {
            setShowResults(false);
            onComplete();
          }}
        />
      )}
    </>
  );
}
