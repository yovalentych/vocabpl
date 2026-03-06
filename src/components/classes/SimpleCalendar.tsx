"use client";

import { useState, useEffect, useMemo } from "react";
import { CaretLeft, CaretRight, Plus } from "@phosphor-icons/react";
import type { ScheduleEvent } from "@/lib/schedule";
import { getEventColor, formatEventTime, generateOccurrencesWithOverrides } from "@/lib/schedule";

// ─── Types ───────────────────────────────────────────────────────────────────

type ViewMode = "month" | "week" | "list";

type SimpleCalendarProps = {
  classId: string;
  locale: "uk" | "pl";
  isTeacher: boolean;
  onCreateEvent?: (date?: Date) => void;
  onEventClick?: (event: ScheduleEvent, occurrenceDate?: Date) => void;
};

type CalendarOccurrence = {
  event: ScheduleEvent;
  start: Date;
  end: Date;
  title: string;
  cancelled: boolean;
  rescheduled: boolean;
};

// ─── Constants ───────────────────────────────────────────────────────────────

const HOUR_HEIGHT = 56; // px per hour in week view
const START_HOUR = 7;   // 07:00
const END_HOUR = 22;    // 22:00
const HOURS = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => i + START_HOUR);

// ─── Helpers ─────────────────────────────────────────────────────────────────

function normalizeEvent(event: any): ScheduleEvent {
  return {
    ...event,
    startTime: new Date(event.startTime),
    endTime: new Date(event.endTime),
    recurrence: event.recurrence
      ? {
          ...event.recurrence,
          endDate: event.recurrence.endDate ? new Date(event.recurrence.endDate) : undefined,
          exceptions: event.recurrence.exceptions?.map((d: string) => new Date(d)),
        }
      : undefined,
    overrides: event.overrides?.map((o: any) => ({
      ...o,
      originalDate: new Date(o.originalDate),
      newStartTime: o.newStartTime ? new Date(o.newStartTime) : undefined,
      newEndTime: o.newEndTime ? new Date(o.newEndTime) : undefined,
      createdAt: new Date(o.createdAt),
    })),
  };
}

function buildOccurrences(events: ScheduleEvent[], rangeStart: Date, rangeEnd: Date): CalendarOccurrence[] {
  const result: CalendarOccurrence[] = [];
  for (const event of events) {
    for (const occ of generateOccurrencesWithOverrides(event, rangeStart, rangeEnd)) {
      result.push({ event, start: occ.start, end: occ.end, title: occ.title, cancelled: occ.cancelled, rescheduled: occ.rescheduled });
    }
  }
  return result.sort((a, b) => a.start.getTime() - b.start.getTime());
}

