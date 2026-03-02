"use client";

import { useState, useEffect } from "react";
import { CaretLeft, CaretRight, Plus } from "@phosphor-icons/react";
import type { ScheduleEvent } from "@/lib/schedule";
import { getEventColor, formatEventTime } from "@/lib/schedule";

type SimpleCalendarProps = {
  classId: string;
  locale: "uk" | "pl";
  isTeacher: boolean;
  onCreateEvent?: () => void;
  onEventClick?: (event: ScheduleEvent) => void;
};

export default function SimpleCalendar({
  classId,
  locale,
  isTeacher,
  onCreateEvent,
  onEventClick
}: SimpleCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"month" | "list">("month");

  const t = locale === "uk" ? {
    today: "Сьогодні",
    month: "Місяць",
    list: "Список",
    createEvent: "Створити подію",
    noEvents: "Немає подій",
    eventTypes: {
      lesson: "Заняття",
      assignment_deadline: "Дедлайн",
      test: "Тест",
      meeting: "Зустріч",
      announcement: "Оголошення"
    }
  } : {
    today: "Dziś",
    month: "Miesiąc",
    list: "Lista",
    createEvent: "Utwórz",
    noEvents: "Brak wydarzeń",
    eventTypes: {
      lesson: "Lekcja",
      assignment_deadline: "Termin",
      test: "Test",
      meeting: "Spotkanie",
      announcement: "Ogłoszenie"
    }
  };

  useEffect(() => {
    loadEvents();
  }, [classId, currentDate]);

  async function loadEvents() {
    try {
      setLoading(true);
      const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

      const res = await fetch(
        `/api/classes/${classId}/schedule?start=${start.toISOString()}&end=${end.toISOString()}`
      );
      const data = await res.json();
      if (res.ok) {
        setEvents(data.events || []);
      }
    } catch (error) {
      console.error("Failed to load events:", error);
    } finally {
      setLoading(false);
    }
  }

  function goToPreviousMonth() {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  }

  function goToNextMonth() {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  }

  function goToToday() {
    setCurrentDate(new Date());
  }

  const monthName = currentDate.toLocaleDateString(locale === "uk" ? "uk-UA" : "pl-PL", {
    month: "long",
    year: "numeric"
  });

  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startingDayOfWeek = firstDayOfMonth.getDay();

  const dayNames = locale === "uk"
    ? ["Нд", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"]
    : ["Nd", "Pn", "Wt", "Śr", "Cz", "Pt", "So"];

  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  function getEventsForDay(day: number): ScheduleEvent[] {
    const dayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    return events.filter(event => {
      const eventDate = new Date(event.startTime);
      return (
        eventDate.getFullYear() === dayDate.getFullYear() &&
        eventDate.getMonth() === dayDate.getMonth() &&
        eventDate.getDate() === dayDate.getDate()
      );
    });
  }

  const today = new Date();
  const isToday = (day: number) => {
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  };

  if (viewMode === "list") {
    const sortedEvents = [...events].sort(
      (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );

    return (
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-ink capitalize">{monthName}</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode("month")}
              className="px-3 py-1.5 text-sm rounded-lg border border-ink/20 hover:bg-ink/5"
            >
              {t.month}
            </button>
            {isTeacher && onCreateEvent && (
              <button
                onClick={onCreateEvent}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-semibold rounded-lg bg-moss text-white hover:bg-moss/90"
              >
                <Plus size={16} weight="bold" />
                {t.createEvent}
              </button>
            )}
          </div>
        </div>

        {/* List View */}
        <div className="space-y-2">
          {sortedEvents.length === 0 ? (
            <div className="text-center py-12 text-ink/50">{t.noEvents}</div>
          ) : (
            sortedEvents.map(event => (
              <button
                key={event._id?.toString()}
                onClick={() => onEventClick?.(event)}
                className="w-full text-left p-4 rounded-xl border border-ink/10 hover:bg-ink/5 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-1 h-full rounded-full flex-shrink-0"
                    style={{ backgroundColor: event.color || getEventColor(event.type) }}
                  />
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-semibold text-ink">{event.title}</h4>
                      <span className="text-xs text-ink/50">
                        {new Date(event.startTime).toLocaleDateString(locale === "uk" ? "uk-UA" : "pl-PL")}
                      </span>
                    </div>
                    <p className="text-sm text-ink/60 mt-1">
                      {formatEventTime(new Date(event.startTime), new Date(event.endTime), locale)}
                    </p>
                    {event.location && (
                      <p className="text-xs text-ink/50 mt-1">📍 {event.location}</p>
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
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={goToPreviousMonth}
            className="p-2 rounded-lg hover:bg-ink/5 transition-colors"
          >
            <CaretLeft size={20} weight="bold" />
          </button>
          <h3 className="text-lg font-bold text-ink capitalize min-w-[200px] text-center">
            {monthName}
          </h3>
          <button
            onClick={goToNextMonth}
            className="p-2 rounded-lg hover:bg-ink/5 transition-colors"
          >
            <CaretRight size={20} weight="bold" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={goToToday}
            className="px-3 py-1.5 text-sm rounded-lg border border-ink/20 hover:bg-ink/5"
          >
            {t.today}
          </button>
          <button
            onClick={() => setViewMode("list")}
            className="px-3 py-1.5 text-sm rounded-lg border border-ink/20 hover:bg-ink/5"
          >
            {t.list}
          </button>
          {isTeacher && onCreateEvent && (
            <button
              onClick={onCreateEvent}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-semibold rounded-lg bg-moss text-white hover:bg-moss/90"
            >
              <Plus size={16} weight="bold" />
              {t.createEvent}
            </button>
          )}
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="border border-ink/10 rounded-xl overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-7 bg-ink/5">
          {dayNames.map(day => (
            <div key={day} className="p-2 text-center text-xs font-semibold text-ink/60">
              {day}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7">
          {calendarDays.map((day, index) => {
            if (day === null) {
              return <div key={`empty-${index}`} className="border-t border-ink/10 p-2 bg-ink/5" />;
            }

            const dayEvents = getEventsForDay(day);
            const isTodayDate = isToday(day);

            return (
              <div
                key={day}
                className={`border-t border-l border-ink/10 p-2 min-h-[100px] ${
                  isTodayDate ? "bg-moss/5" : "bg-paper"
                }`}
              >
                <div
                  className={`text-sm font-semibold mb-2 ${
                    isTodayDate
                      ? "inline-flex items-center justify-center w-6 h-6 rounded-full bg-moss text-white"
                      : "text-ink"
                  }`}
                >
                  {day}
                </div>

                <div className="space-y-1">
                  {dayEvents.slice(0, 3).map(event => (
                    <button
                      key={event._id?.toString()}
                      onClick={() => onEventClick?.(event)}
                      className="w-full text-left px-2 py-1 rounded text-xs font-medium hover:opacity-80 transition-opacity truncate"
                      style={{
                        backgroundColor: event.color || getEventColor(event.type),
                        color: "white"
                      }}
                      title={event.title}
                    >
                      {event.title}
                    </button>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="text-xs text-ink/50 px-2">
                      +{dayEvents.length - 3} більше
                    </div>
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
