"use client";

import { useState, useEffect } from "react";
import {
  Repeat,
  Chalkboard,
  ClipboardText,
  Exam,
  Users,
  Megaphone,
  PencilSimple,
  Trash,
  Plus,
  CaretDown,
  CaretUp,
  Clock,
} from "@phosphor-icons/react";
import { getEventColor, getRecurrenceDescription, generateOccurrencesWithOverrides } from "@/lib/schedule";
import type { ScheduleEvent } from "@/lib/schedule";
import { csrfFetch } from "@/lib/csrf-client";

interface Props {
  classId: string;
  locale: "uk" | "pl";
  onEdit: (event: ScheduleEvent) => void;
  onCreateRecurring: () => void;
}

const TYPE_META: Record<string, { icon: any; uk: string; pl: string }> = {
  lesson: { icon: Chalkboard, uk: "Урок", pl: "Lekcja" },
  assignment_deadline: { icon: ClipboardText, uk: "Дедлайн", pl: "Termin" },
  test: { icon: Exam, uk: "Тест", pl: "Test" },
  meeting: { icon: Users, uk: "Зустріч", pl: "Spotkanie" },
  announcement: { icon: Megaphone, uk: "Оголошення", pl: "Ogłoszenie" },
};

function normalizeEvent(e: any): ScheduleEvent {
  return {
    ...e,
    startTime: new Date(e.startTime),
    endTime: new Date(e.endTime),
    recurrence: e.recurrence
      ? {
          ...e.recurrence,
          endDate: e.recurrence.endDate ? new Date(e.recurrence.endDate) : undefined,
          exceptions: e.recurrence.exceptions?.map((d: string) => new Date(d)),
        }
      : undefined,
    overrides: e.overrides?.map((o: any) => ({
      ...o,
      originalDate: new Date(o.originalDate),
      newStartTime: o.newStartTime ? new Date(o.newStartTime) : undefined,
      newEndTime: o.newEndTime ? new Date(o.newEndTime) : undefined,
      createdAt: new Date(o.createdAt),
    })),
  };
}

function getNextOccurrence(event: ScheduleEvent): Date | null {
  const now = new Date();
  const end = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000); // 90 days ahead
  const occs = generateOccurrencesWithOverrides(event, now, end);
  const next = occs.find(o => !o.cancelled && o.start >= now);
  return next?.start ?? null;
}

function formatTime(date: Date, locale: "uk" | "pl"): string {
  return date.toLocaleTimeString(locale === "uk" ? "uk-UA" : "pl-PL", { hour: "2-digit", minute: "2-digit" });
}