// Returns Monday of the week containing `date`
function getWeekMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getWeekDays(monday: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

// Pixel offset from top of grid for a given time
function timeToTop(date: Date): number {
  const totalMin = (date.getHours() - START_HOUR) * 60 + date.getMinutes();
  return Math.max(0, (totalMin / 60) * HOUR_HEIGHT);
}

function eventHeight(start: Date, end: Date): number {
  const clampedEnd = end.getHours() >= END_HOUR ? new Date(start.getFullYear(), start.getMonth(), start.getDate(), END_HOUR, 0) : end;
  const dur = Math.max(15, (clampedEnd.getTime() - start.getTime()) / 60000);
  return (dur / 60) * HOUR_HEIGHT;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SimpleCalendar({ classId, locale, isTeacher, onCreateEvent, onEventClick }: SimpleCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [rawEvents, setRawEvents] = useState<ScheduleEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("month");

  const t = locale === "uk"
    ? { today: "Сьогодні", month: "Місяць", week: "Тиждень", list: "Список", createEvent: "Створити подію", noEvents: "Немає подій" }
    : { today: "Dziś", month: "Miesiąc", week: "Tydzień", list: "Lista", createEvent: "Utwórz", noEvents: "Brak wydarzeń" };

  // ── Computed ranges ─────────────────────────────────────────────────────────

  const weekMonday = useMemo(() => getWeekMonday(currentDate), [currentDate]);
  const weekDays = useMemo(() => getWeekDays(weekMonday), [weekMonday]);

  const rangeStart = useMemo(() => {
    if (viewMode === "week") return weekMonday;
    return new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  }, [viewMode, currentDate, weekMonday]);

  const rangeEnd = useMemo(() => {
    if (viewMode === "week") {
      const d = new Date(weekMonday);
      d.setDate(d.getDate() + 6);
      d.setHours(23, 59, 59, 999);
      return d;
    }
    return new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59);
  }, [viewMode, currentDate, weekMonday]);

  const occurrences = useMemo(() => buildOccurrences(rawEvents, rangeStart, rangeEnd), [rawEvents, rangeStart, rangeEnd]);

  // ── Load ────────────────────────────────────────────────────────────────────

  useEffect(() => { loadEvents(); }, [classId, rangeStart.toISOString()]);

  async function loadEvents() {
    try {
      setLoading(true);
      const res = await fetch(`/api/classes/${classId}/schedule?start=${rangeStart.toISOString()}&end=${rangeEnd.toISOString()}`);
      const data = await res.json();
      if (res.ok) setRawEvents((data.events || []).map(normalizeEvent));
    } catch (err) {
      console.error("Failed to load events:", err);
    } finally {
      setLoading(false);
    }
  }

  // ── Navigation ──────────────────────────────────────────────────────────────

  function goBack() {
    if (viewMode === "week") {
      const d = new Date(currentDate);
      d.setDate(d.getDate() - 7);
      setCurrentDate(d);
    } else {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    }
  }

  function goForward() {
    if (viewMode === "week") {
      const d = new Date(currentDate);
      d.setDate(d.getDate() + 7);
      setCurrentDate(d);
    } else {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    }
  }

  // ── Labels ──────────────────────────────────────────────────────────────────

  const loc = locale === "uk" ? "uk-UA" : "pl-PL";

  const rangeLabel = useMemo(() => {
    if (viewMode === "week") {
      const sun = weekDays[6];
      if (weekMonday.getMonth() === sun.getMonth()) {
        return `${weekMonday.getDate()} – ${sun.toLocaleDateString(loc, { day: "numeric", month: "long", year: "numeric" })}`;
      }
      return `${weekMonday.toLocaleDateString(loc, { day: "numeric", month: "short" })} – ${sun.toLocaleDateString(loc, { day: "numeric", month: "short", year: "numeric" })}`;
    }
    return currentDate.toLocaleDateString(loc, { month: "long", year: "numeric" });
  }, [viewMode, currentDate, weekMonday, weekDays, loc]);

  const today = new Date();

  // ── Sub-renders ─────────────────────────────────────────────────────────────

  function renderHeader() {
    return (
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button onClick={goBack} className="rounded-xl border border-ink/10 p-2 transition-colors hover:bg-ink/5">
            <CaretLeft size={18} weight="bold" />
          </button>
          <span className="min-w-[200px] text-center text-base font-bold capitalize text-ink">{rangeLabel}</span>
          <button onClick={goForward} className="rounded-xl border border-ink/10 p-2 transition-colors hover:bg-ink/5">
            <CaretRight size={18} weight="bold" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentDate(new Date())}
            className="rounded-xl border border-ink/10 px-3 py-2 text-sm transition-colors hover:bg-ink/5"
          >
            {t.today}
          </button>

          {/* View switcher */}
          <div className="flex overflow-hidden rounded-xl border border-ink/10">
            {(["month", "week", "list"] as ViewMode[]).map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-2 text-sm font-medium transition-colors ${
                  viewMode === mode
                    ? "bg-moss text-paper"
                    : "bg-paper text-ink/60 hover:bg-ink/5"
                }`}
              >
                {t[mode]}
              </button>
            ))}
          </div>

          {isTeacher && onCreateEvent && (
            <button
              onClick={() => onCreateEvent()}
              className="inline-flex items-center gap-1.5 rounded-xl bg-moss px-3 py-2 text-sm font-semibold text-paper transition-colors hover:bg-moss/90"
            >
              <Plus size={16} weight="bold" />
              {t.createEvent}
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── Month View ───────────────────────────────────────────────────────────────

  function renderMonth() {
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const startingDayOfWeek = firstDayOfMonth.getDay();

    const dayNames = locale === "uk"
      ? ["Нд", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"]
      : ["Nd", "Pn", "Wt", "Śr", "Cz", "Pt", "So"];

    const calendarDays: (number | null)[] = [];
    for (let i = 0; i < startingDayOfWeek; i++) calendarDays.push(null);
    for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d);

    function getOccsForDay(day: number) {
      return occurrences.filter(occ =>
        occ.start.getFullYear() === currentDate.getFullYear() &&
        occ.start.getMonth() === currentDate.getMonth() &&
        occ.start.getDate() === day
      );
    }

    return (
      <div className="overflow-hidden rounded-2xl border border-ink/10 shadow-soft">
        <div className="grid grid-cols-7 border-b border-ink/10 bg-ink/[0.03]">
          {dayNames.map(n => (
            <div key={n} className="py-2.5 text-center text-xs font-semibold uppercase tracking-wider text-ink/50">{n}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {calendarDays.map((day, idx) => {
            if (day === null) return <div key={`e-${idx}`} className="min-h-[110px] border-b border-r border-ink/[0.06] bg-ink/[0.02]" />;
            const dayOccs = getOccsForDay(day);
            const isT = isSameDay(new Date(currentDate.getFullYear(), currentDate.getMonth(), day), today);
            const d = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
            return (
              <div
                key={day}
                className={`group min-h-[110px] border-b border-r border-ink/[0.06] p-2 transition-colors ${isT ? "bg-moss/[0.04]" : "bg-paper hover:bg-ink/[0.01]"}`}
              >
                <div className="mb-1.5 flex items-center justify-between">
                  <span className={`flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold transition-colors ${isT ? "bg-moss text-paper" : "text-ink hover:bg-ink/5"}`}>
                    {day}
                  </span>
                  {isTeacher && onCreateEvent && (
                    <button
                      onClick={() => onCreateEvent(d)}
                      className="hidden rounded-lg p-1 text-ink/30 transition-all hover:bg-moss/10 hover:text-moss group-hover:flex"
                      title={locale === "uk" ? "Додати подію" : "Dodaj"}
                    >
                      <Plus size={12} weight="bold" />
                    </button>
                  )}
                </div>
                <div className="space-y-1">
                  {dayOccs.slice(0, 3).map((occ, i) => (
                    <button
                      key={`${occ.event._id}-${i}`}
                      onClick={() => onEventClick?.(occ.event, occ.start)}
                      title={`${occ.title} · ${formatEventTime(occ.start, occ.end, locale)}`}
                      className={`w-full truncate rounded-md px-2 py-0.5 text-left text-xs font-medium transition-opacity hover:opacity-75 ${occ.cancelled ? "line-through opacity-40" : ""}`}
                      style={{ backgroundColor: `${occ.event.color || getEventColor(occ.event.type)}`, color: "white" }}
                    >
                      {occ.title}
                    </button>
                  ))}
                  {dayOccs.length > 3 && (
                    <div className="px-1 text-xs text-ink/40">+{dayOccs.length - 3} {locale === "uk" ? "ще" : "więcej"}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ── Week View ────────────────────────────────────────────────────────────────

  function renderWeek() {
    const totalHeight = HOURS.length * HOUR_HEIGHT;
    const shortDay = locale === "uk"
      ? ["Нд", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"]
      : ["Nd", "Pn", "Wt", "Śr", "Cz", "Pt", "So"];

    function getOccsForDate(date: Date) {
      return occurrences.filter(occ => isSameDay(occ.start, date));
    }

    return (
      <div className="overflow-hidden rounded-2xl border border-ink/10 shadow-soft">
        {/* Day header row */}
        <div className="flex border-b border-ink/10 bg-ink/[0.03]">
          <div className="w-14 shrink-0" /> {/* time gutter */}
          {weekDays.map((day, i) => {
            const isT = isSameDay(day, today);
            return (
              <div key={i} className={`flex-1 border-l border-ink/[0.06] py-3 text-center ${isT ? "bg-moss/[0.04]" : ""}`}>
                <div className="text-xs font-semibold uppercase tracking-wider text-ink/50">{shortDay[day.getDay()]}</div>
                <div className={`mx-auto mt-1 flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-colors ${isT ? "bg-moss text-paper" : "text-ink"}`}>
                  {day.getDate()}
                </div>
              </div>
            );
          })}
        </div>

        {/* Grid */}
        <div className="flex overflow-y-auto" style={{ maxHeight: "600px" }}>
          {/* Time gutter */}
          <div className="relative w-14 shrink-0" style={{ height: totalHeight }}>
            {HOURS.map(h => (
              <div
                key={h}
                className="absolute right-2 text-right text-xs text-ink/35"
                style={{ top: (h - START_HOUR) * HOUR_HEIGHT - 8 }}
              >
                {String(h).padStart(2, "0")}:00
              </div>
            ))}
          </div>

          {/* Day columns */}
          {weekDays.map((day, di) => {
            const isT = isSameDay(day, today);
            const dayOccs = getOccsForDate(day);

            return (
              <div
                key={di}
                className={`relative flex-1 border-l border-ink/[0.06] ${isT ? "bg-moss/[0.02]" : "bg-paper"}`}
                style={{ height: totalHeight }}
              >
                {/* Hour lines */}
                {HOURS.map(h => (
                  <div
                    key={h}
                    className="absolute left-0 right-0 border-t border-ink/[0.06]"
                    style={{ top: (h - START_HOUR) * HOUR_HEIGHT }}
                  />
                ))}

                {/* Current time indicator */}
                {isT && today.getHours() >= START_HOUR && today.getHours() < END_HOUR && (
                  <div
                    className="absolute left-0 right-0 z-10 flex items-center"
                    style={{ top: timeToTop(today) }}
                  >
                    <div className="h-2.5 w-2.5 shrink-0 rounded-full bg-terracotta" />
                    <div className="h-px flex-1 bg-terracotta/60" />
                  </div>
                )}

                {/* Click to create */}
                {isTeacher && onCreateEvent && (
                  <div
                    className="absolute inset-0 cursor-pointer"
                    onClick={e => {
                      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                      const y = e.clientY - rect.top;
                      const hours = Math.floor(y / HOUR_HEIGHT) + START_HOUR;
                      const mins = Math.round((y % HOUR_HEIGHT) / HOUR_HEIGHT * 60 / 15) * 15;
                      const d = new Date(day);
                      d.setHours(hours, mins, 0, 0);
                      onCreateEvent(d);
                    }}
                  />
                )}

                {/* Events */}
                {dayOccs.map((occ, i) => {
                  if (occ.start.getHours() >= END_HOUR || occ.end.getHours() <= START_HOUR) return null;
                  const top = timeToTop(occ.start);
                  const height = eventHeight(occ.start, occ.end);
                  const color = occ.event.color || getEventColor(occ.event.type);
                  return (
                    <button
                      key={`${occ.event._id}-${i}`}
                      onClick={e => { e.stopPropagation(); onEventClick?.(occ.event, occ.start); }}
                      className={`absolute left-1 right-1 z-20 overflow-hidden rounded-lg px-2 py-1 text-left text-xs font-medium text-paper shadow-sm transition-all hover:brightness-110 hover:shadow-md ${occ.cancelled ? "opacity-40" : ""}`}
                      style={{ top, height, backgroundColor: color }}
                      title={`${occ.title} · ${formatEventTime(occ.start, occ.end, locale)}`}
                    >
                      <div className={`leading-tight ${occ.cancelled ? "line-through" : ""}`}>{occ.title}</div>
                      {height > 36 && (
                        <div className="mt-0.5 truncate text-[10px] opacity-80">
                          {formatEventTime(occ.start, occ.end, locale)}
                        </div>
                      )}
                      {occ.rescheduled && !occ.cancelled && (
                        <div className="mt-0.5 text-[10px] opacity-90">↪ {locale === "uk" ? "Перенесено" : "Przełożono"}</div>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ── List View ────────────────────────────────────────────────────────────────

  function renderList() {
    if (occurrences.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-16 text-ink/40">
          <div className="mb-3 text-4xl">📅</div>
          <p>{t.noEvents}</p>
        </div>
      );
    }

    // Group by date
    const groups: Record<string, CalendarOccurrence[]> = {};
    for (const occ of occurrences) {
      const key = occ.start.toDateString();
      if (!groups[key]) groups[key] = [];
      groups[key].push(occ);
    }

    return (
      <div className="space-y-4">
        {Object.entries(groups).map(([dateStr, occs]) => {
          const date = new Date(dateStr);
          const isT = isSameDay(date, today);
          return (
            <div key={dateStr}>
              <div className={`mb-2 flex items-center gap-2 ${isT ? "text-moss" : "text-ink/50"}`}>
                <div className={`h-2 w-2 rounded-full ${isT ? "bg-moss" : "bg-ink/20"}`} />
                <span className="text-xs font-semibold uppercase tracking-wider">
                  {date.toLocaleDateString(loc, { weekday: "long", day: "numeric", month: "long" })}
                  {isT && ` · ${locale === "uk" ? "Сьогодні" : "Dziś"}`}
                </span>
              </div>
              <div className="space-y-2">
                {occs.map((occ, i) => {
                  const color = occ.event.color || getEventColor(occ.event.type);
                  return (
                    <button
                      key={`${occ.event._id}-${i}`}
                      onClick={() => onEventClick?.(occ.event, occ.start)}
                      className={`flex w-full items-start gap-3 rounded-2xl border border-ink/10 bg-paper p-4 text-left shadow-soft transition-all hover:shadow-md ${occ.cancelled ? "opacity-50" : ""}`}
                    >
                      <div className="mt-0.5 h-full w-1 shrink-0 self-stretch rounded-full" style={{ backgroundColor: color, minHeight: 40 }} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className={`font-semibold text-ink ${occ.cancelled ? "line-through" : ""}`}>{occ.title}</h4>
                          <div className="flex shrink-0 gap-1.5">
                            {occ.cancelled && (
                              <span className="rounded-full bg-terracotta/10 px-2 py-0.5 text-xs font-medium text-terracotta">
                                {locale === "uk" ? "Скасовано" : "Anulowano"}
                              </span>
                            )}
                            {occ.rescheduled && !occ.cancelled && (
                              <span className="rounded-full bg-gold/10 px-2 py-0.5 text-xs font-medium text-gold">
                                {locale === "uk" ? "Перенесено" : "Przełożono"}
                              </span>
                            )}
                          </div>
                        </div>
                        <p className="mt-1 text-sm text-ink/60">
                          {formatEventTime(occ.start, occ.end, locale)}
                          {occ.event.location && ` · 📍 ${occ.event.location}`}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // ── Main render ──────────────────────────────────────────────────────────────

  return (
    <div>
      {renderHeader()}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-ink/40">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-moss border-t-transparent" />
        </div>
      ) : viewMode === "month" ? renderMonth()
        : viewMode === "week" ? renderWeek()
        : renderList()}
    </div>
  );
}
