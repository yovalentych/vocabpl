import { ObjectId } from "mongodb";

// ==================== TYPES ====================

export type EventType =
  | "lesson"                // Regular class/lesson
  | "assignment_deadline"   // Assignment due date (auto-generated)
  | "test"                  // Test/exam
  | "meeting"               // Meeting with students
  | "announcement";         // Important announcement/event

export type RecurrenceFrequency = "daily" | "weekly" | "monthly";

export type Recurrence = {
  frequency: RecurrenceFrequency;
  interval: number;           // Every X days/weeks/months
  daysOfWeek?: number[];      // For weekly: 0=Sunday, 1=Monday, etc.
  endDate?: Date;             // When to stop recurring
  exceptions?: Date[];        // Specific dates to skip
};

export type Reminder = {
  time: number;               // Minutes before event
  sent: boolean;              // Whether reminder was sent
};

export type ScheduleEvent = {
  _id?: ObjectId;
  classId: ObjectId;
  teacherId: ObjectId;

  type: EventType;
  title: string;
  description?: string;

  startTime: Date;
  endTime: Date;

  // Recurring events
  isRecurring: boolean;
  recurrence?: Recurrence;

  // Assignment integration
  assignmentId?: ObjectId;

  // Participants
  participants: "all" | ObjectId[];  // "all" or specific student IDs

  // Location/links
  location?: string;
  meetingLink?: string;

  // Notifications
  reminders?: Reminder[];

  // Visual
  color?: string;

  createdAt: Date;
  updatedAt: Date;
};

export type CreateScheduleEventInput = {
  classId: ObjectId;
  teacherId: ObjectId;
  type: EventType;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  isRecurring?: boolean;
  recurrence?: Recurrence;
  assignmentId?: ObjectId;
  participants?: "all" | ObjectId[];
  location?: string;
  meetingLink?: string;
  reminders?: Reminder[];
  color?: string;
};

// ==================== HELPERS ====================

export function getEventColor(type: EventType): string {
  const colors: Record<EventType, string> = {
    lesson: "#7C9885",           // moss
    assignment_deadline: "#E8B55F", // gold
    test: "#D97757",             // terracotta
    meeting: "#5B8A9D",          // blue-ish
    announcement: "#8B7C98"      // purple-ish
  };
  return colors[type];
}

export function getEventIcon(type: EventType): string {
  const icons: Record<EventType, string> = {
    lesson: "chalkboard-teacher",
    assignment_deadline: "clipboard-text",
    test: "exam",
    meeting: "users",
    announcement: "megaphone"
  };
  return icons[type];
}

// ==================== RECURRENCE HELPERS ====================

/**
 * Generate all occurrences of a recurring event within a date range
 */
export function generateOccurrences(
  event: ScheduleEvent,
  startDate: Date,
  endDate: Date
): Array<{ start: Date; end: Date }> {
  if (!event.isRecurring || !event.recurrence) {
    return [{ start: event.startTime, end: event.endTime }];
  }

  const occurrences: Array<{ start: Date; end: Date }> = [];
  const { frequency, interval, daysOfWeek, endDate: recEndDate, exceptions } = event.recurrence;

  const eventDuration = event.endTime.getTime() - event.startTime.getTime();
  let currentDate = new Date(event.startTime);

  const finalEndDate = recEndDate && recEndDate < endDate ? recEndDate : endDate;

  while (currentDate <= finalEndDate) {
    // Check if this occurrence is in our query range
    if (currentDate >= startDate) {
      // Check if this date is an exception
      const isException = exceptions?.some(
        exc => exc.toDateString() === currentDate.toDateString()
      );

      if (!isException) {
        // For weekly recurrence, check if current day matches
        if (frequency === "weekly" && daysOfWeek && daysOfWeek.length > 0) {
          const dayOfWeek = currentDate.getDay();
          if (daysOfWeek.includes(dayOfWeek)) {
            occurrences.push({
              start: new Date(currentDate),
              end: new Date(currentDate.getTime() + eventDuration)
            });
          }
        } else {
          occurrences.push({
            start: new Date(currentDate),
            end: new Date(currentDate.getTime() + eventDuration)
          });
        }
      }
    }

    // Move to next occurrence
    switch (frequency) {
      case "daily":
        currentDate.setDate(currentDate.getDate() + interval);
        break;
      case "weekly":
        currentDate.setDate(currentDate.getDate() + (7 * interval));
        break;
      case "monthly":
        currentDate.setMonth(currentDate.getMonth() + interval);
        break;
    }
  }

  return occurrences;
}

/**
 * Check if an event occurs on a specific date
 */
export function eventOccursOnDate(event: ScheduleEvent, date: Date): boolean {
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);

  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);

  if (!event.isRecurring) {
    return event.startTime >= dayStart && event.startTime <= dayEnd;
  }

  const occurrences = generateOccurrences(event, dayStart, dayEnd);
  return occurrences.length > 0;
}

/**
 * Format event time for display
 */
export function formatEventTime(start: Date, end: Date, locale: 'uk' | 'pl' = 'uk'): string {
  const startTime = start.toLocaleTimeString(locale === 'uk' ? 'uk-UA' : 'pl-PL', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const endTime = end.toLocaleTimeString(locale === 'uk' ? 'uk-UA' : 'pl-PL', {
    hour: '2-digit',
    minute: '2-digit'
  });

  return `${startTime} - ${endTime}`;
}

/**
 * Get event duration in minutes
 */
export function getEventDuration(event: ScheduleEvent): number {
  return Math.round((event.endTime.getTime() - event.startTime.getTime()) / (1000 * 60));
}

/**
 * Check if event is happening now
 */
export function isEventHappeningNow(event: ScheduleEvent): boolean {
  const now = new Date();
  return event.startTime <= now && event.endTime >= now;
}

/**
 * Check if event is upcoming (within next 24 hours)
 */
export function isEventUpcoming(event: ScheduleEvent): boolean {
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  return event.startTime > now && event.startTime <= tomorrow;
}

/**
 * Get recurrence description for display
 */
export function getRecurrenceDescription(recurrence: Recurrence, locale: 'uk' | 'pl' = 'uk'): string {
  const { frequency, interval, daysOfWeek } = recurrence;

  const dayNames = locale === 'uk'
    ? ['Нд', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']
    : ['Nd', 'Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So'];

  if (frequency === 'daily') {
    return interval === 1
      ? (locale === 'uk' ? 'Щодня' : 'Codziennie')
      : (locale === 'uk' ? `Кожні ${interval} дні` : `Co ${interval} dni`);
  }

  if (frequency === 'weekly') {
    const days = daysOfWeek?.map(d => dayNames[d]).join(', ') || '';
    return interval === 1
      ? (locale === 'uk' ? `Щотижня: ${days}` : `Co tydzień: ${days}`)
      : (locale === 'uk' ? `Кожні ${interval} тижні: ${days}` : `Co ${interval} tygodni: ${days}`);
  }

  if (frequency === 'monthly') {
    return interval === 1
      ? (locale === 'uk' ? 'Щомісяця' : 'Co miesiąc')
      : (locale === 'uk' ? `Кожні ${interval} місяці` : `Co ${interval} miesięcy`);
  }

  return '';
}
