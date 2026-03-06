"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Chalkboard,
  Users,
  CheckCircle,
  XCircle,
  NotePencil,
  Lightning,
  Clock,
  ArrowSquareOut,
  Plus,
  Check,
  X,
  PaperPlaneRight,
  BookOpen,
  Warning,
  Circle,
  UserCircle,
  MapPin,
  Link as LinkIcon,
  ClockCountdown,
  Star,
  Repeat,
  Hourglass,
} from "@phosphor-icons/react";
import { csrfFetch } from "@/lib/csrf-client";

// ===================== Types =====================

interface Participant {
  userId: string;
  name: string;
  role: "teacher" | "student";
  lastSeenAt: string;
}

interface AttendanceEntry {
  studentId: string;
  studentName: string;
  status: "present" | "absent" | "late" | "excused" | null;
}

interface Exercise {
  id: string;
  title: string;
  description: string;
  points: number;
  isActive: boolean;
  createdAt: string;
}

interface Response {
  exerciseId: string;
  studentId: string;
  studentName: string;
  answer: string;
  score?: number;
  gradedAt?: string;
  submittedAt: string;
}

interface SessionData {
  sessionId: string;
  eventId: string;
  classId: string;
  occurrenceDate: string;
  status: "waiting" | "active" | "ended";
  isTeacher: boolean;
  windowOpen: boolean;
  windowStart: string;
  windowEnd: string;
  event: {
    title: string;
    description?: string;
    meetingLink?: string;
    location?: string;
    startTime: string;
    endTime: string;
    color?: string;
    type: string;
  };
  className: string;
  teacherName: string;
  students: { id: string; name: string; username: string }[];
  sharedNotes: string;
  agenda: string;
  attendance: AttendanceEntry[];
  conducted: boolean;
  participants: Participant[];
  exercises: Exercise[];
  responses: Response[];
  personalNote: string;
}

type Tab = "overview" | "board" | "attendance" | "exercises" | "notes";

// ===================== Helpers =====================

