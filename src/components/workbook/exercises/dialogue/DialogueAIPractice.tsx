// @ts-nocheck
"use client";

import { useState, useEffect } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { Sparkle, User, PaperPlaneTilt } from "@phosphor-icons/react";
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

  // Generate initial dialogue
  useEffect(() => {
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
          setIsGenerating(false);
          return;
        }

        // Parse AI response - get first turn
        const result = JSON.parse(String(data?.text || ""));
        if (result.firstTurn) {
          setTurns([{ speaker: "ai", text: result.firstTurn }]);
        }
      } catch (error) {
        console.error("Failed to generate dialogue:", error);
        setError("Помилка мережі");
      } finally {
        setIsGenerating(false);
      }
    }

    generateDialogue();
  }, [config, locale]);

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

      console.log("=== Sending AI Request ===");
      console.log("Request body:", requestBody);
      console.log("Conversation history:", newTurns);

      const res = await fetch("/api/ai/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody)
      });

      console.log("Response status:", res.status, res.statusText);

      const data = await res.json().catch((err) => {
        console.error("JSON parse error:", err);
        return {};
      });

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

      console.log("=== AI Response Debug ===");
      console.log("Full data:", data);
      console.log("data.text:", data?.text);

      const result = JSON.parse(String(data?.text || "{}"));
      console.log("Parsed result:", result);
      console.log("result.nextTurn:", result.nextTurn);

      if (result.nextTurn && result.nextTurn.trim()) {
        console.log("Adding AI turn to state:", result.nextTurn);
        setTurns(prev => {
          const newTurns = [...prev, { speaker: "ai", text: result.nextTurn }];
          console.log("New turns state:", newTurns);
          return newTurns;
        });
      } else {
        console.error("Empty or missing AI response! Result:", result);
        setError("AI не надав відповіді. Спробуйте ще раз.");
      }
    } catch (error) {
      console.error("Failed to get AI response:", error);
      console.error("Error details:", error.message, error.stack);
      setError("Помилка мережі: " + error.message);
    } finally {
      console.log("Setting isWaitingForAI to false");
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

      const result = JSON.parse(String(data?.text || ""));
      setCheckResult(result);

      // Save points
      if (result?.qualityScore !== undefined) {
        const userTurnsCount = turns.filter(t => t.speaker === "user").length;
        try {
          await fetch("/api/exercises/attempt", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              exercise: "dialogue",
              points: result.qualityScore * userTurnsCount,
              xp: Math.round(result.qualityScore * userTurnsCount * 10)
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
      <div className="space-y-6">
        {/* Header */}
        <div className="rounded-3xl border border-moss/20 bg-moss/5 p-6 shadow-soft">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Sparkle size={16} weight="fill" className="text-moss" />
                <p className="text-xs uppercase tracking-[0.3em] text-moss/70">
                  AI режим
                </p>
              </div>
              <h2 className="text-xl font-semibold text-ink">
                {config.situation}
              </h2>
              <p className="mt-1 text-sm text-ink/60">
                Рівень: {config.level} · Обмінів: {userTurnCount}
              </p>
            </div>
            {!isComplete && userTurnCount > 0 && (
              <button
                onClick={() => setIsComplete(true)}
                className="rounded-full border border-ink/20 px-4 py-2 text-xs font-semibold text-ink transition hover:bg-ink/5"
              >
                Завершити
              </button>
            )}
          </div>
        </div>

        {/* Conversation */}
        <div className="rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft">
          <div className="space-y-4">
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
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="rounded-2xl border border-terracotta/20 bg-terracotta/5 p-4 text-sm text-terracotta">
            {error}
          </div>
        )}

        {/* Input or completion */}
        {!isComplete ? (
          <div className="rounded-3xl border border-ink/10 bg-paper/80 p-4 shadow-soft">
            <div className="flex gap-3">
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
                rows={3}
                disabled={isWaitingForAI}
                className="flex-1 rounded-2xl border border-ink/20 bg-paper px-4 py-3 text-sm text-ink placeholder:text-ink/40 focus:border-moss/40 focus:outline-none focus:ring-0 disabled:opacity-50"
              />
              <button
                onClick={handleSendResponse}
                disabled={!currentInput.trim() || isWaitingForAI}
                className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-moss text-paper transition hover:bg-moss/90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <PaperPlaneTilt size={20} weight="fill" />
              </button>
            </div>
            <p className="mt-2 text-xs text-ink/50">
              Натисніть Enter для відправки · Shift+Enter для нового рядка
            </p>
          </div>
        ) : (
          <div className="flex justify-center">
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

      {/* Results Modal */}
      {showResults && checkResult && (
        <DialogueResults
          results={{
            mode: "ai",
            situation: config.situation,
            level: config.level,
            totalTurns: userTurnCount,
            filledTurns: userTurnCount,
            qualityScore: checkResult.qualityScore || 0,
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
