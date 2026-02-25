"use client";

import { useState } from "react";
import { X, WarningCircle, PaperPlaneRight, CheckCircle } from "@phosphor-icons/react";
import Loader from "./Loader";
import { useLocale } from "@/components/LocaleProvider";

interface ErrorFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  error: string;
  context: string; // e.g., "AI Test Generation", "Reading Comprehension"
  onRetry?: () => void;
  errorDetails?: {
    endpoint?: string;
    payload?: any;
    response?: any;
  };
}

export default function ErrorFeedbackModal({
  isOpen,
  onClose,
  error,
  context,
  onRetry,
  errorDetails
}: ErrorFeedbackModalProps) {
  const { t } = useLocale();
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  if (!isOpen) return null;

  async function handleSendFeedback() {
    if (!feedbackText.trim()) return;

    setSending(true);

    try {
      const payload = {
        context,
        error,
        userFeedback: feedbackText,
        email: email.trim() || undefined,
        errorDetails: errorDetails || {},
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      };

      const res = await fetch("/api/feedback/error", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setSent(true);
        setTimeout(() => {
          onClose();
          setShowFeedbackForm(false);
          setFeedbackText("");
          setEmail("");
          setSent(false);
        }, 2000);
      }
    } catch (err) {
      console.error("Send feedback error:", err);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4 backdrop-blur-sm">
      <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-terracotta/20 bg-paper shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-ink/10 p-6">
          <div className="flex items-start gap-3">
            <WarningCircle size={32} weight="fill" className="text-terracotta flex-shrink-0" />
            <div>
              <h3 className="text-xl font-bold text-ink">{t.errorModal.title}</h3>
              <p className="mt-1 text-sm text-ink/60">{context}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-ink/40 transition hover:bg-ink/5 hover:text-ink/70"
          >
            <X size={24} />
          </button>
        </div>

        {/* Error Explanation */}
        <div className="p-6">
          {!showFeedbackForm ? (
            <>
              <div className="rounded-2xl border border-terracotta/20 bg-terracotta/5 p-4">
                <p className="text-sm font-medium text-terracotta">{error}</p>
              </div>

              <div className="mt-6 space-y-3 text-sm text-ink/70">
                <p className="font-semibold text-ink">{t.errorModal.whyHappened}</p>
                <ul className="space-y-2 pl-5">
                  <li className="list-disc">{t.errorModal.reasonAI}</li>
                  <li className="list-disc">{t.errorModal.reasonNetwork}</li>
                  <li className="list-disc">{t.errorModal.reasonFormat}</li>
                  <li className="list-disc">{t.errorModal.reasonMaintenance}</li>
                </ul>
              </div>

              {/* Actions */}
              <div className="mt-6 space-y-3">
                {onRetry && (
                  <button
                    onClick={() => {
                      onClose();
                      onRetry();
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-full bg-moss px-6 py-3 text-sm font-semibold text-paper transition hover:bg-moss/90"
                  >
                    <WarningCircle size={18} weight="fill" />
                    {t.common.retry}
                  </button>
                )}

                <button
                  onClick={() => setShowFeedbackForm(true)}
                  className="flex w-full items-center justify-center gap-2 rounded-full border border-ink/20 px-6 py-3 text-sm font-semibold text-ink transition hover:bg-ink/5"
                >
                  <PaperPlaneRight size={18} />
                  {t.errorModal.reportDev}
                </button>

                <button
                  onClick={onClose}
                  className="w-full rounded-full px-6 py-2 text-sm text-ink/60 transition hover:text-ink"
                >
                  {t.common.close}
                </button>
              </div>
            </>
          ) : (
            <>
              {sent ? (
                <div className="py-12 text-center">
                  <CheckCircle size={64} weight="fill" className="mx-auto text-moss" />
                  <p className="mt-4 text-lg font-semibold text-moss">{t.errorModal.thankYou}</p>
                  <p className="mt-2 text-sm text-ink/60">
                    {t.errorModal.receivedMsg}
                  </p>
                </div>
              ) : (
                <>
                  <h4 className="text-lg font-semibold">{t.errorModal.reportTitle}</h4>
                  <p className="mt-2 text-sm text-ink/60">
                    {t.errorModal.reportHint}
                  </p>

                  <div className="mt-6 space-y-4">
                    {/* Error Info (readonly) */}
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-ink/40">
                        {t.errorModal.errorLabel}
                      </label>
                      <div className="mt-2 rounded-2xl border border-ink/10 bg-ink/5 px-4 py-3 text-sm text-ink/70">
                        {error}
                      </div>
                    </div>

                    {/* User Feedback */}
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-ink/40">
                        {t.errorModal.descriptionLabel}
                      </label>
                      <textarea
                        value={feedbackText}
                        onChange={(e) => setFeedbackText(e.target.value)}
                        placeholder={t.errorModal.descriptionPlaceholder}
                        rows={4}
                        className="mt-2 w-full rounded-2xl border border-ink/20 bg-paper px-4 py-3 text-sm resize-none focus:border-moss/40 focus:outline-none"
                      />
                    </div>

                    {/* Email (optional) */}
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-ink/40">
                        {t.errorModal.emailLabel}
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={t.errorModal.emailPlaceholder}
                        className="mt-2 w-full rounded-2xl border border-ink/20 bg-paper px-4 py-3 text-sm focus:border-moss/40 focus:outline-none"
                      />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                      <button
                        onClick={handleSendFeedback}
                        disabled={sending || !feedbackText.trim()}
                        className="flex flex-1 items-center justify-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-semibold text-paper transition hover:bg-ink/90 disabled:opacity-50"
                      >
                        {sending ? (
                          <>
                            <Loader label="" />
                            {t.common.sending}
                          </>
                        ) : (
                          <>
                            <PaperPlaneRight size={18} weight="fill" />
                            {t.errorModal.send}
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => setShowFeedbackForm(false)}
                        disabled={sending}
                        className="rounded-full border border-ink/20 px-6 py-3 text-sm font-semibold text-ink transition hover:bg-ink/5"
                      >
                        {t.common.back}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
