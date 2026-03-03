"use client";

import { useState } from "react";
import { useLocale } from "@/components/LocaleProvider";
import {
  X,
  Calendar,
  Clock,
  ArrowsClockwise,
  XCircle,
  Warning
} from "@phosphor-icons/react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  event: any;
  occurrenceDate: Date;
  onSuccess: () => void;
}

export default function OccurrenceActionsModal({
  isOpen,
  onClose,
  event,
  occurrenceDate,
  onSuccess
}: Props) {
  const { t, locale } = useLocale();
  const [action, setAction] = useState<"reschedule" | "cancel" | null>(null);
  const [newDateTime, setNewDateTime] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const formatDate = (date: Date) => {
    return date.toLocaleDateString(locale === "pl" ? "pl-PL" : "uk-UA", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString(locale === "pl" ? "pl-PL" : "uk-UA", {
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      const overrideData: any = {
        originalDate: occurrenceDate.toISOString(),
        cancelled: action === "cancel",
        reason: reason.trim()
      };

      if (action === "reschedule" && newDateTime) {
        const newStart = new Date(newDateTime);
        const duration = event.endTime.getTime() - event.startTime.getTime();
        const newEnd = new Date(newStart.getTime() + duration);

        overrideData.newStartTime = newStart.toISOString();
        overrideData.newEndTime = newEnd.toISOString();
      }

      const res = await fetch(`/api/schedule/${event._id}/occurrence`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(overrideData)
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update occurrence");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-lg rounded-[32px] border border-ink/10 bg-paper shadow-xl">
        {/* Header */}
        <div className="border-b border-ink/10 p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">
                {locale === "pl" ? "Zarządzaj zajęciami" : "Керування заняттям"}
              </h2>
              <p className="mt-1 text-sm text-ink/60">{event.title}</p>
              <p className="mt-1 text-sm text-ink/60">{formatDate(occurrenceDate)}</p>
            </div>
            <button
              onClick={onClose}
              className="rounded-full border border-ink/10 bg-paper p-2 transition-colors hover:bg-ink/5"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 p-6">
          {!action && (
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => setAction("reschedule")}
                className="w-full rounded-[20px] border border-ink/10 bg-gradient-to-br from-gold/10 to-paper p-6 text-left transition-all hover:shadow-soft"
              >
                <div className="flex items-start gap-4">
                  <div className="rounded-full border border-gold/20 bg-gold/10 p-3">
                    <ArrowsClockwise size={24} weight="bold" className="text-gold" />
                  </div>
                  <div>
                    <div className="font-semibold">
                      {locale === "pl" ? "Przenieś zajęcia" : "Перенести заняття"}
                    </div>
                    <div className="mt-1 text-sm text-ink/60">
                      {locale === "pl"
                        ? "Zmień datę i godzinę tych zajęć"
                        : "Змінити дату та час цього заняття"}
                    </div>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setAction("cancel")}
                className="w-full rounded-[20px] border border-ink/10 bg-gradient-to-br from-terracotta/10 to-paper p-6 text-left transition-all hover:shadow-soft"
              >
                <div className="flex items-start gap-4">
                  <div className="rounded-full border border-terracotta/20 bg-terracotta/10 p-3">
                    <XCircle size={24} weight="bold" className="text-terracotta" />
                  </div>
                  <div>
                    <div className="font-semibold">
                      {locale === "pl" ? "Odwołaj zajęcia" : "Скасувати заняття"}
                    </div>
                    <div className="mt-1 text-sm text-ink/60">
                      {locale === "pl"
                        ? "Anuluj te zajęcia bez usuwania całej serii"
                        : "Скасувати це заняття без видалення всієї серії"}
                    </div>
                  </div>
                </div>
              </button>
            </div>
          )}

          {action === "reschedule" && (
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => setAction(null)}
                className="text-sm text-moss hover:underline"
              >
                ← {locale === "pl" ? "Powrót" : "Назад"}
              </button>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  {locale === "pl" ? "Nowa data i czas" : "Нова дата та час"} <span className="text-terracotta">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={newDateTime}
                  onChange={e => setNewDateTime(e.target.value)}
                  className="w-full rounded-[16px] border border-ink/10 bg-paper px-4 py-3 transition-all focus:border-gold/20 focus:outline-none focus:ring-2 focus:ring-gold/20"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  {locale === "pl" ? "Powód przeniesienia" : "Причина перенесення"}
                </label>
                <textarea
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder={locale === "pl" ? "Opcjonalnie..." : "Опційно..."}
                  rows={2}
                  className="w-full rounded-[16px] border border-ink/10 bg-paper px-4 py-3 transition-all focus:border-gold/20 focus:outline-none focus:ring-2 focus:ring-gold/20"
                />
              </div>

              <div className="rounded-[16px] border border-gold/20 bg-gold/10 p-4">
                <div className="flex gap-3">
                  <Warning size={20} weight="fill" className="flex-shrink-0 text-gold" />
                  <div className="text-sm text-ink/80">
                    {locale === "pl"
                      ? "Tylko te zajęcia zostaną przeniesione. Pozostałe zajęcia z serii pozostaną bez zmian."
                      : "Тільки це заняття буде перенесене. Інші заняття з серії залишаться без змін."}
                  </div>
                </div>
              </div>
            </div>
          )}

          {action === "cancel" && (
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => setAction(null)}
                className="text-sm text-moss hover:underline"
              >
                ← {locale === "pl" ? "Powrót" : "Назад"}
              </button>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  {locale === "pl" ? "Powód odwołania" : "Причина скасування"}
                </label>
                <textarea
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder={locale === "pl" ? "Opcjonalnie..." : "Опційно..."}
                  rows={2}
                  className="w-full rounded-[16px] border border-ink/10 bg-paper px-4 py-3 transition-all focus:border-terracotta/20 focus:outline-none focus:ring-2 focus:ring-terracotta/20"
                />
              </div>

              <div className="rounded-[16px] border border-terracotta/20 bg-terracotta/10 p-4">
                <div className="flex gap-3">
                  <Warning size={20} weight="fill" className="flex-shrink-0 text-terracotta" />
                  <div className="text-sm text-ink/80">
                    {locale === "pl"
                      ? "Tylko te zajęcia zostaną odwołane. Możesz później usunąć to odwołanie."
                      : "Тільки це заняття буде скасоване. Ви можете пізніше скасувати це рішення."}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="rounded-[16px] border border-terracotta/20 bg-terracotta/10 p-4 text-sm text-terracotta">
              {error}
            </div>
          )}

          {/* Actions */}
          {action && (
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setAction(null);
                  setNewDateTime("");
                  setReason("");
                }}
                className="flex-1 rounded-full border border-ink/10 bg-paper px-6 py-3 font-semibold transition-all hover:bg-ink/5"
              >
                {locale === "pl" ? "Anuluj" : "Скасувати"}
              </button>
              <button
                type="submit"
                disabled={saving || (action === "reschedule" && !newDateTime)}
                className={`flex-1 rounded-full border px-6 py-3 font-semibold text-paper transition-all disabled:opacity-50 ${
                  action === "reschedule"
                    ? "border-gold/20 bg-gold hover:bg-gold/90"
                    : "border-terracotta/20 bg-terracotta hover:bg-terracotta/90"
                }`}
              >
                {saving
                  ? (locale === "pl" ? "Zapisywanie..." : "Збереження...")
                  : action === "reschedule"
                    ? (locale === "pl" ? "Przenieś" : "Перенести")
                    : (locale === "pl" ? "Odwołaj" : "Скасувати")}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