export default function RecurringSeriesList({ classId, locale, onEdit, onCreateRecurring }: Props) {
  const [series, setSeries] = useState<ScheduleEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const t = locale === "uk"
    ? {
        title: "Регулярні серії занять",
        noSeries: "Немає регулярних серій. Створіть першу!",
        nextLesson: "Наступне заняття",
        edit: "Редагувати серію",
        delete: "Видалити серію",
        confirmDelete: "Видалити всю серію безповоротно?",
        yes: "Видалити",
        no: "Скасувати",
        addSeries: "Додати серію",
        time: "Час",
        until: "до",
        cancelled: "Серія скасована",
      }
    : {
        title: "Stałe serie zajęć",
        noSeries: "Brak serii. Stwórz pierwszą!",
        nextLesson: "Następne zajęcie",
        edit: "Edytuj serię",
        delete: "Usuń serię",
        confirmDelete: "Usunąć całą serię bezpowrotnie?",
        yes: "Usuń",
        no: "Anuluj",
        addSeries: "Dodaj serię",
        time: "Czas",
        until: "do",
        cancelled: "Seria anulowana",
      };

  useEffect(() => { load(); }, [classId]);

  async function load() {
    try {
      setLoading(true);
      const res = await fetch(`/api/classes/${classId}/schedule`);
      if (!res.ok) return;
      const data = await res.json();
      const all: ScheduleEvent[] = (data.events || []).map(normalizeEvent);
      setSeries(all.filter(e => e.isRecurring));
    } catch (err) {
      console.error("Failed to load series:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(eventId: string) {
    setDeletingId(eventId);
    try {
      const res = await csrfFetch(`/api/schedule/${eventId}`, { method: "DELETE" });
      if (res.ok) {
        setSeries(prev => prev.filter(e => e._id?.toString() !== eventId));
        setConfirmDeleteId(null);
      }
    } catch (err) {
      console.error("Delete failed:", err);
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) return null;

  return (
    <div className="rounded-2xl border border-ink/10 bg-paper shadow-soft">
      {/* Header */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="flex w-full items-center justify-between px-6 py-4 transition-colors hover:bg-ink/[0.02]"
      >
        <div className="flex items-center gap-2.5">
          <Repeat size={20} weight="fill" className="text-moss" />
          <span className="font-semibold">{t.title}</span>
          {series.length > 0 && (
            <span className="rounded-full bg-moss/10 px-2 py-0.5 text-xs font-semibold text-moss">{series.length}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={e => { e.stopPropagation(); onCreateRecurring(); }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-moss px-3 py-1.5 text-xs font-semibold text-paper transition-colors hover:bg-moss/90"
          >
            <Plus size={14} weight="bold" />
            {t.addSeries}
          </button>
          {expanded ? <CaretUp size={16} className="text-ink/40" /> : <CaretDown size={16} className="text-ink/40" />}
        </div>
      </button>

      {/* Content */}
      {expanded && (
        <div className="border-t border-ink/10 p-4">
          {series.length === 0 ? (
            <div className="py-8 text-center">
              <Repeat size={36} weight="thin" className="mx-auto mb-3 text-ink/30" />
              <p className="text-sm text-ink/50">{t.noSeries}</p>
              <button
                onClick={onCreateRecurring}
                className="mt-4 inline-flex items-center gap-2 rounded-xl border border-moss/20 bg-moss/10 px-4 py-2 text-sm font-semibold text-moss transition-colors hover:bg-moss/20"
              >
                <Plus size={16} weight="bold" />
                {t.addSeries}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {series.map(event => {
                const id = event._id?.toString() ?? "";
                const meta = TYPE_META[event.type] || TYPE_META.lesson;
                const TypeIcon = meta.icon;
                const color = event.color || getEventColor(event.type);
                const nextOcc = getNextOccurrence(event);
                const isCancelled = event.isCancelled;

                return (
                  <div
                    key={id}
                    className={`overflow-hidden rounded-xl border transition-all ${isCancelled ? "border-ink/5 opacity-60" : "border-ink/10 hover:border-ink/20"}`}
                  >
                    {/* Color bar */}
                    <div className="h-1 w-full" style={{ backgroundColor: color }} />

                    <div className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        {/* Left: info */}
                        <div className="flex items-start gap-3 min-w-0">
                          <div
                            className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px]"
                            style={{ backgroundColor: `${color}20` }}
                          >
                            <TypeIcon size={18} weight="fill" style={{ color }} />
                          </div>
                          <div className="min-w-0">
                            <h4 className={`font-semibold text-ink ${isCancelled ? "line-through" : ""}`}>{event.title}</h4>
                            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink/55">
                              {/* Type */}
                              <span>{locale === "uk" ? meta.uk : meta.pl}</span>

                              {/* Recurrence pattern */}
                              {event.recurrence && (
                                <span className="flex items-center gap-1">
                                  <Repeat size={11} />
                                  {getRecurrenceDescription(event.recurrence, locale)}
                                </span>
                              )}

                              {/* Time of day */}
                              <span className="flex items-center gap-1">
                                <Clock size={11} />
                                {formatTime(event.startTime, locale)} – {formatTime(event.endTime, locale)}
                              </span>

                              {/* Until date */}
                              {event.recurrence?.endDate && (
                                <span>
                                  {t.until} {new Date(event.recurrence.endDate).toLocaleDateString(locale === "uk" ? "uk-UA" : "pl-PL", { day: "numeric", month: "short", year: "numeric" })}
                                </span>
                              )}
                            </div>

                            {/* Next occurrence */}
                            {nextOcc && !isCancelled && (
                              <div className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-moss/[0.08] px-2.5 py-1 text-xs font-medium text-moss">
                                <div className="h-1.5 w-1.5 rounded-full bg-moss" />
                                {t.nextLesson}: {nextOcc.toLocaleDateString(locale === "uk" ? "uk-UA" : "pl-PL", { weekday: "short", day: "numeric", month: "short" })}
                                {" · "}{formatTime(nextOcc, locale)}
                              </div>
                            )}

                            {isCancelled && (
                              <span className="mt-2 inline-block rounded-full bg-terracotta/10 px-2.5 py-1 text-xs font-medium text-terracotta">
                                {t.cancelled}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Right: actions */}
                        <div className="flex shrink-0 gap-1.5">
                          <button
                            onClick={() => onEdit(event)}
                            className="rounded-xl border border-ink/10 p-2 text-ink/50 transition-all hover:border-moss/20 hover:bg-moss/10 hover:text-moss"
                            title={t.edit}
                          >
                            <PencilSimple size={15} weight="bold" />
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(confirmDeleteId === id ? null : id)}
                            className="rounded-xl border border-ink/10 p-2 text-ink/50 transition-all hover:border-terracotta/20 hover:bg-terracotta/10 hover:text-terracotta"
                            title={t.delete}
                          >
                            <Trash size={15} weight="bold" />
                          </button>
                        </div>
                      </div>

                      {/* Confirm delete */}
                      {confirmDeleteId === id && (
                        <div className="mt-3 flex items-center justify-between rounded-xl border border-terracotta/20 bg-terracotta/5 px-4 py-3">
                          <p className="text-sm text-terracotta">{t.confirmDelete}</p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              className="rounded-lg border border-ink/10 px-3 py-1.5 text-xs font-medium hover:bg-ink/5"
                            >
                              {t.no}
                            </button>
                            <button
                              onClick={() => handleDelete(id)}
                              disabled={deletingId === id}
                              className="rounded-lg bg-terracotta px-3 py-1.5 text-xs font-semibold text-paper hover:bg-terracotta/90 disabled:opacity-50"
                            >
                              {deletingId === id ? "..." : t.yes}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