function formatTime(iso: string, locale: string): string {
  return new Date(iso).toLocaleTimeString(locale === "uk" ? "uk-UA" : "pl-PL", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(iso: string, locale: string): string {
  return new Date(iso).toLocaleDateString(locale === "uk" ? "uk-UA" : "pl-PL", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// ===================== Main Component =====================

interface Props {
  eventId: string;
  date: string;
  userId: string;
  username: string;
}

export default function LessonSession({ eventId, date, userId }: Props) {
  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("overview");
  const locale = "uk"; // We'll read from the session's class later

  // Local editable states (avoid clobbering while typing)
  const [localNotes, setLocalNotes] = useState("");
  const [localAgenda, setLocalAgenda] = useState("");
  const [localPersonalNote, setLocalPersonalNote] = useState("");
  const [noteSaved, setNoteSaved] = useState(false);

  const notesTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const agendaTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const personalTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const heartbeatTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Teacher-local board editing: don't override while focused
  const notesEditing = useRef(false);
  const agendaEditing = useRef(false);

  const apiUrl = useCallback(
    (path = "") => `/api/lessons/${eventId}${path}?date=${date}`,
    [eventId, date]
  );

  const patch = useCallback(
    async (body: Record<string, unknown>) => {
      try {
        await csrfFetch(apiUrl(), {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      } catch (err) {
        console.error("Lesson patch error:", err);
      }
    },
    [apiUrl]
  );

  // ---- Polling ----
  const fetchSession = useCallback(async (initial = false) => {
    try {
      const res = await fetch(apiUrl());
      if (!res.ok) return;
      const data: SessionData = await res.json();
      setSession((prev) => {
        // Only update local note states on initial load or if not currently editing
        if (initial || !notesEditing.current) setLocalNotes(data.sharedNotes);
        if (initial || !agendaEditing.current) setLocalAgenda(data.agenda);
        if (initial) setLocalPersonalNote(data.personalNote);
        return data;
      });
    } catch (err) {
      console.error("Poll error:", err);
    } finally {
      if (initial) setLoading(false);
    }
  }, [apiUrl]);

  useEffect(() => {
    fetchSession(true);
    pollTimer.current = setInterval(() => fetchSession(), 3000);
    heartbeatTimer.current = setInterval(() => {
      csrfFetch(apiUrl("/heartbeat"), { method: "POST" }).catch(() => {});
    }, 10000);

    // Initial heartbeat
    csrfFetch(apiUrl("/heartbeat"), { method: "POST" }).catch(() => {});

    return () => {
      if (pollTimer.current) clearInterval(pollTimer.current);
      if (heartbeatTimer.current) clearInterval(heartbeatTimer.current);
    };
  }, [apiUrl, fetchSession]);

  // ---- Debounced saves ----
  function handleNotesChange(val: string) {
    setLocalNotes(val);
    if (notesTimer.current) clearTimeout(notesTimer.current);
    notesTimer.current = setTimeout(() => patch({ sharedNotes: val }), 1500);
  }

  function handleAgendaChange(val: string) {
    setLocalAgenda(val);
    if (agendaTimer.current) clearTimeout(agendaTimer.current);
    agendaTimer.current = setTimeout(() => patch({ agenda: val }), 1500);
  }

  function handlePersonalNoteChange(val: string) {
    setLocalPersonalNote(val);
    setNoteSaved(false);
    if (personalTimer.current) clearTimeout(personalTimer.current);
    personalTimer.current = setTimeout(async () => {
      await patch({ personalNote: val });
      setNoteSaved(true);
    }, 1500);
  }

  async function updateAttendance(studentId: string, status: AttendanceEntry["status"]) {
    setSession((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        attendance: prev.attendance.map((a) =>
          a.studentId === studentId ? { ...a, status } : a
        ),
      };
    });
    await patch({ attendanceUpdate: { studentId, status } });
  }

  async function markConducted(conducted: boolean) {
    setSession((prev) => (prev ? { ...prev, conducted } : prev));
    await patch({ conducted });
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-ink/50">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-moss border-t-transparent" />
          <span className="text-sm">{locale === "uk" ? "Завантаження сесії..." : "Ładowanie sesji..."}</span>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <Warning size={40} className="mx-auto mb-3 text-terracotta/50" />
          <p className="text-ink/60">Сесію не знайдено або немає доступу</p>
        </div>
      </div>
    );
  }

  if (!session.windowOpen) {
    const windowStart = new Date(session.windowStart);
    const now = new Date();
    const isInFuture = windowStart > now;
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="max-w-sm text-center">
          {isInFuture ? (
            <>
              <ClockCountdown size={48} className="mx-auto mb-4 text-moss/60" />
              <h2 className="text-xl font-semibold">{session.event.title}</h2>
              <p className="mt-2 text-sm text-ink/60">{session.className}</p>
              <div className="mt-4 rounded-2xl border border-ink/10 bg-paper p-4 shadow-soft">
                <p className="text-xs text-ink/50">Сесія відкривається о</p>
                <p className="mt-1 text-lg font-semibold text-moss">
                  {formatTime(session.windowStart, locale)}
                </p>
                <p className="text-xs text-ink/40">
                  {formatDate(session.event.startTime, locale)}
                </p>
              </div>
              <p className="mt-3 text-xs text-ink/40">
                Заходь за 30 хвилин до початку уроку
              </p>
            </>
          ) : (
            <>
              <Hourglass size={48} className="mx-auto mb-4 text-ink/30" />
              <h2 className="text-xl font-semibold">{session.event.title}</h2>
              <p className="mt-2 text-sm text-ink/60">Сесія вже завершена</p>
            </>
          )}
        </div>
      </div>
    );
  }

  const color = session.event.color || "#7C9885";
  const presentCount = session.attendance.filter(
    (a) => a.status === "present" || a.status === "late"
  ).length;
  const isTeacher = session.isTeacher;

  const tabs: { key: Tab; label: string; icon: any }[] = [
    { key: "overview", label: locale === "uk" ? "Огляд" : "Przegląd", icon: BookOpen },
    { key: "board", label: locale === "uk" ? "Дошка" : "Tablica", icon: NotePencil },
    { key: "attendance", label: locale === "uk" ? "Присутність" : "Obecność", icon: Users },
    { key: "exercises", label: locale === "uk" ? "Вправи" : "Ćwiczenia", icon: Lightning },
    { key: "notes", label: locale === "uk" ? "Нотатки" : "Notatki", icon: Chalkboard },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      {/* ─── Header ─── */}
      <div
        className="mb-4 overflow-hidden rounded-[24px] border border-ink/10 bg-paper shadow-soft"
        style={{ borderTopColor: color, borderTopWidth: 3 }}
      >
        <div className="flex flex-wrap items-center gap-4 px-6 py-4">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px]"
              style={{ backgroundColor: `${color}20` }}
            >
              <Chalkboard size={20} weight="fill" style={{ color }} />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-lg font-bold">{session.event.title}</h1>
              <p className="truncate text-sm text-ink/50">{session.className}</p>
            </div>
          </div>

          {/* Time */}
          <div className="flex items-center gap-1.5 rounded-xl border border-ink/10 px-3 py-1.5 text-sm text-ink/70">
            <Clock size={14} weight="fill" />
            {formatTime(session.event.startTime, locale)}–{formatTime(session.event.endTime, locale)}
          </div>

          {/* Online participants */}
          <div className="flex items-center gap-2">
            {session.participants.slice(0, 5).map((p) => (
              <div
                key={p.userId}
                title={p.name}
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-paper ${
                  p.role === "teacher" ? "bg-moss" : "bg-ink/60"
                }`}
              >
                {getInitials(p.name)}
              </div>
            ))}
            {session.participants.length > 5 && (
              <span className="text-xs text-ink/50">+{session.participants.length - 5}</span>
            )}
            {session.participants.length > 0 && (
              <span className="flex items-center gap-1 text-xs text-moss">
                <Circle size={6} weight="fill" className="animate-pulse" />
                {session.participants.length}
              </span>
            )}
          </div>

          {/* Meeting link */}
          {session.event.meetingLink && (
            <a
              href={session.event.meetingLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-xl bg-moss px-3 py-1.5 text-sm font-semibold text-paper transition-colors hover:bg-moss/90"
            >
              <ArrowSquareOut size={14} weight="bold" />
              {locale === "uk" ? "Відеодзвінок" : "Wideo"}
            </a>
          )}

          {/* Status badge */}
          {session.conducted && (
            <span className="rounded-full bg-moss/10 px-3 py-1 text-xs font-semibold text-moss">
              {locale === "uk" ? "Проведено" : "Przeprowadzono"}
            </span>
          )}
        </div>
      </div>

      {/* ─── Tab Bar ─── */}
      <div className="mb-4 flex gap-1 overflow-x-auto rounded-2xl border border-ink/10 bg-paper p-1 shadow-soft">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition-all ${
              tab === key
                ? "bg-moss text-paper shadow-sm"
                : "text-ink/60 hover:bg-ink/5 hover:text-ink"
            }`}
          >
            <Icon size={15} weight={tab === key ? "fill" : "regular"} />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* ─── Tab Content ─── */}
      <div className="rounded-[24px] border border-ink/10 bg-paper shadow-soft">
        {tab === "overview" && (
          <OverviewTab session={session} locale={locale} presentCount={presentCount} />
        )}
        {tab === "board" && (
          <BoardTab
            session={session}
            locale={locale}
            isTeacher={isTeacher}
            localNotes={localNotes}
            localAgenda={localAgenda}
            onNotesChange={handleNotesChange}
            onAgendaChange={handleAgendaChange}
            notesEditingRef={notesEditing}
            agendaEditingRef={agendaEditing}
          />
        )}
        {tab === "attendance" && (
          <AttendanceTab
            session={session}
            locale={locale}
            isTeacher={isTeacher}
            onUpdateAttendance={updateAttendance}
            onMarkConducted={markConducted}
          />
        )}
        {tab === "exercises" && (
          <ExercisesTab
            session={session}
            locale={locale}
            isTeacher={isTeacher}
            userId={userId}
            onPatch={patch}
          />
        )}
        {tab === "notes" && (
          <NotesTab
            locale={locale}
            value={localPersonalNote}
            onChange={handlePersonalNoteChange}
            saved={noteSaved}
          />
        )}
      </div>
    </div>
  );
}

// ===================== Overview Tab =====================

function OverviewTab({
  session,
  locale,
  presentCount,
}: {
  session: SessionData;
  locale: string;
  presentCount: number;
}) {
  return (
    <div className="grid gap-6 p-6 md:grid-cols-2">
      {/* Left: lesson info */}
      <div className="space-y-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-ink/40">
          {locale === "uk" ? "Інформація" : "Informacje"}
        </h3>

        <div className="space-y-3 text-sm">
          <div className="flex items-start gap-2">
            <Clock size={16} weight="fill" className="mt-0.5 shrink-0 text-ink/40" />
            <div>
              <div className="font-medium">
                {new Date(session.event.startTime).toLocaleDateString(
                  locale === "uk" ? "uk-UA" : "pl-PL",
                  { weekday: "long", day: "numeric", month: "long" }
                )}
              </div>
              <div className="text-ink/50">
                {new Date(session.event.startTime).toLocaleTimeString(
                  locale === "uk" ? "uk-UA" : "pl-PL",
                  { hour: "2-digit", minute: "2-digit" }
                )}{" "}
                —{" "}
                {new Date(session.event.endTime).toLocaleTimeString(
                  locale === "uk" ? "uk-UA" : "pl-PL",
                  { hour: "2-digit", minute: "2-digit" }
                )}
              </div>
            </div>
          </div>

          {session.event.location && (
            <div className="flex items-center gap-2 text-ink/70">
              <MapPin size={16} weight="fill" className="shrink-0 text-ink/40" />
              {session.event.location}
            </div>
          )}

          {session.event.meetingLink && (
            <a
              href={session.event.meetingLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-moss hover:underline"
            >
              <LinkIcon size={16} weight="bold" className="shrink-0" />
              {locale === "uk" ? "Відеодзвінок" : "Link do spotkania"}
            </a>
          )}

          {session.event.description && (
            <p className="rounded-xl border border-ink/10 bg-ink/[0.02] p-3 text-ink/70 leading-relaxed">
              {session.event.description}
            </p>
          )}
        </div>

        {/* Agenda preview */}
        {session.agenda && (
          <div>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink/40">
              {locale === "uk" ? "План уроку" : "Plan zajęć"}
            </h4>
            <div className="rounded-xl border border-ink/10 bg-ink/[0.02] p-3 text-sm text-ink/80 whitespace-pre-wrap leading-relaxed">
              {session.agenda}
            </div>
          </div>
        )}
      </div>

      {/* Right: participants */}
      <div className="space-y-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-ink/40">
          {locale === "uk" ? "Онлайн" : "Online"} · {session.participants.length}
        </h3>

        {session.participants.length === 0 ? (
          <p className="text-sm text-ink/40">
            {locale === "uk" ? "Поки нікого немає онлайн" : "Nikt nie jest online"}
          </p>
        ) : (
          <div className="space-y-2">
            {session.participants.map((p) => (
              <div
                key={p.userId}
                className="flex items-center gap-3 rounded-xl border border-ink/10 p-3"
              >
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-paper ${
                    p.role === "teacher" ? "bg-moss" : "bg-ink/50"
                  }`}
                >
                  {getInitials(p.name)}
                </div>
                <div>
                  <div className="text-sm font-medium">{p.name}</div>
                  <div className="text-xs text-ink/40">
                    {p.role === "teacher"
                      ? locale === "uk"
                        ? "Викладач"
                        : "Nauczyciel"
                      : locale === "uk"
                      ? "Студент"
                      : "Student"}
                  </div>
                </div>
                <div className="ml-auto flex items-center gap-1 text-xs text-moss">
                  <Circle size={6} weight="fill" className="animate-pulse" />
                  {locale === "uk" ? "онлайн" : "online"}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Attendance quick stats */}
        {session.conducted && (
          <div className="rounded-xl border border-moss/20 bg-moss/5 p-3 text-sm">
            <div className="font-semibold text-moss">
              {locale === "uk" ? "Проведено" : "Przeprowadzono"} ·{" "}
              {presentCount}/{session.students.length}{" "}
              {locale === "uk" ? "присутніх" : "obecnych"}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ===================== Board Tab =====================

interface BoardTabProps {
  session: SessionData;
  locale: string;
  isTeacher: boolean;
  localNotes: string;
  localAgenda: string;
  onNotesChange: (v: string) => void;
  onAgendaChange: (v: string) => void;
  notesEditingRef: React.MutableRefObject<boolean>;
  agendaEditingRef: React.MutableRefObject<boolean>;
}

function BoardTab({
  session,
  locale,
  isTeacher,
  localNotes,
  localAgenda,
  onNotesChange,
  onAgendaChange,
  notesEditingRef,
  agendaEditingRef,
}: BoardTabProps) {
  const updatedAt = new Date(session.event.startTime);

  return (
    <div className="grid gap-6 p-6 md:grid-cols-[1fr_2fr]">
      {/* Agenda */}
      <div>
        <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-ink/40">
          {locale === "uk" ? "План уроку" : "Plan zajęć"}
        </label>
        {isTeacher ? (
          <textarea
            value={localAgenda}
            onChange={(e) => onAgendaChange(e.target.value)}
            onFocus={() => (agendaEditingRef.current = true)}
            onBlur={() => (agendaEditingRef.current = false)}
            rows={12}
            placeholder={
              locale === "uk"
                ? "Напишіть план уроку:\n1. Привітання\n2. Повторення\n3. Нова тема..."
                : "Plan zajęć:\n1. Powitanie\n2. Powtórzenie\n3. Nowy temat..."
            }
            className="w-full resize-none rounded-[16px] border border-ink/15 bg-ink/[0.02] px-4 py-3 text-sm text-ink focus:border-moss/40 focus:bg-paper focus:outline-none focus:ring-2 focus:ring-moss/10 leading-relaxed"
          />
        ) : (
          <div className="min-h-[200px] rounded-[16px] border border-ink/10 bg-ink/[0.02] px-4 py-3 text-sm text-ink/80 leading-relaxed whitespace-pre-wrap">
            {localAgenda || (
              <span className="text-ink/30">
                {locale === "uk" ? "Викладач ще не написав план" : "Nauczyciel nie napisał planu"}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Shared notes */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="text-xs font-semibold uppercase tracking-wider text-ink/40">
            {locale === "uk" ? "Нотатки уроку (спільні)" : "Notatki z lekcji (wspólne)"}
          </label>
          {isTeacher && (
            <span className="text-xs text-ink/30">
              {locale === "uk" ? "Автозбереження" : "Autozapis"}
            </span>
          )}
        </div>
        {isTeacher ? (
          <textarea
            value={localNotes}
            onChange={(e) => onNotesChange(e.target.value)}
            onFocus={() => (notesEditingRef.current = true)}
            onBlur={() => (notesEditingRef.current = false)}
            rows={12}
            placeholder={
              locale === "uk"
                ? "Пишіть нотатки тут — студенти бачать у реальному часі..."
                : "Pisz notatki tutaj — studenci widzą je na żywo..."
            }
            className="w-full resize-none rounded-[16px] border border-ink/15 bg-ink/[0.02] px-4 py-3 text-sm text-ink focus:border-moss/40 focus:bg-paper focus:outline-none focus:ring-2 focus:ring-moss/10 leading-relaxed"
          />
        ) : (
          <div className="min-h-[280px] rounded-[16px] border border-ink/10 bg-ink/[0.02] px-4 py-3 text-sm text-ink/80 leading-relaxed whitespace-pre-wrap">
            {localNotes || (
              <span className="text-ink/30">
                {locale === "uk"
                  ? "Викладач ще не написав нотатки..."
                  : "Nauczyciel jeszcze nie napisał notatek..."}
              </span>
            )}
          </div>
        )}
        <p className="mt-2 text-right text-xs text-ink/30">
          {locale === "uk" ? "Оновлюється автоматично" : "Odświeżane automatycznie"} · 3s
        </p>
      </div>
    </div>
  );
}

// ===================== Attendance Tab =====================

const ATTENDANCE_OPTIONS: {
  status: AttendanceEntry["status"];
  labelUk: string;
  labelPl: string;
  color: string;
}[] = [
  { status: "present", labelUk: "Присутній", labelPl: "Obecny", color: "bg-moss text-paper" },
  { status: "late", labelUk: "Запізнився", labelPl: "Spóźniony", color: "bg-gold text-paper" },
  { status: "absent", labelUk: "Відсутній", labelPl: "Nieobecny", color: "bg-terracotta text-paper" },
  { status: "excused", labelUk: "Поважна", labelPl: "Usprawiedliwiony", color: "bg-ink/50 text-paper" },
];

function AttendanceTab({
  session,
  locale,
  isTeacher,
  onUpdateAttendance,
  onMarkConducted,
}: {
  session: SessionData;
  locale: string;
  isTeacher: boolean;
  onUpdateAttendance: (studentId: string, status: AttendanceEntry["status"]) => void;
  onMarkConducted: (conducted: boolean) => void;
}) {
  const presentCount = session.attendance.filter(
    (a) => a.status === "present" || a.status === "late"
  ).length;
  const totalCount = session.attendance.length;

  function markAll(status: AttendanceEntry["status"]) {
    for (const a of session.attendance) {
      onUpdateAttendance(a.studentId, status);
    }
  }

  return (
    <div className="p-6">
      {/* Summary + controls */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">
            {locale === "uk" ? "Відвідуваність" : "Obecność"}
          </h3>
          <p className="text-sm text-ink/50">
            {presentCount}/{totalCount}{" "}
            {locale === "uk" ? "присутніх" : "obecnych"}
          </p>
        </div>

        {isTeacher && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => markAll("present")}
              className="rounded-xl border border-moss/20 bg-moss/10 px-3 py-1.5 text-xs font-semibold text-moss transition-colors hover:bg-moss/20"
            >
              {locale === "uk" ? "Всі присутні" : "Wszyscy obecni"}
            </button>
            <button
              onClick={() => onMarkConducted(!session.conducted)}
              className={`rounded-xl px-4 py-1.5 text-xs font-semibold transition-colors ${
                session.conducted
                  ? "bg-moss text-paper hover:bg-moss/90"
                  : "border border-moss/20 bg-ink/5 text-ink/60 hover:bg-moss/10 hover:text-moss"
              }`}
            >
              {session.conducted
                ? locale === "uk"
                  ? "✓ Урок проведено"
                  : "✓ Lekcja przeprowadzona"
                : locale === "uk"
                ? "Відмітити як проведений"
                : "Oznacz jako przeprowadzone"}
            </button>
          </div>
        )}
      </div>

      {/* Student list */}
      {session.attendance.length === 0 ? (
        <p className="text-sm text-ink/40">
          {locale === "uk" ? "Немає студентів" : "Brak studentów"}
        </p>
      ) : (
        <div className="space-y-2">
          {session.attendance.map((entry) => {
            const currentOpt = ATTENDANCE_OPTIONS.find((o) => o.status === entry.status);
            return (
              <div
                key={entry.studentId}
                className="flex items-center gap-3 rounded-[16px] border border-ink/10 p-3"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-ink/10 text-xs font-bold text-ink/60">
                  {getInitials(entry.studentName)}
                </div>
                <span className="flex-1 text-sm font-medium">{entry.studentName}</span>

                {isTeacher ? (
                  <div className="flex gap-1.5">
                    {ATTENDANCE_OPTIONS.map((opt) => (
                      <button
                        key={opt.status}
                        onClick={() => onUpdateAttendance(entry.studentId, opt.status)}
                        className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                          entry.status === opt.status
                            ? opt.color
                            : "bg-ink/5 text-ink/40 hover:bg-ink/10"
                        }`}
                      >
                        {locale === "uk" ? opt.labelUk : opt.labelPl}
                      </button>
                    ))}
                  </div>
                ) : (
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      currentOpt
                        ? currentOpt.color
                        : "bg-ink/5 text-ink/40"
                    }`}
                  >
                    {entry.status
                      ? locale === "uk"
                        ? currentOpt?.labelUk
                        : currentOpt?.labelPl
                      : "—"}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ===================== Exercises Tab =====================

function ExercisesTab({
  session,
  locale,
  isTeacher,
  userId,
  onPatch,
}: {
  session: SessionData;
  locale: string;
  isTeacher: boolean;
  userId: string;
  onPatch: (body: Record<string, unknown>) => Promise<void>;
}) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newPoints, setNewPoints] = useState("0");
  const [adding, setAdding] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [gradeInputs, setGradeInputs] = useState<Record<string, string>>({});

  async function addExercise() {
    if (!newTitle.trim()) return;
    setAdding(true);
    await onPatch({
      addExercise: {
        title: newTitle.trim(),
        description: newDesc.trim(),
        points: parseInt(newPoints) || 0,
      },
    });
    setNewTitle("");
    setNewDesc("");
    setNewPoints("0");
    setShowAddForm(false);
    setAdding(false);
  }

  async function submitResponse(exerciseId: string) {
    const answer = answers[exerciseId];
    if (!answer?.trim()) return;
    setSubmitting(exerciseId);
    await onPatch({ submitResponse: { exerciseId, answer: answer.trim() } });
    setSubmitting(null);
  }

  async function gradeResponse(exerciseId: string, studentId: string) {
    const key = `${exerciseId}_${studentId}`;
    const score = parseFloat(gradeInputs[key] ?? "");
    if (isNaN(score)) return;
    await onPatch({ gradeResponse: { exerciseId, studentId, score } });
  }

  const activeExercises = session.exercises.filter((e) => e.isActive);
  const myResponses = new Set(
    session.responses.filter((r) => r.studentId === userId).map((r) => r.exerciseId)
  );

  return (
    <div className="p-6">
      {/* Teacher: Add exercise */}
      {isTeacher && (
        <div className="mb-5">
          {!showAddForm ? (
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 rounded-xl border border-dashed border-moss/30 bg-moss/[0.05] px-4 py-2.5 text-sm font-semibold text-moss transition-colors hover:bg-moss/10"
            >
              <Plus size={16} weight="bold" />
              {locale === "uk" ? "Додати вправу" : "Dodaj ćwiczenie"}
            </button>
          ) : (
            <div className="rounded-[16px] border border-moss/20 bg-moss/[0.05] p-4 space-y-3">
              <h4 className="text-sm font-semibold text-moss">
                {locale === "uk" ? "Нова вправа" : "Nowe ćwiczenie"}
              </h4>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder={locale === "uk" ? "Назва вправи" : "Nazwa ćwiczenia"}
                className="w-full rounded-xl border border-ink/15 px-3 py-2 text-sm focus:border-moss/40 focus:outline-none"
              />
              <textarea
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                rows={3}
                placeholder={
                  locale === "uk"
                    ? "Опис або запитання..."
                    : "Opis lub pytanie..."
                }
                className="w-full resize-none rounded-xl border border-ink/15 px-3 py-2 text-sm focus:border-moss/40 focus:outline-none"
              />
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min={0}
                  value={newPoints}
                  onChange={(e) => setNewPoints(e.target.value)}
                  className="w-20 rounded-xl border border-ink/15 px-3 py-2 text-sm focus:border-moss/40 focus:outline-none"
                  placeholder="0"
                />
                <span className="text-xs text-ink/50">{locale === "uk" ? "балів" : "punktów"}</span>
                <div className="ml-auto flex gap-2">
                  <button
                    onClick={() => setShowAddForm(false)}
                    className="rounded-xl border border-ink/10 px-3 py-2 text-sm hover:bg-ink/5"
                  >
                    <X size={14} />
                  </button>
                  <button
                    onClick={addExercise}
                    disabled={adding || !newTitle.trim()}
                    className="flex items-center gap-1.5 rounded-xl bg-moss px-4 py-2 text-sm font-semibold text-paper hover:bg-moss/90 disabled:opacity-50"
                  >
                    <Check size={14} weight="bold" />
                    {locale === "uk" ? "Додати" : "Dodaj"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Exercise list */}
      {session.exercises.length === 0 ? (
        <div className="py-8 text-center text-sm text-ink/40">
          <Lightning size={32} weight="thin" className="mx-auto mb-2 text-ink/20" />
          {locale === "uk" ? "Немає вправ" : "Brak ćwiczeń"}
        </div>
      ) : (
        <div className="space-y-3">
          {(isTeacher ? session.exercises : activeExercises).map((ex) => {
            const exResponses = session.responses.filter((r) => r.exerciseId === ex.id);
            const myResp = session.responses.find(
              (r) => r.exerciseId === ex.id && r.studentId === userId
            );
            const isExpanded = expandedId === ex.id;

            return (
              <div
                key={ex.id}
                className={`overflow-hidden rounded-[16px] border transition-all ${
                  ex.isActive ? "border-moss/20" : "border-ink/10 opacity-60"
                }`}
              >
                <div className="flex items-start justify-between gap-3 p-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{ex.title}</span>
                      {ex.points > 0 && (
                        <span className="rounded-full bg-gold/10 px-2 py-0.5 text-xs font-semibold text-gold">
                          {ex.points} {locale === "uk" ? "б" : "pkt"}
                        </span>
                      )}
                      {!ex.isActive && (
                        <span className="rounded-full bg-ink/10 px-2 py-0.5 text-xs text-ink/40">
                          {locale === "uk" ? "Неактивна" : "Nieaktywna"}
                        </span>
                      )}
                    </div>
                    {ex.description && (
                      <p className="mt-1 text-sm text-ink/60">{ex.description}</p>
                    )}
                  </div>

                  {isTeacher ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : ex.id)}
                        className="rounded-lg border border-ink/10 px-2.5 py-1 text-xs text-ink/60 hover:bg-ink/5"
                      >
                        {exResponses.length} {locale === "uk" ? "відповідей" : "odpowiedzi"}
                      </button>
                      <button
                        onClick={() =>
                          onPatch({
                            toggleExercise: { exerciseId: ex.id, isActive: !ex.isActive },
                          })
                        }
                        className={`rounded-lg border px-2.5 py-1 text-xs font-semibold transition-colors ${
                          ex.isActive
                            ? "border-terracotta/20 bg-terracotta/5 text-terracotta hover:bg-terracotta/10"
                            : "border-moss/20 bg-moss/5 text-moss hover:bg-moss/10"
                        }`}
                      >
                        {ex.isActive
                          ? locale === "uk"
                            ? "Деактивувати"
                            : "Dezaktywuj"
                          : locale === "uk"
                          ? "Активувати"
                          : "Aktywuj"}
                      </button>
                    </div>
                  ) : myResp ? (
                    <span className="flex items-center gap-1 rounded-full bg-moss/10 px-3 py-1 text-xs font-semibold text-moss">
                      <Check size={12} weight="bold" />
                      {locale === "uk" ? "Здано" : "Oddano"}
                      {myResp.score !== undefined && ` · ${myResp.score}`}
                    </span>
                  ) : null}
                </div>

                {/* Student response form */}
                {!isTeacher && ex.isActive && !myResp && (
                  <div className="border-t border-ink/10 p-4">
                    <textarea
                      value={answers[ex.id] || ""}
                      onChange={(e) =>
                        setAnswers((prev) => ({ ...prev, [ex.id]: e.target.value }))
                      }
                      rows={3}
                      placeholder={locale === "uk" ? "Ваша відповідь..." : "Twoja odpowiedź..."}
                      className="w-full resize-none rounded-xl border border-ink/15 px-3 py-2 text-sm focus:border-moss/40 focus:outline-none"
                    />
                    <button
                      onClick={() => submitResponse(ex.id)}
                      disabled={submitting === ex.id || !answers[ex.id]?.trim()}
                      className="mt-2 flex items-center gap-1.5 rounded-xl bg-moss px-4 py-2 text-sm font-semibold text-paper hover:bg-moss/90 disabled:opacity-50"
                    >
                      <PaperPlaneRight size={14} weight="fill" />
                      {submitting === ex.id
                        ? "..."
                        : locale === "uk"
                        ? "Надіслати"
                        : "Wyślij"}
                    </button>
                  </div>
                )}

                {/* Teacher: responses list */}
                {isTeacher && isExpanded && exResponses.length > 0 && (
                  <div className="divide-y divide-ink/10 border-t border-ink/10">
                    {exResponses.map((resp) => {
                      const key = `${resp.exerciseId}_${resp.studentId}`;
                      return (
                        <div key={key} className="flex items-start gap-3 p-4">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-ink/10 text-xs font-bold text-ink/60">
                            {getInitials(resp.studentName)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold">{resp.studentName}</span>
                              <span className="text-xs text-ink/30">
                                {new Date(resp.submittedAt).toLocaleTimeString(
                                  locale === "uk" ? "uk-UA" : "pl-PL",
                                  { hour: "2-digit", minute: "2-digit" }
                                )}
                              </span>
                            </div>
                            <p className="mt-1 text-sm text-ink/80">{resp.answer}</p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            {resp.score !== undefined ? (
                              <span className="rounded-lg bg-moss/10 px-2 py-1 text-xs font-semibold text-moss">
                                {resp.score}
                              </span>
                            ) : null}
                            <input
                              type="number"
                              min={0}
                              max={ex.points || 100}
                              value={gradeInputs[key] ?? (resp.score !== undefined ? String(resp.score) : "")}
                              onChange={(e) =>
                                setGradeInputs((prev) => ({ ...prev, [key]: e.target.value }))
                              }
                              placeholder={locale === "uk" ? "Оцінка" : "Ocena"}
                              className="w-16 rounded-lg border border-ink/15 px-2 py-1 text-xs text-center focus:border-moss/40 focus:outline-none"
                            />
                            <button
                              onClick={() => gradeResponse(resp.exerciseId, resp.studentId)}
                              className="rounded-lg bg-moss p-1 text-paper hover:bg-moss/90"
                            >
                              <Check size={12} weight="bold" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ===================== Notes Tab =====================

function NotesTab({
  locale,
  value,
  onChange,
  saved,
}: {
  locale: string;
  value: string;
  onChange: (v: string) => void;
  saved: boolean;
}) {
  return (
    <div className="p-6">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="font-semibold">
            {locale === "uk" ? "Мої нотатки" : "Moje notatki"}
          </h3>
          <p className="text-xs text-ink/40 mt-0.5">
            {locale === "uk" ? "Приватні — видно тільки вам" : "Prywatne — widoczne tylko dla Ciebie"}
          </p>
        </div>
        {saved && (
          <span className="flex items-center gap-1 text-xs text-moss">
            <Check size={12} weight="bold" />
            {locale === "uk" ? "Збережено" : "Zapisano"}
          </span>
        )}
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={16}
        placeholder={
          locale === "uk"
            ? "Занотовуйте тут що завгодно: нові слова, граматику, питання..."
            : "Notuj tu co chcesz: nowe słowa, gramatykę, pytania..."
        }
        className="w-full resize-none rounded-[16px] border border-ink/15 bg-ink/[0.02] px-4 py-3 text-sm text-ink focus:border-moss/40 focus:bg-paper focus:outline-none focus:ring-2 focus:ring-moss/10 leading-relaxed"
      />
    </div>
  );
}
