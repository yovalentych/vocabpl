"use client";

import { useState, useEffect } from "react";
import { useLocale } from "@/components/LocaleProvider";
import {
  X,
  Chalkboard,
  ClipboardText,
  Exam,
  Users,
  Megaphone,
  MapPin,
  Link as LinkIcon,
  CheckCircle,
  XCircle,
  PencilSimple,
  Trash,
  Clock,
  Repeat,
  ArrowCounterClockwise,
} from "@phosphor-icons/react";
import { getEventColor, formatEventTime, getRecurrenceDescription } from "@/lib/schedule";
import { csrfFetch } from "@/lib/csrf-client";
import AttendanceModal from "./AttendanceModal";
import CreateEventModal from "./CreateEventModal";

interface Props {
  event: any;
  occurrenceDate?: Date;
  isTeacher: boolean;
  onClose: () => void;
  onUpdated: () => void;
  teacherClasses?: { id: string; name: string }[];
}

const TYPE_META: Record<string, { icon: any; uk: string; pl: string }> = {
  lesson: { icon: Chalkboard, uk: "Урок", pl: "Lekcja" },
  assignment_deadline: { icon: ClipboardText, uk: "Дедлайн", pl: "Termin" },
  test: { icon: Exam, uk: "Тест", pl: "Test" },
  meeting: { icon: Users, uk: "Зустріч", pl: "Spotkanie" },
  announcement: { icon: Megaphone, uk: "Оголошення", pl: "Ogłoszenie" },
};

