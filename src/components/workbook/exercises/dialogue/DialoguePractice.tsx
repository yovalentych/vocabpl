"use client";

import { useEffect } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { useDialogue } from "./useDialogue";
import { Sparkle, PaperPlaneRight } from "@phosphor-icons/react/dist/ssr";

interface DialoguePracticeProps {
  mode?: "static" | "ai";
  scenario?: string;
  startBy?: "user" | "ai";
}

export default function DialoguePractice({ mode = "ai", scenario = "", startBy = "ai" }: DialoguePracticeProps) {
  const { t, locale } = useLocale();
  const { roleplay, input, loading, error, setInput, setMode, startRoleplay, sendMessage, reset } =
    useDialogue();

  useEffect(() => {
    setMode(mode);
    if (mode === "ai") {
      startRoleplay(startBy, locale);
    }
  }, [locale, mode, setMode, startBy, startRoleplay]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    await sendMessage(input, locale);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold">{t.workbook.dialogueTitle || "Діалог"}</h2>
            <p className="mt-1 text-sm text-ink/60">
              {mode === "ai" ? "AI Roleplay" : t.workbook.dialogueStatic}
            </p>
          </div>
          <button
            onClick={reset}
            className="rounded-full border border-ink/20 px-4 py-2 text-xs font-semibold text-ink hover:bg-ink/5"
          >
            {t.workbook.dialogueReset}
          </button>
        </div>
      </div>

      {/* Chat Area */}
      <div className="rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft">
        <div className="space-y-4">
          {roleplay.length === 0 && loading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Sparkle className="mx-auto mb-3 h-8 w-8 animate-pulse text-ink/40" weight="fill" />
                <p className="text-sm text-ink/60">{t.workbook.aiGenerating}</p>
              </div>
            </div>
          )}

          {roleplay.map((turn, idx) => (
            <div
              key={idx}
              className={`flex ${turn.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  turn.role === "user"
                    ? "bg-ink text-paper"
                    : "border border-ink/10 bg-paper"
                }`}
              >
                <p className="text-sm">{turn.text}</p>
              </div>
            </div>
          ))}

          {loading && roleplay.length > 0 && (
            <div className="flex justify-start">
              <div className="rounded-2xl border border-ink/10 bg-paper px-4 py-3">
                <div className="flex gap-1">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-ink/40" style={{ animationDelay: "0ms" }} />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-ink/40" style={{ animationDelay: "150ms" }} />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-ink/40" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-2xl border border-terracotta/20 bg-terracotta/5 px-4 py-3 text-sm text-terracotta">
              {error}
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="mt-6 flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={t.workbook.dialoguePlaceholder || "Введіть ваше повідомлення..."}
            className="flex-1 rounded-2xl border border-ink/20 bg-paper px-4 py-3 text-sm"
            rows={2}
            disabled={loading}
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="rounded-full bg-ink px-4 py-2 text-paper transition hover:bg-ink/90 disabled:opacity-50"
          >
            <PaperPlaneRight size={20} weight="fill" />
          </button>
        </div>
      </div>
    </div>
  );
}
