"use client";

import { useState } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { useAuthStatus } from "@/components/useAuthStatus";
import { EnvelopeSimple } from "@phosphor-icons/react";

export default function FeedbackModal() {
  const { t } = useLocale();
  const { loading, isAuthenticated } = useAuthStatus();
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState("feedback");
  const [priority, setPriority] = useState("normal");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  if (loading || !isAuthenticated) return null;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setStatus("sending");
    const composed = `${t.footer.feedbackCategory}: ${category}\n${t.footer.feedbackPriority}: ${priority}\n\n${message}`;
    const res = await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, message: composed })
    });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setErrorMessage(data?.error || t.footer.feedbackError);
      setStatus("error");
      return;
    }
    setStatus("sent");
    setErrorMessage("");
    setSubject("");
    setMessage("");
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-full border border-ink/20 bg-paper/80 px-3 py-1 text-xs font-semibold text-ink/70 hover:bg-ink/10"
      >
        <EnvelopeSimple size={16} weight="bold" />
        {t.footer.feedbackCta}
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4">
          <div className="w-full max-w-2xl rounded-3xl border border-ink/10 bg-paper p-6 shadow-soft">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold">{t.footer.feedbackTitle}</h3>
                <p className="text-xs text-ink/50">{t.footer.feedbackSubtitle}</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-full border border-ink/20 px-4 py-2 text-xs font-semibold"
              >
                {t.common.close}
              </button>
            </div>

            <form onSubmit={submit} className="mt-4 space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-xs text-ink/60">
                  {t.footer.feedbackCategory}
                  <select
                    value={category}
                    onChange={(event) => setCategory(event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-ink/20 bg-paper px-3 py-2 text-sm"
                  >
                    <option value="feedback">{t.footer.feedbackOptionGeneral}</option>
                    <option value="bug">{t.footer.feedbackOptionBug}</option>
                    <option value="idea">{t.footer.feedbackOptionIdea}</option>
                  </select>
                </label>
                <label className="text-xs text-ink/60">
                  {t.footer.feedbackPriority}
                  <select
                    value={priority}
                    onChange={(event) => setPriority(event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-ink/20 bg-paper px-3 py-2 text-sm"
                  >
                    <option value="low">{t.footer.feedbackPriorityLow}</option>
                    <option value="normal">{t.footer.feedbackPriorityNormal}</option>
                    <option value="high">{t.footer.feedbackPriorityHigh}</option>
                  </select>
                </label>
              </div>
              <label className="text-xs text-ink/60">
                {t.footer.feedbackSubject}
                <input
                  value={subject}
                  onChange={(event) => setSubject(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-ink/20 bg-paper px-4 py-2 text-sm"
                  placeholder={t.footer.feedbackSubject}
                />
              </label>
              <label className="text-xs text-ink/60">
                {t.footer.feedbackMessage}
                <textarea
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  rows={5}
                  className="mt-2 w-full rounded-2xl border border-ink/20 bg-paper px-4 py-2 text-sm"
                  placeholder={t.footer.feedbackPlaceholder}
                  required
                />
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={status === "sending"}
                  className="rounded-full bg-ink px-4 py-2 text-xs font-semibold text-paper"
                >
                  {status === "sending" ? t.common.loading : t.footer.feedbackSend}
                </button>
                {status === "sent" && <span className="text-xs text-moss">{t.footer.feedbackSent}</span>}
                {status === "error" && (
                  <span className="text-xs text-terracotta">{errorMessage || t.footer.feedbackError}</span>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