export default function EventDetailPanel({
  event,
  occurrenceDate,
  isTeacher,
  onClose,
  onUpdated,
  teacherClasses,
}: Props) {
  const { locale } = useLocale();
  const [attendance, setAttendance] = useState<any>(null);
  const [showAttendance, setShowAttendance] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [restoring, setRestoring] = useState(false);

  const effectiveDate = occurrenceDate || new Date(event.startTime);

  const isOccurrenceCancelled =
    event.isRecurring &&
    event.overrides?.some(
      (o: any) =>
        new Date(o.originalDate).toDateString() === effectiveDate.toDateString() && o.cancelled
    );
  const isCancelled = event.isCancelled || isOccurrenceCancelled;

  const cancellationReason =
    event.cancellationReason ||
    event.overrides?.find(
      (o: any) =>
        new Date(o.originalDate).toDateString() === effectiveDate.toDateString() && o.cancelled
    )?.reason;

  useEffect(() => {
    if (isTeacher) loadAttendance();
  }, [event._id, occurrenceDate]);

  async function loadAttendance() {
    try {
      const date = effectiveDate.toISOString();
      const res = await fetch(`/api/schedule/${event._id}/attendance?date=${encodeURIComponent(date)}`);
      if (res.ok) {
        const data = await res.json();
        setAttendance(data.attendance);
      }
    } catch {}
  }

  async function handleCancelOccurrence() {
    setCancelling(true);
    try {
      if (event.isRecurring) {
        const res = await csrfFetch(`/api/schedule/${event._id}/occurrence`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            originalDate: effectiveDate.toISOString(),
            cancelled: true,
            reason: cancelReason.trim(),
          }),
        });
        if (res.ok) { onUpdated(); onClose(); }
      } else {
        const res = await csrfFetch(`/api/schedule/${event._id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isCancelled: true, cancellationReason: cancelReason.trim() }),
        });
        if (res.ok) { onUpdated(); onClose(); }
      }
    } catch (err) {
      console.error("Cancel failed:", err);
    } finally {
      setCancelling(false);
    }
  }

  async function handleRestoreOccurrence() {
    setRestoring(true);
    try {
      if (event.isRecurring) {
        const dateParam = effectiveDate.toISOString();
        await csrfFetch(
          `/api/schedule/${event._id}/occurrence?date=${encodeURIComponent(dateParam)}`,
          { method: "DELETE" }
        );
      } else {
        await csrfFetch(`/api/schedule/${event._id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isCancelled: false, cancellationReason: null }),
        });
      }
      onUpdated();
      onClose();
    } catch (err) {
      console.error("Restore failed:", err);
    } finally {
      setRestoring(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await csrfFetch(`/api/schedule/${event._id}`, { method: "DELETE" });
      if (res.ok) { onUpdated(); onClose(); }
    } catch (err) {
      console.error("Delete failed:", err);
    } finally {
      setDeleting(false);
    }
  }

  const meta = TYPE_META[event.type] || TYPE_META.lesson;
  const TypeIcon = meta.icon;
  const eventColor = event.color || getEventColor(event.type);
  const canMarkAttendance = ["lesson", "test", "meeting"].includes(event.type);

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-ink/20 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="fixed right-0 top-0 z-50 h-full w-full max-w-md overflow-y-auto border-l border-ink/10 bg-paper shadow-xl">
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-ink/10 bg-paper p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px]"
                style={{ backgroundColor: `${eventColor}20` }}
              >
                <TypeIcon size={20} weight="fill" style={{ color: eventColor }} />
              </div>
              <div>
                <div className="text-xs font-medium uppercase tracking-wider text-ink/50">
                  {locale === "uk" ? meta.uk : meta.pl}
                </div>
                <div className="mt-0.5 flex gap-1.5 flex-wrap">
                  {isCancelled && (
                    <span className="rounded-full bg-terracotta/10 px-2 py-0.5 text-xs font-semibold text-terracotta">
                      {locale === "uk" ? "Скасовано" : "Anulowane"}
                    </span>
                  )}
                  {attendance?.conducted && !isCancelled && (
                    <span className="rounded-full bg-moss/10 px-2 py-0.5 text-xs font-semibold text-moss">
                      {locale === "uk" ? "Проведено" : "Przeprowadzone"}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button onClick={onClose} className="rounded-full border border-ink/10 p-2 hover:bg-ink/5">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="space-y-5 p-6">
          {/* Title + class */}
          <div>
            <h2 className="text-2xl font-semibold">{event.title}</h2>
            {event.className && (
              <p className="mt-1 text-sm text-ink/60">📚 {event.className}</p>
            )}
          </div>

          {/* Time */}
          <div className="flex items-center gap-3 rounded-[16px] border border-ink/10 bg-ink/5 p-4">
            <Clock size={20} className="shrink-0 text-ink/60" weight="fill" />
            <div>
              <div className="font-medium">
                {effectiveDate.toLocaleDateString(locale === "uk" ? "uk-UA" : "pl-PL", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </div>
              <div className="text-sm text-ink/60">
                {formatEventTime(new Date(event.startTime), new Date(event.endTime), locale)}
              </div>
            </div>
          </div>

          {/* Description */}
          {event.description && (
            <p className="text-sm text-ink/70 leading-relaxed">{event.description}</p>
          )}

          {/* Location */}
          {event.location && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin size={16} weight="fill" className="shrink-0 text-ink/50" />
              <span>{event.location}</span>
            </div>
          )}

          {/* Meeting link */}
          {event.meetingLink && (
            <div className="flex items-center gap-2 text-sm">
              <LinkIcon size={16} weight="bold" className="shrink-0 text-ink/50" />
              <a
                href={event.meetingLink}
                target="_blank"
                rel="noopener noreferrer"
                className="truncate text-moss hover:underline"
              >
                {event.meetingLink}
              </a>
            </div>
          )}

          {/* Recurrence info */}
          {event.isRecurring && event.recurrence && (
            <div className="flex items-center gap-2 rounded-[16px] border border-ink/10 bg-ink/5 px-4 py-3 text-sm">
              <Repeat size={16} className="shrink-0 text-ink/50" />
              <span className="text-ink/70">{getRecurrenceDescription(event.recurrence, locale)}</span>
            </div>
          )}

          {/* Cancelled banner */}
          {isCancelled && (
            <div className="rounded-[16px] border border-terracotta/20 bg-terracotta/5 p-4">
              <p className="font-semibold text-terracotta">
                {locale === "uk" ? "Заняття скасовано" : "Zajęcie anulowane"}
              </p>
              {cancellationReason && (
                <p className="mt-1 text-sm text-terracotta/70">{cancellationReason}</p>
              )}
              {isTeacher && (
                <button
                  onClick={handleRestoreOccurrence}
                  disabled={restoring}
                  className="mt-3 flex items-center gap-1.5 text-sm font-medium text-terracotta hover:underline disabled:opacity-50"
                >
                  <ArrowCounterClockwise size={14} />
                  {restoring ? "..." : (locale === "uk" ? "Відновити" : "Przywróć")}
                </button>
              )}
            </div>
          )}

          {/* Attendance summary (if conducted) */}
          {isTeacher && attendance?.conducted && !isCancelled && (
            <div className="rounded-[16px] border border-moss/20 bg-moss/5 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-moss">
                    {locale === "uk" ? "Урок проведено" : "Lekcja przeprowadzona"}
                  </p>
                  <p className="mt-0.5 text-sm text-moss/70">
                    {attendance.students.filter((s: any) => s.status === "present" || s.status === "late").length}/
                    {attendance.students.length} {locale === "uk" ? "присутніх" : "obecnych"}
                  </p>
                </div>
                <button
                  onClick={() => setShowAttendance(true)}
                  className="text-sm font-medium text-moss hover:underline"
                >
                  {locale === "uk" ? "Переглянути" : "Sprawdź"}
                </button>
              </div>
            </div>
          )}

          {/* Teacher Controls */}
          {isTeacher && !isCancelled && (
            <div className="space-y-3 border-t border-ink/10 pt-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-ink/40">
                {locale === "uk" ? "Керування" : "Zarządzanie"}
              </p>

              {/* Mark attendance */}
              {canMarkAttendance && !attendance?.conducted && (
                <button
                  onClick={() => setShowAttendance(true)}
                  className="flex w-full items-center gap-3 rounded-[16px] border border-moss/20 bg-moss/10 p-4 text-left transition-all hover:bg-moss/20"
                >
                  <CheckCircle size={20} weight="fill" className="shrink-0 text-moss" />
                  <div>
                    <div className="font-semibold text-moss">
                      {locale === "uk" ? "Відмітити проведення та відвідуваність" : "Oznacz prowadzenie i frekwencję"}
                    </div>
                    <div className="mt-0.5 text-xs text-moss/60">
                      {locale === "uk" ? "Хто був присутній, нотатки до уроку" : "Kto był obecny, notatki do lekcji"}
                    </div>
                  </div>
                </button>
              )}

              {/* Edit */}
              <button
                onClick={() => setShowEdit(true)}
                className="flex w-full items-center gap-3 rounded-[16px] border border-ink/10 bg-paper p-4 text-left transition-all hover:bg-ink/5"
              >
                <PencilSimple size={20} className="shrink-0 text-ink/60" />
                <span className="font-medium">
                  {locale === "uk" ? "Редагувати подію" : "Edytuj wydarzenie"}
                </span>
              </button>

              {/* Cancel */}
              {!showCancelConfirm ? (
                <button
                  onClick={() => setShowCancelConfirm(true)}
                  className="flex w-full items-center gap-3 rounded-[16px] border border-terracotta/20 bg-terracotta/5 p-4 text-left transition-all hover:bg-terracotta/10"
                >
                  <XCircle size={20} className="shrink-0 text-terracotta" />
                  <span className="font-medium text-terracotta">
                    {event.isRecurring
                      ? (locale === "uk" ? "Скасувати це заняття" : "Anuluj to zajęcie")
                      : (locale === "uk" ? "Скасувати подію" : "Anuluj wydarzenie")}
                  </span>
                </button>
              ) : (
                <div className="rounded-[16px] border border-terracotta/20 bg-terracotta/5 p-4 space-y-3">
                  <p className="text-sm font-medium text-terracotta">
                    {locale === "uk" ? "Причина скасування (опційно):" : "Powód anulowania (opcjonalne):"}
                  </p>
                  <textarea
                    value={cancelReason}
                    onChange={e => setCancelReason(e.target.value)}
                    rows={2}
                    className="w-full rounded-[12px] border border-terracotta/20 bg-paper px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-terracotta/20"
                    placeholder={locale === "uk" ? "напр. Хвороба вчителя" : "np. Choroba nauczyciela"}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowCancelConfirm(false)}
                      className="flex-1 rounded-full border border-ink/10 py-2 text-sm font-medium hover:bg-ink/5"
                    >
                      {locale === "uk" ? "Назад" : "Wróć"}
                    </button>
                    <button
                      onClick={handleCancelOccurrence}
                      disabled={cancelling}
                      className="flex-1 rounded-full bg-terracotta py-2 text-sm font-semibold text-paper hover:bg-terracotta/90 disabled:opacity-50"
                    >
                      {cancelling ? "..." : (locale === "uk" ? "Скасувати" : "Anuluj")}
                    </button>
                  </div>
                </div>
              )}

              {/* Delete series */}
              {!showDeleteConfirm ? (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex w-full items-center gap-3 rounded-[16px] border border-ink/10 p-4 text-left text-ink/40 transition-all hover:bg-ink/5"
                >
                  <Trash size={20} className="shrink-0" />
                  <span className="text-sm">
                    {event.isRecurring
                      ? (locale === "uk" ? "Видалити всю серію" : "Usuń całą serię")
                      : (locale === "uk" ? "Видалити подію" : "Usuń wydarzenie")}
                  </span>
                </button>
              ) : (
                <div className="rounded-[16px] border border-ink/10 bg-ink/5 p-4 space-y-3">
                  <p className="text-sm text-ink/70">
                    {event.isRecurring
                      ? (locale === "uk" ? "Видалити всю серію занять безповоротно?" : "Usunąć całą serię zajęć bezpowrotnie?")
                      : (locale === "uk" ? "Видалити цю подію безповоротно?" : "Usunąć to wydarzenie bezpowrotnie?")}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="flex-1 rounded-full border border-ink/10 py-2 text-sm font-medium hover:bg-ink/5"
                    >
                      {locale === "uk" ? "Назад" : "Wróć"}
                    </button>
                    <button
                      onClick={handleDelete}
                      disabled={deleting}
                      className="flex-1 rounded-full bg-ink py-2 text-sm font-semibold text-paper hover:bg-ink/90 disabled:opacity-50"
                    >
                      {deleting ? "..." : (locale === "uk" ? "Видалити" : "Usuń")}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Attendance Modal */}
      {showAttendance && (
        <AttendanceModal
          event={event}
          occurrenceDate={effectiveDate}
          existingAttendance={attendance}
          onClose={() => { setShowAttendance(false); loadAttendance(); }}
          onSaved={() => { setShowAttendance(false); loadAttendance(); onUpdated(); }}
        />
      )}

      {/* Edit Modal */}
      {showEdit && (
        <CreateEventModal
          isOpen={showEdit}
          onClose={() => setShowEdit(false)}
          classId={event.classId?.toString() || ""}
          classes={teacherClasses}
          onEventCreated={() => { setShowEdit(false); onUpdated(); }}
          existingEvent={event}
        />
      )}
    </>
  );
}
