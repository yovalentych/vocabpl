"use client";

import { useState } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { useAuthStatus } from "@/components/useAuthStatus";

export default function FeedbackForm() {
  const { t } = useLocale();
  const { loading, isAuthenticated } = useAuthStatus();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setStatus("sending");
    const res = await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, message })
    });
    if (!res.ok) {
      setStatus("error");
      return;
    }
    setStatus("sent");
    setSubject("");
    setMessage("");
  }

  if (loading || !isAuthenticated) return null;

  return (
    <form onSubmit={submit} className="space-y-3">
      <input
        value={subject}
        onChange={(event) => setSubject(event.target.value)}
        className="w-full rounded-2xl border border-ink/20 bg-paper px-4 py-2 text-xs"
        placeholder={t.footer.feedbackSubject}
      />
      <textarea
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        rows={3}
        className="w-full rounded-2xl border border-ink/20 bg-paper px-4 py-2 text-xs"
        placeholder={t.footer.feedbackPlaceholder}
        required
      />
      <button
        type="submit"
        disabled={status === "sending"}
        className="rounded-full bg-ink px-4 py-2 text-xs font-semibold text-paper"
      >
        {status === "sending" ? t.common.loading : t.footer.feedbackSend}
      </button>
      {status === "sent" && <p className="text-xs text-moss">{t.footer.feedbackSent}</p>}
      {status === "error" && <p className="text-xs text-terracotta">{t.footer.feedbackError}</p>}
    </form>
  );
}
