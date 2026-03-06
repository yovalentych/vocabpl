"use client";

import { useState, useEffect } from "react";
import { Calendar, ArrowRight } from "@phosphor-icons/react";
import { getEventColor, formatEventTime, generateOccurrencesWithOverrides } from "@/lib/schedule";
import type { ScheduleEvent } from "@/lib/schedule";

interface Props {
  classId: string;
  locale: "uk" | "pl";
  onEventClick: (event: ScheduleEvent, occurrenceDate: Date) => void;
  onViewSchedule: () => void;
}

type Upcoming = { event: ScheduleEvent; start: Date; end: Date; title: string };

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

export default function UpcomingEvents({ classId, locale, onEventClick, onViewSchedule }: Props) {
  const [upcoming, setUpcoming] = useState<Upcoming[]>([]);
  const [loading, setLoading] = useState(true);

  const t = locale === "uk"
    ? { title: "Найближчі заняття", viewAll: "Розклад", noEvents: "Немає запланованих занять", today: "Сьогодні", tomorrow: "Завтра" }
    : { title: "Najbliższe zajęcia", viewAll: "Harmonogram", noEvents: "Brak zaplanowanych zajęć", today: "Dziś", tomorrow: "Jutro" };

  useEffect(() => {
    load();
  }, [classId]);

  async function load() {
    try {
      const now = new Date();
      const end = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000); // next 14 days
      const res = await fetch(
        `/api/classes/${classId}/schedule?start=${now.toISOString()}&end=${end.toISOString()}`
      );
      if (!res.ok) return;
      const data = await res.json();
      const events: ScheduleEvent[] = (data.events || []).map(normalizeEvent);

      const occs: Upcoming[] = [];
      for (const event of events) {
        const items = generateOccurrencesWithOverrides(event, now, end);
        for (const occ of items) {
          if (!occ.cancelled && occ.start >= now) {
            occs.push({ event, start: occ.start, end: occ.end, title: occ.title });
          }
        }
      }

      occs.sort((a, b) => a.start.getTime() - b.start.getTime());
      setUpcoming(occs.slice(0, 5));
    } catch (err) {
      console.error("Failed to load upcoming events:", err);
    } finally {
      setLoading(false);
    }
  }

  function relativeDay(date: Date): string {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (date.toDateString() === today.toDateString()) return t.today;
    if (date.toDateString() === tomorrow.toDateString()) return t.tomorrow;
    return date.toLocaleDateString(locale === "uk" ? "uk-UA" : "pl-PL", { weekday: "short", day: "numeric", month: "short" });
  }

  if (loading) return null;

  return (
    <div className="rounded-[24px] border border-ink/10 bg-paper p-6 shadow-soft">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar size={20} weight="fill" className="text-moss" />
          <h3 className="font-semibold">{t.title}</h3>
        </div>
        <button
          onClick={onViewSchedule}
          className="flex items-center gap-1 text-sm font-medium text-moss transition-colors hover:text-moss/80"
        >
          {t.viewAll} <ArrowRight size={14} />
        </button>
      </div>

      {upcoming.length === 0 ? (
        <p className="text-sm text-ink/50">{t.noEvents}</p>
      ) : (
        <div className="space-y-2">
          {upcoming.map((item, i) => (
            <button
              key={`${item.event._id?.toString()}-${i}`}
              onClick={() => onEventClick(item.event, item.start)}
              className="flex w-full items-center gap-3 rounded-[16px] border border-ink/10 p-3 text-left transition-all hover:bg-ink/5"
            >
              <div
                className="h-8 w-1 shrink-0 rounded-full"
                style={{ backgroundColor: item.event.color || getEventColor(item.event.type) }}
              />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{item.title}</div>
                <div className="mt-0.5 text-xs text-ink/50">
                  {relativeDay(item.start)} · {formatEventTime(item.start, item.end, locale)}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
