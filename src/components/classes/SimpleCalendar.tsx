"use client";

import { useState, useEffect, useMemo } from "react";
import { CaretLeft, CaretRight, Plus } from "@phosphor-icons/react";
import type { ScheduleEvent } from "@/lib/schedule";
import { getEventColor, formatEventTime, generateOccurrencesWithOverrides } from "@/lib/schedule";

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

// Normalize dates on an event from API (ISO strings → Date objects)
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
  monthStart: Date,
  monthEnd: Date
): CalendarOccurrence[] {
  const result: CalendarOccurrence[] = [];
  for (const event of events) {
    const occs = generateOccurrencesWithOverrides(event, monthStart, monthEnd);
    for (const occ of occs) {
      result.push({ event, start: occ.start, end: occ.end, title: occ.title, cancelled: occ.cancelled, rescheduled: occ.rescheduled });
    }
  }
  return result.sort((a, b) => a.start.getTime() - b.start.getTime());
}

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
  const [viewMode, setViewMode] = useState<"month" | "list">("month");

  const t = locale === "uk"
    ? { today: "Сьогодні", month: "Місяць", list: "Список", createEvent: "Створити подію", noEvents: "Немає подій" }
    : { today: "Dziś", month: "Miesiąc", list: "Lista", createEvent: "Utwórz", noEvents: "Brak wydarzeń" };

  const monthStart = useMemo(
    () => new Date(currentDate.getFullYear(), currentDate.getMonth(), 1),
    [currentDate]
  );
  const monthEnd = useMemo(
    () => new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59),
    [currentDate]
  );

  const occurrences = useMemo(
    () => buildOccurrences(rawEvents, monthStart, monthEnd),
    [rawEvents, monthStart, monthEnd]
  );

  useEffect(() => {
    loadEvents();
  }, [classId, currentDate]);

  async function loadEvents() {
    try {
      setLoading(true);
      const res = await fetch(
        `/api/classes/${classId}/schedule?start=${monthStart.toISOString()}&end=${monthEnd.toISOString()}`
      );
      const data = await res.json();
      if (res.ok) {
        setRawEvents((data.events || []).map(normalizeEvent));
      }
    } catch (error) {
      console.error("Failed to load events:", error);
    } finally {
      setLoading(false);
    }
  }

  const monthName = currentDate.toLocaleDateString(locale === "uk" ? "uk-UA" : "pl-PL", {
    month: "long",
    year: "numeric",
  });

  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const startingDayOfWeek = firstDayOfMonth.getDay();

  const dayNames = locale === "uk"
    ? ["Нд", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"]
    : ["Nd", "Pn", "Wt", "Śr", "Cz", "Pt", "So"];

  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < startingDayOfWeek; i++) calendarDays.push(null);
  for (let day = 1; day <= daysInMonth; day++) calendarDays.push(day);

  const today = new Date();
  const isToday = (day: number) =>
    day === today.getDate() &&
    currentDate.getMonth() === today.getMonth() &&
    currentDate.getFullYear() === today.getFullYear();

  function getOccurrencesForDay(day: number): CalendarOccurrence[] {
    return occurrences.filter(occ => {
      const d = occ.start;
      return (
        d.getFullYear() === currentDate.getFullYear() &&
        d.getMonth() === currentDate.getMonth() &&
        d.getDate() === day
      );
    });
  }

  function dayDate(day: number) {
    return new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
  }

  const Header = () => (
    <div className="mb-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))} className="p-2 rounded-lg hover:bg-ink/5 transition-colors">
          <CaretLeft size={20} weight="bold" />
        </button>
        <h3 className="min-w-[200px] text-center text-lg font-bold capitalize text-ink">{monthName}</h3>
        <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))} className="p-2 rounded-lg hover:bg-ink/5 transition-colors">
          <CaretRight size={20} weight="bold" />
        </button>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={() => setCurrentDate(new Date())} className="rounded-lg border border-ink/20 px-3 py-1.5 text-sm hover:bg-ink/5">{t.today}</button>
        <button onClick={() => setViewMode(viewMode === "month" ? "list" : "month")} className="rounded-lg border border-ink/20 px-3 py-1.5 text-sm hover:bg-ink/5">
          {viewMode === "month" ? t.list : t.month}
        </button>
        {isTeacher && onCreateEvent && (
          <button onClick={() => onCreateEvent()} className="inline-flex items-center gap-2 rounded-lg bg-moss px-3 py-1.5 text-sm font-semibold text-white hover:bg-moss/90">
            <Plus size={16} weight="bold" />
            {t.createEvent}
          </button>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div>
        <Header />
        <div className="flex items-center justify-center py-16 text-ink/50">
          {locale === "uk" ? "Завантаження..." : "Ładowanie..."}
        </div>
      </div>
    );
  }

  if (viewMode === "list") {
    return (
      <div>
        <Header />
        <div className="space-y-2">
          {occurrences.length === 0 ? (
            <div className="py-12 text-center text-ink/50">{t.noEvents}</div>
          ) : (
            occurrences.map((occ, idx) => (
              <button
                key={`${occ.event._id?.toString()}-${occ.start.toISOString()}-${idx}`}
                onClick={() => onEventClick?.(occ.event, occ.start)}
                className={`w-full rounded-xl border border-ink/10 p-4 text-left transition-colors hover:bg-ink/5 ${occ.cancelled ? "opacity-50" : ""}`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-1 h-full w-1 flex-shrink-0 rounded-full" style={{ backgroundColor: occ.event.color || getEventColor(occ.event.type) }} />
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className={`font-semibold text-ink ${occ.cancelled ? "line-through" : ""}`}>{occ.title}</h4>
                      <span className="text-xs text-ink/50">
                        {occ.start.toLocaleDateString(locale === "uk" ? "uk-UA" : "pl-PL")}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-ink/60">{formatEventTime(occ.start, occ.end, locale)}</p>
                    {occ.cancelled && (
                      <span className="mt-1 inline-block rounded-full bg-terracotta/10 px-2 py-0.5 text-xs text-terracotta">
                        {locale === "uk" ? "Скасовано" : "Odwołano"}
                      </span>
                    )}
                    {occ.rescheduled && !occ.cancelled && (
                      <span className="mt-1 inline-block rounded-full bg-gold/10 px-2 py-0.5 text-xs text-gold">
                        {locale === "uk" ? "Перенесено" : "Przełożono"}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header />
      <div className="overflow-hidden rounded-xl border border-ink/10">
        {/* Day headers */}
        <div className="grid grid-cols-7 bg-ink/5">
          {dayNames.map(day => (
            <div key={day} className="p-2 text-center text-xs font-semibold text-ink/60">{day}</div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7">
          {calendarDays.map((day, index) => {
            if (day === null) {
              return <div key={`empty-${index}`} className="border-l border-t border-ink/10 bg-ink/5 p-2" />;
            }

            const dayOccs = getOccurrencesForDay(day);
            const isTodayDate = isToday(day);

            return (
              <div
                key={day}
                className={`group min-h-[100px] border-l border-t border-ink/10 p-2 ${isTodayDate ? "bg-moss/5" : "bg-paper"}`}
              >
                <div className="mb-1 flex items-center justify-between">
                  <span className={`text-sm font-semibold ${isTodayDate ? "inline-flex h-6 w-6 items-center justify-center rounded-full bg-moss text-white" : "text-ink"}`}>
                    {day}
                  </span>
                  {isTeacher && onCreateEvent && (
                    <button
                      onClick={() => onCreateEvent(dayDate(day))}
                      className="hidden rounded p-0.5 text-ink/30 transition-all hover:bg-moss/10 hover:text-moss group-hover:block"
                      title={locale === "uk" ? "Додати подію" : "Dodaj wydarzenie"}
                    >
                      <Plus size={12} weight="bold" />
                    </button>
                  )}
                </div>

                <div className="space-y-1">
                  {dayOccs.slice(0, 3).map((occ, i) => (
                    <button
                      key={`${occ.event._id?.toString()}-${i}`}
                      onClick={() => onEventClick?.(occ.event, occ.start)}
                      className={`w-full truncate rounded px-2 py-0.5 text-left text-xs font-medium transition-opacity hover:opacity-80 ${occ.cancelled ? "line-through opacity-40" : ""}`}
                      style={{ backgroundColor: occ.event.color || getEventColor(occ.event.type), color: "white" }}
                      title={occ.title}
                    >
                      {occ.title}
                    </button>
                  ))}
                  {dayOccs.length > 3 && (
                    <div className="px-2 text-xs text-ink/50">+{dayOccs.length - 3}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
