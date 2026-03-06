"use client";

import { useState, useEffect, useMemo, useRef } from "react";
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

const HOUR_HEIGHT = 60;   // px per hour
const START_HOUR = 7;     // 07:00
const END_HOUR = 22;      // 22:00
const TOTAL_HOURS = END_HOUR - START_HOUR;
const HOURS = Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => i + START_HOUR);
const TIME_GUTTER = 52;   // px width of time axis

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

function buildOccurrences(
  events: ScheduleEvent[],
  rangeStart: Date,
  rangeEnd: Date
): CalendarOccurrence[] {
  const result: CalendarOccurrence[] = [];
  for (const event of events) {
    for (const occ of generateOccurrencesWithOverrides(event, rangeStart, rangeEnd)) {
      result.push({
        event,
        start: occ.start,
        end: occ.end,
        title: occ.title,
        cancelled: occ.cancelled,
        rescheduled: occ.rescheduled,
      });
    }
  }
  return result.sort((a, b) => a.start.getTime() - b.start.getTime());
}

function getWeekMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
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
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function minutesFromStart(date: Date): number {
  return (date.getHours() - START_HOUR) * 60 + date.getMinutes();
}

function timeToTop(date: Date): number {
  return Math.max(0, (minutesFromStart(date) / 60) * HOUR_HEIGHT);
}

function eventBlockHeight(start: Date, end: Date): number {
  const startMin = Math.max(minutesFromStart(start), 0);
  const endMin = Math.min(minutesFromStart(end), TOTAL_HOURS * 60);
  return Math.max(((endMin - startMin) / 60) * HOUR_HEIGHT, 22);
}

