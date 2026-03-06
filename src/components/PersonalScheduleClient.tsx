"use client";

import { useState, useEffect } from "react";
import { CaretLeft, CaretRight, Plus } from "@phosphor-icons/react";
import type { ScheduleEvent } from "@/lib/schedule";
import { getEventColor, formatEventTime } from "@/lib/schedule";
import EventDetailPanel from "@/components/schedule/EventDetailPanel";
import CreateEventModal from "@/components/schedule/CreateEventModal";

type PersonalScheduleClientProps = {
  locale: "uk" | "pl";
  isTeacher?: boolean;
};

type EventWithClass = ScheduleEvent & {
  className?: string;
  classId: string;
};

export default function PersonalScheduleClient({ locale, isTeacher = false }: PersonalScheduleClientProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<EventWithClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"month" | "list">("month");
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<EventWithClass | null>(null);
  const [selectedOccurrenceDate, setSelectedOccurrenceDate] = useState<Date | undefined>();
  const [showCreateEvent, setShowCreateEvent] = useState(false);

  const t = locale === "uk" ? {
    title: "Мій розклад",
    today: "Сьогодні",
    month: "Місяць",
    list: "Список",
    allClasses: "Всі класи",
    noEvents: "Немає подій",
    eventTypes: {
      lesson: "Заняття",
      assignment_deadline: "Дедлайн",
      test: "Тест",
      meeting: "Зустріч",
      announcement: "Оголошення"
    }
  } : {
    title: "Mój harmonogram",
    today: "Dziś",
    month: "Miesiąc",
    list: "Lista",
    allClasses: "Wszystkie klasy",
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
  }, [currentDate, selectedClass]);

  useEffect(() => {
    if (isTeacher) loadTeacherClasses();
  }, [isTeacher]);

  async function loadTeacherClasses() {
    try {
      const res = await fetch("/api/classes");
      if (res.ok) {
        const data = await res.json();
        const loaded = (data.classes || []).map((c: any) => ({ id: c._id, name: c.name }));
        setClasses(prev => {
          const merged = new Map(prev.map(c => [c.id, c]));
          loaded.forEach((c: { id: string; name: string }) => merged.set(c.id, c));
          return Array.from(merged.values());
        });
      }
    } catch {}
  }

  async function loadEvents() {
    try {
      setLoading(true);
      const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

      const res = await fetch(
        `/api/schedule/my?start=${start.toISOString()}&end=${end.toISOString()}`
      );
      const data = await res.json();

      if (res.ok) {
        const allEvents = data.events || [];
        setEvents(allEvents);

        // Extract unique classes from events
        const classMap = new Map<string, { id: string; name: string }>();
        allEvents
          .filter((e: EventWithClass) => e.className)
          .forEach((e: EventWithClass) => {
            const classId = e.classId.toString();
            if (!classMap.has(classId)) {
              classMap.set(classId, { id: classId, name: e.className! });
            }
          });
        setClasses(prev => {
          const merged = new Map(prev.map(c => [c.id, c]));
          Array.from(classMap.values()).forEach(c => merged.set(c.id, c));
          return Array.from(merged.values());
        });
      }
    } catch (error) {
      console.error("Failed to load events:", error);
    } finally {
      setLoading(false);
    }
  }

  function handleEventClick(event: EventWithClass, day?: number) {
    setSelectedEvent(event);
    if (day !== undefined) {
      setSelectedOccurrenceDate(
        new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
      );
    } else {
      setSelectedOccurrenceDate(undefined);
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

  function getEventsForDay(day: number): EventWithClass[] {
    const dayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    return events.filter(event => {
      const eventDate = new Date(event.startTime);
      const matchesDate =
        eventDate.getFullYear() === dayDate.getFullYear() &&
        eventDate.getMonth() === dayDate.getMonth() &&
        eventDate.getDate() === dayDate.getDate();

      const matchesClass = selectedClass === "all" || event.classId?.toString() === selectedClass;

      return matchesDate && matchesClass;
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

  const filteredEvents = selectedClass === "all"
    ? events
    : events.filter(e => e.classId?.toString() === selectedClass);

  if (viewMode === "list") {
    const sortedEvents = [...filteredEvents].sort(
      (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );

    return (
      <div className="min-h-screen bg-paper p-4 sm:p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <h1 className="text-2xl font-bold text-ink">{t.title}</h1>
            <div className="flex items-center gap-2 flex-wrap">
              {isTeacher && (
                <button
                  onClick={() => setShowCreateEvent(true)}
                  className="flex items-center gap-2 rounded-full border border-moss/20 bg-moss px-4 py-1.5 text-sm font-semibold text-paper hover:bg-moss/90"
                >
                  <Plus size={16} weight="bold" />
                  {locale === "uk" ? "Нова подія" : "Nowe wydarzenie"}
                </button>
              )}
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="px-3 py-1.5 text-sm rounded-lg border border-ink/20 hover:bg-ink/5"
              >
                <option value="all">{t.allClasses}</option>
                {classes.map(cls => (
                  <option key={cls.id} value={cls.id}>{cls.name}</option>
                ))}
              </select>
              <button
                onClick={() => setViewMode("month")}
                className="px-3 py-1.5 text-sm rounded-lg border border-ink/20 hover:bg-ink/5"
              >
                {t.month}
              </button>
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
                  onClick={() => handleEventClick(event)}
                  className="w-full p-4 rounded-xl border border-ink/10 bg-paper hover:bg-ink/5 transition-colors text-left"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="mt-1 w-1 self-stretch rounded-full flex-shrink-0 min-h-[40px]"
                      style={{ backgroundColor: event.color || getEventColor(event.type) }}
                    />
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-semibold text-ink">{event.title}</h4>
                        <span className="text-xs text-ink/50 shrink-0">
                          {new Date(event.startTime).toLocaleDateString(locale === "uk" ? "uk-UA" : "pl-PL")}
                        </span>
                      </div>
                      <p className="text-sm text-ink/60 mt-1">
                        {formatEventTime(new Date(event.startTime), new Date(event.endTime), locale)}
                      </p>
                      {event.className && (
                        <p className="text-xs text-ink/50 mt-1">📚 {event.className}</p>
                      )}
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

        {/* Modals */}
        {selectedEvent && (
          <EventDetailPanel
            event={selectedEvent}
            occurrenceDate={selectedOccurrenceDate}
            isTeacher={isTeacher}
            onClose={() => setSelectedEvent(null)}
            onUpdated={loadEvents}
            teacherClasses={classes}
          />
        )}
        {showCreateEvent && (
          <CreateEventModal
            isOpen={showCreateEvent}
            onClose={() => setShowCreateEvent(false)}
            classes={classes}
            onEventCreated={() => { setShowCreateEvent(false); loadEvents(); }}
          />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={goToPreviousMonth}
              className="p-2 rounded-lg hover:bg-ink/5 transition-colors"
            >
              <CaretLeft size={20} weight="bold" />
            </button>
            <h1 className="text-2xl font-bold text-ink capitalize min-w-[200px] text-center">
              {monthName}
            </h1>
            <button
              onClick={goToNextMonth}
              className="p-2 rounded-lg hover:bg-ink/5 transition-colors"
            >
              <CaretRight size={20} weight="bold" />
            </button>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {isTeacher && (
              <button
                onClick={() => setShowCreateEvent(true)}
                className="flex items-center gap-2 rounded-full border border-moss/20 bg-moss px-4 py-1.5 text-sm font-semibold text-paper hover:bg-moss/90"
              >
                <Plus size={16} weight="bold" />
                {locale === "uk" ? "Нова подія" : "Nowe wydarzenie"}
              </button>
            )}
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="px-3 py-1.5 text-sm rounded-lg border border-ink/20 hover:bg-ink/5"
            >
              <option value="all">{t.allClasses}</option>
              {classes.map(cls => (
                <option key={cls.id} value={cls.id}>{cls.name}</option>
              ))}
            </select>
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
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="border border-ink/10 rounded-xl overflow-hidden bg-white shadow-sm" onClick={e => e.stopPropagation()}>
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
                    {dayEvents.slice(0, 3).map(event => {
                      const isCancelled = event.isCancelled || event.overrides?.some(
                        (o: any) => new Date(o.originalDate).toDateString() ===
                          new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString() && o.cancelled
                      );
                      return (
                        <button
                          key={event._id?.toString()}
                          onClick={() => handleEventClick(event, day)}
                          className="w-full text-left px-2 py-1 rounded text-xs font-medium truncate transition-opacity hover:opacity-80"
                          style={{
                            backgroundColor: isCancelled ? "rgba(0,0,0,0.15)" : (event.color || getEventColor(event.type)),
                            color: "white",
                            textDecoration: isCancelled ? "line-through" : "none",
                            opacity: isCancelled ? 0.6 : 1,
                          }}
                          title={`${event.title}${event.className ? ` - ${event.className}` : ''}`}
                        >
                          {event.title}
                        </button>
                      );
                    })}
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

      {/* Modals */}
      {selectedEvent && (
        <EventDetailPanel
          event={selectedEvent}
          occurrenceDate={selectedOccurrenceDate}
          isTeacher={isTeacher}
          onClose={() => setSelectedEvent(null)}
          onUpdated={loadEvents}
          teacherClasses={classes}
        />
      )}
      {showCreateEvent && (
        <CreateEventModal
          isOpen={showCreateEvent}
          onClose={() => setShowCreateEvent(false)}
          classes={classes}
          onEventCreated={() => { setShowCreateEvent(false); loadEvents(); }}
        />
      )}
    </div>
  );
}