// Greedy column assignment for overlapping events
function assignColumns(occs: CalendarOccurrence[]): Array<{ occ: CalendarOccurrence; col: number; totalCols: number }> {
  if (occs.length === 0) return [];

  // Build overlap groups
  const sorted = [...occs].map((occ, idx) => ({ occ, idx })).sort(
    (a, b) => a.occ.start.getTime() - b.occ.start.getTime()
  );

  // For each event, find which column it can go in
  const colEnds: Date[] = [];
  const assignments: number[] = new Array(sorted.length);

  for (let i = 0; i < sorted.length; i++) {
    const { occ } = sorted[i];
    let col = 0;
    while (col < colEnds.length && colEnds[col] > occ.start) col++;
    assignments[i] = col;
    if (col === colEnds.length) colEnds.push(occ.end);
    else colEnds[col] = occ.end;
  }

  // Find total columns needed per event (look at overlapping group)
  const result: Array<{ occ: CalendarOccurrence; col: number; totalCols: number }> = [];
  for (let i = 0; i < sorted.length; i++) {
    const { occ } = sorted[i];
    // Count max columns used by events that overlap with this one
    let maxCol = assignments[i];
    for (let j = 0; j < sorted.length; j++) {
      if (j !== i) {
        const other = sorted[j].occ;
        const overlaps = occ.start < other.end && occ.end > other.start;
        if (overlaps) maxCol = Math.max(maxCol, assignments[j]);
      }
    }
    result.push({ occ, col: assignments[i], totalCols: maxCol + 1 });
  }

  return result;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SimpleCalendar({
  classId,
  locale,
  isTeacher,
  onCreateEvent,
  onEventClick,
}: SimpleCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [rawEvents, setRawEvents] = useState<ScheduleEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const scrollRef = useRef<HTMLDivElement>(null);

  const t = locale === "uk"
    ? { today: "Сьогодні", month: "Місяць", week: "Тиждень", list: "Список", createEvent: "Створити подію", noEvents: "Немає подій у цьому місяці" }
    : { today: "Dziś", month: "Miesiąc", week: "Tydzień", list: "Lista", createEvent: "Utwórz", noEvents: "Brak wydarzeń w tym miesiącu" };

  const loc = locale === "uk" ? "uk-UA" : "pl-PL";
  const today = useMemo(() => new Date(), []);

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

  const occurrences = useMemo(
    () => buildOccurrences(rawEvents, rangeStart, rangeEnd),
    [rawEvents, rangeStart, rangeEnd]
  );

  // ── Load events ─────────────────────────────────────────────────────────────

  useEffect(() => { loadEvents(); }, [classId, rangeStart.toISOString()]);

  async function loadEvents() {
    try {
      setLoading(true);
      const res = await fetch(
        `/api/classes/${classId}/schedule?start=${rangeStart.toISOString()}&end=${rangeEnd.toISOString()}`
      );
      const data = await res.json();
      if (res.ok) setRawEvents((data.events || []).map(normalizeEvent));
    } catch (err) {
      console.error("Failed to load events:", err);
    } finally {
      setLoading(false);
    }
  }

  // ── Auto-scroll to current time in week view ────────────────────────────────

  useEffect(() => {
    if (viewMode === "week" && scrollRef.current) {
      const nowTop = timeToTop(today);
      const offset = Math.max(0, nowTop - 120); // show some context above
      setTimeout(() => {
        scrollRef.current?.scrollTo({ top: offset, behavior: "smooth" });
      }, 100);
    }
  }, [viewMode]);

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

  // ── Range label ─────────────────────────────────────────────────────────────

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

  // ── Header ──────────────────────────────────────────────────────────────────

  function renderHeader() {
    return (
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        {/* Navigation */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={goBack}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-ink/10 bg-paper transition-colors hover:bg-ink/5"
          >
            <CaretLeft size={16} weight="bold" />
          </button>
          <span className="min-w-[210px] text-center text-base font-bold capitalize">
            {rangeLabel}
          </span>
          <button
            onClick={goForward}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-ink/10 bg-paper transition-colors hover:bg-ink/5"
          >
            <CaretRight size={16} weight="bold" />
          </button>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentDate(new Date())}
            className="rounded-xl border border-ink/10 bg-paper px-3 py-2 text-sm font-medium transition-colors hover:bg-ink/5"
          >
            {t.today}
          </button>

          {/* View switcher */}
          <div className="flex overflow-hidden rounded-xl border border-ink/10">
            {(["month", "week", "list"] as ViewMode[]).map((mode) => (
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
              className="inline-flex items-center gap-1.5 rounded-xl bg-moss px-4 py-2 text-sm font-semibold text-paper shadow-sm transition-all hover:bg-moss/90 hover:shadow-md"
            >
              <Plus size={15} weight="bold" />
              {t.createEvent}
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── Month View ───────────────────────────────────────────────────────────────

  function renderMonth() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startDow = firstDay.getDay(); // 0=Sun

    const shortDays = locale === "uk"
      ? ["Нд", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"]
      : ["Nd", "Pn", "Wt", "Śr", "Cz", "Pt", "So"];

    const cells: (number | null)[] = [
      ...Array(startDow).fill(null),
      ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ];

    function getOccs(day: number) {
      return occurrences.filter(
        (occ) =>
          occ.start.getFullYear() === year &&
          occ.start.getMonth() === month &&
          occ.start.getDate() === day
      );
    }

    return (
      <div className="overflow-hidden rounded-2xl border border-ink/10 shadow-soft">
        {/* Day name headers */}
        <div className="grid grid-cols-7 border-b border-ink/10 bg-ink/[0.03]">
          {shortDays.map((n) => (
            <div
              key={n}
              className="py-3 text-center text-[11px] font-semibold uppercase tracking-widest text-ink/40"
            >
              {n}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-7">
          {cells.map((day, idx) => {
            if (day === null) {
              return (
                <div
                  key={`e-${idx}`}
                  className="min-h-[110px] border-b border-r border-ink/[0.05] bg-ink/[0.015]"
                />
              );
            }

            const dayOccs = getOccs(day);
            const isT = isSameDay(new Date(year, month, day), today);
            const isLastRow = idx >= cells.length - 7;
            const isRightEdge = (idx + 1) % 7 === 0;
            const d = new Date(year, month, day);

            return (
              <div
                key={day}
                className={`group relative min-h-[110px] border-b border-r border-ink/[0.05] p-2 transition-colors
                  ${isT ? "bg-moss/[0.03]" : "bg-paper hover:bg-ink/[0.01]"}
                  ${isLastRow ? "border-b-0" : ""}
                  ${isRightEdge ? "border-r-0" : ""}
                `}
              >
                {/* Date number */}
                <div className="mb-1.5 flex items-center justify-between">
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold transition-all
                      ${isT ? "bg-moss text-paper shadow-sm" : "text-ink/70 hover:bg-ink/5"}
                    `}
                  >
                    {day}
                  </span>
                  {isTeacher && onCreateEvent && (
                    <button
                      onClick={() => onCreateEvent(d)}
                      className="hidden h-6 w-6 items-center justify-center rounded-lg text-ink/30 transition-all hover:bg-moss/15 hover:text-moss group-hover:flex"
                    >
                      <Plus size={12} weight="bold" />
                    </button>
                  )}
                </div>

                {/* Events */}
                <div className="space-y-1">
                  {dayOccs.slice(0, 3).map((occ, i) => {
                    const color = occ.event.color || getEventColor(occ.event.type);
                    const timeStr = occ.start.toLocaleTimeString(loc, { hour: "2-digit", minute: "2-digit" });
                    return (
                      <button
                        key={`${occ.event._id}-${i}`}
                        onClick={() => onEventClick?.(occ.event, occ.start)}
                        title={`${occ.title} · ${timeStr}`}
                        className={`group/pill flex w-full items-center gap-1 overflow-hidden rounded-md px-1.5 py-0.5 text-left transition-all hover:brightness-110
                          ${occ.cancelled ? "opacity-40" : ""}
                        `}
                        style={{ backgroundColor: color }}
                      >
                        <span className={`flex-1 truncate text-[11px] font-semibold leading-tight text-white ${occ.cancelled ? "line-through" : ""}`}>
                          {occ.title}
                        </span>
                        <span className="shrink-0 text-[10px] text-white/70">{timeStr}</span>
                      </button>
                    );
                  })}
                  {dayOccs.length > 3 && (
                    <div className="px-1 text-[11px] font-medium text-ink/40">
                      +{dayOccs.length - 3} {locale === "uk" ? "ще" : "więcej"}
                    </div>
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
    const totalHeight = TOTAL_HOURS * HOUR_HEIGHT;

    const shortDays = locale === "uk"
      ? ["Нд", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"]
      : ["Nd", "Pn", "Wt", "Śr", "Cz", "Pt", "So"];

    function getDayOccs(date: Date) {
      return occurrences.filter(
        (occ) =>
          isSameDay(occ.start, date) &&
          occ.start.getHours() < END_HOUR &&
          occ.end.getHours() >= START_HOUR
      );
    }

    return (
      <div className="overflow-hidden rounded-2xl border border-ink/10 shadow-soft">
        {/* Sticky day headers */}
        <div className="flex border-b border-ink/10 bg-paper">
          {/* Time gutter header */}
          <div className="shrink-0 border-r border-ink/[0.06] bg-ink/[0.02]" style={{ width: TIME_GUTTER }} />
          {weekDays.map((day, i) => {
            const isT = isSameDay(day, today);
            const hasEvents = getDayOccs(day).length > 0;
            return (
              <div
                key={i}
                className={`flex flex-1 flex-col items-center border-r border-ink/[0.06] py-3 last:border-r-0 ${isT ? "bg-moss/[0.03]" : ""}`}
              >
                <span className={`text-[11px] font-semibold uppercase tracking-wider ${isT ? "text-moss" : "text-ink/40"}`}>
                  {shortDays[day.getDay()]}
                </span>
                <span
                  className={`mt-1 flex h-8 w-8 items-center justify-center rounded-full text-base font-bold transition-all
                    ${isT ? "bg-moss text-paper shadow-sm" : "text-ink/80"}
                  `}
                >
                  {day.getDate()}
                </span>
                {hasEvents && !isT && (
                  <div className="mt-1 h-1 w-1 rounded-full bg-ink/20" />
                )}
              </div>
            );
          })}
        </div>

        {/* Scrollable time grid */}
        <div
          ref={scrollRef}
          className="overflow-y-auto"
          style={{ maxHeight: 580 }}
        >
          <div className="flex" style={{ height: totalHeight }}>
            {/* Time gutter */}
            <div className="relative shrink-0 border-r border-ink/[0.06] bg-ink/[0.02]" style={{ width: TIME_GUTTER }}>
              {HOURS.slice(0, -1).map((h) => (
                <div
                  key={h}
                  className="absolute right-0 flex w-full items-center justify-end pr-2"
                  style={{ top: (h - START_HOUR) * HOUR_HEIGHT - 9, height: 18 }}
                >
                  <span className="text-[11px] font-medium text-ink/30">
                    {String(h).padStart(2, "0")}:00
                  </span>
                </div>
              ))}
            </div>

            {/* Day columns */}
            {weekDays.map((day, di) => {
              const isT = isSameDay(day, today);
              const dayOccs = getDayOccs(day);
              const placed = assignColumns(dayOccs);
              const nowTop = timeToTop(today);
              const showNowLine = isT && today.getHours() >= START_HOUR && today.getHours() < END_HOUR;

              return (
                <div
                  key={di}
                  className={`relative flex-1 border-r border-ink/[0.06] last:border-r-0 ${isT ? "bg-moss/[0.025]" : "bg-paper"}`}
                  style={{ height: totalHeight }}
                >
                  {/* Hour lines */}
                  {HOURS.slice(0, -1).map((h) => (
                    <div
                      key={h}
                      className="pointer-events-none absolute left-0 right-0 border-t border-ink/[0.06]"
                      style={{ top: (h - START_HOUR) * HOUR_HEIGHT }}
                    />
                  ))}

                  {/* Half-hour lines */}
                  {HOURS.slice(0, -1).map((h) => (
                    <div
                      key={`h-${h}`}
                      className="pointer-events-none absolute left-0 right-0 border-t border-ink/[0.03]"
                      style={{ top: (h - START_HOUR) * HOUR_HEIGHT + HOUR_HEIGHT / 2 }}
                    />
                  ))}

                  {/* Current time line */}
                  {showNowLine && (
                    <div
                      className="pointer-events-none absolute left-0 right-0 z-20 flex items-center"
                      style={{ top: nowTop }}
                    >
                      <div className="h-2.5 w-2.5 rounded-full bg-terracotta shadow-sm" />
                      <div className="h-[1.5px] flex-1 bg-terracotta/50" />
                    </div>
                  )}

                  {/* Click-to-create overlay */}
                  {isTeacher && onCreateEvent && (
                    <div
                      className="absolute inset-0 z-0 cursor-crosshair"
                      onClick={(e) => {
                        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                        const y = e.clientY - rect.top;
                        const hours = Math.floor(y / HOUR_HEIGHT) + START_HOUR;
                        const minsRaw = (y % HOUR_HEIGHT) / HOUR_HEIGHT * 60;
                        const mins = Math.round(minsRaw / 15) * 15;
                        const d = new Date(day);
                        d.setHours(Math.min(hours, END_HOUR - 1), mins === 60 ? 0 : mins, 0, 0);
                        if (mins === 60) d.setHours(d.getHours() + 1);
                        onCreateEvent(d);
                      }}
                    />
                  )}

                  {/* Events */}
                  {placed.map(({ occ, col, totalCols }, i) => {
                    const color = occ.event.color || getEventColor(occ.event.type);
                    const top = timeToTop(occ.start);
                    const height = eventBlockHeight(occ.start, occ.end);
                    const colW = `${100 / totalCols}%`;
                    const colL = `${(col / totalCols) * 100}%`;
                    const showTime = height > 38;
                    const showTitle = height > 20;

                    return (
                      <button
                        key={`${occ.event._id}-${i}`}
                        onClick={(e) => { e.stopPropagation(); onEventClick?.(occ.event, occ.start); }}
                        className={`absolute z-10 overflow-hidden rounded-lg border px-2 py-1 text-left shadow-sm transition-all hover:brightness-110 hover:shadow-md hover:z-30
                          ${occ.cancelled ? "opacity-40" : ""}
                        `}
                        style={{
                          top,
                          height,
                          left: `calc(${colL} + 2px)`,
                          width: `calc(${colW} - 4px)`,
                          backgroundColor: `${color}ee`,
                          borderColor: color,
                        }}
                        title={`${occ.title} · ${formatEventTime(occ.start, occ.end, locale)}`}
                      >
                        {showTitle && (
                          <div className={`truncate text-[11px] font-semibold leading-tight text-white ${occ.cancelled ? "line-through" : ""}`}>
                            {occ.title}
                          </div>
                        )}
                        {showTime && (
                          <div className="mt-0.5 truncate text-[10px] text-white/80">
                            {formatEventTime(occ.start, occ.end, locale)}
                          </div>
                        )}
                        {occ.rescheduled && !occ.cancelled && height > 50 && (
                          <div className="mt-0.5 text-[10px] text-white/70">
                            ↪ {locale === "uk" ? "Перенесено" : "Przełożono"}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ── List View ────────────────────────────────────────────────────────────────

  function renderList() {
    if (occurrences.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-ink/10 bg-paper py-16 shadow-soft">
          <div className="mb-3 text-5xl opacity-30">📅</div>
          <p className="text-sm font-medium text-ink/40">{t.noEvents}</p>
          {isTeacher && onCreateEvent && (
            <button
              onClick={() => onCreateEvent()}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-moss px-5 py-2.5 text-sm font-semibold text-paper transition-all hover:bg-moss/90 hover:shadow-md"
            >
              <Plus size={16} weight="bold" />
              {t.createEvent}
            </button>
          )}
        </div>
      );
    }

    // Group by date
    const groups: Map<string, CalendarOccurrence[]> = new Map();
    for (const occ of occurrences) {
      const key = occ.start.toDateString();
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(occ);
    }

    return (
      <div className="space-y-6">
        {Array.from(groups.entries()).map(([dateStr, occs]) => {
          const date = new Date(dateStr);
          const isT = isSameDay(date, today);
          const isTomorrow = isSameDay(date, new Date(today.getTime() + 86400000));

          return (
            <div key={dateStr}>
              {/* Date label */}
              <div className="mb-2.5 flex items-center gap-2.5">
                <div className={`h-2 w-2 rounded-full ${isT ? "bg-moss" : "bg-ink/20"}`} />
                <span className={`text-xs font-semibold uppercase tracking-wider ${isT ? "text-moss" : "text-ink/50"}`}>
                  {date.toLocaleDateString(loc, { weekday: "long", day: "numeric", month: "long" })}
                  {isT && <span className="ml-2 rounded-full bg-moss/10 px-2 py-0.5 normal-case tracking-normal text-moss">
                    {locale === "uk" ? "Сьогодні" : "Dziś"}
                  </span>}
                  {isTomorrow && <span className="ml-2 rounded-full bg-gold/10 px-2 py-0.5 normal-case tracking-normal text-gold">
                    {locale === "uk" ? "Завтра" : "Jutro"}
                  </span>}
                </span>
              </div>

              <div className="space-y-2">
                {occs.map((occ, i) => {
                  const color = occ.event.color || getEventColor(occ.event.type);
                  return (
                    <button
                      key={`${occ.event._id}-${i}`}
                      onClick={() => onEventClick?.(occ.event, occ.start)}
                      className={`flex w-full items-start gap-3 rounded-2xl border border-ink/10 bg-paper p-4 text-left shadow-soft transition-all hover:border-ink/20 hover:shadow-md
                        ${occ.cancelled ? "opacity-55" : ""}
                      `}
                    >
                      {/* Color bar */}
                      <div
                        className="mt-0.5 w-1 shrink-0 rounded-full self-stretch"
                        style={{ backgroundColor: color, minHeight: 36 }}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <span className={`font-semibold ${occ.cancelled ? "line-through text-ink/50" : "text-ink"}`}>
                            {occ.title}
                          </span>
                          <div className="flex shrink-0 gap-1.5">
                            {occ.cancelled && (
                              <span className="rounded-full bg-terracotta/10 px-2 py-0.5 text-[11px] font-semibold text-terracotta">
                                {locale === "uk" ? "Скасовано" : "Anulowano"}
                              </span>
                            )}
                            {occ.rescheduled && !occ.cancelled && (
                              <span className="rounded-full bg-gold/10 px-2 py-0.5 text-[11px] font-semibold text-gold">
                                {locale === "uk" ? "Перенесено" : "Przełożono"}
                              </span>
                            )}
                          </div>
                        </div>
                        <p className="mt-0.5 text-sm text-ink/55">
                          {formatEventTime(occ.start, occ.end, locale)}
                          {occ.event.location && (
                            <span className="ml-2">📍 {occ.event.location}</span>
                          )}
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

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div>
      {renderHeader()}
      {loading ? (
        <div className="flex items-center justify-center rounded-2xl border border-ink/10 bg-paper py-20 shadow-soft">
          <div className="flex flex-col items-center gap-3">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-moss border-t-transparent" />
            <span className="text-sm text-ink/40">
              {locale === "uk" ? "Завантаження розкладу..." : "Ładowanie harmonogramu..."}
            </span>
          </div>
        </div>
      ) : viewMode === "month" ? (
        renderMonth()
      ) : viewMode === "week" ? (
        renderWeek()
      ) : (
        renderList()
      )}
    </div>
  );
}
