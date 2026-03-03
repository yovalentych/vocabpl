"use client";

import { useState } from "react";
import { useLocale } from "@/components/LocaleProvider";
import {
  X,
  Chalkboard,
  ClipboardText,
  Exam,
  Users,
  Megaphone,
  Calendar,
  Clock,
  Repeat,
  MapPin,
  Link as LinkIcon,
  Plus,
  Trash
} from "@phosphor-icons/react";
import type { EventType, RecurrenceFrequency } from "@/lib/schedule";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  classId: string;
  onEventCreated: () => void;
  existingEvent?: any; // For editing
}

const EVENT_TYPE_OPTIONS: { value: EventType; icon: any; labelUk: string; labelPl: string }[] = [
  { value: "lesson", icon: Chalkboard, labelUk: "Урок", labelPl: "Lekcja" },
  { value: "assignment_deadline", icon: ClipboardText, labelUk: "Дедлайн завдання", labelPl: "Termin zadania" },
  { value: "test", icon: Exam, labelUk: "Тест/Іспит", labelPl: "Test/Egzamin" },
  { value: "meeting", icon: Users, labelUk: "Зустріч", labelPl: "Spotkanie" },
  { value: "announcement", icon: Megaphone, labelUk: "Оголошення", labelPl: "Ogłoszenie" }
];

const LESSON_TEMPLATES_UK = [
  "Граматика: Відмінки",
  "Практика розмовної мови",
  "Читання та обговорення тексту",
  "Вивчення нової лексики",
  "Фонетика та вимова",
  "Письмова практика",
  "Перевірка домашнього завдання",
  "Підсумковий урок",
];

const LESSON_TEMPLATES_PL = [
  "Gramatyka: Przypadki",
  "Praktyka konwersacyjna",
  "Czytanie i dyskusja",
  "Nauka nowego słownictwa",
  "Fonetyka i wymowa",
  "Praktyka pisemna",
  "Sprawdzenie pracy domowej",
  "Lekcja podsumowująca",
];

export default function CreateEventModal({
  isOpen,
  onClose,
  classId,
  onEventCreated,
  existingEvent
}: Props) {
  const { t, locale } = useLocale();
  const isEditing = !!existingEvent;

  // Form state
  const [type, setType] = useState<EventType>(existingEvent?.type || "lesson");
  const [title, setTitle] = useState(existingEvent?.title || "");
  const [description, setDescription] = useState(existingEvent?.description || "");
  const [startDate, setStartDate] = useState(
    existingEvent?.startTime ? new Date(existingEvent.startTime).toISOString().slice(0, 16) : ""
  );
  const [duration, setDuration] = useState(existingEvent ?
    Math.round((new Date(existingEvent.endTime).getTime() - new Date(existingEvent.startTime).getTime()) / (1000 * 60)) : 60
  );
  const [location, setLocation] = useState(existingEvent?.location || "");
  const [meetingLink, setMeetingLink] = useState(existingEvent?.meetingLink || "");

  // Recurrence state
  const [isRecurring, setIsRecurring] = useState(existingEvent?.isRecurring || false);
  const [frequency, setFrequency] = useState<RecurrenceFrequency>(
    existingEvent?.recurrence?.frequency || "weekly"
  );
  const [interval, setInterval] = useState(existingEvent?.recurrence?.interval || 1);
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>(
    existingEvent?.recurrence?.daysOfWeek || []
  );
  const [endDate, setEndDate] = useState(
    existingEvent?.recurrence?.endDate ? new Date(existingEvent.recurrence.endDate).toISOString().slice(0, 10) : ""
  );

  const [showTemplates, setShowTemplates] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const templates = locale === "pl" ? LESSON_TEMPLATES_PL : LESSON_TEMPLATES_UK;
  const dayNames = locale === "pl"
    ? ["Nd", "Pn", "Wt", "Śr", "Cz", "Pt", "So"]
    : ["Нд", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];

  const toggleDayOfWeek = (day: number) => {
    if (daysOfWeek.includes(day)) {
      setDaysOfWeek(daysOfWeek.filter(d => d !== day));
    } else {
      setDaysOfWeek([...daysOfWeek, day].sort());
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      if (!title.trim()) {
        throw new Error(locale === "pl" ? "Podaj tytuł" : "Вкажіть назву");
      }

      if (!startDate) {
        throw new Error(locale === "pl" ? "Wybierz datę i czas" : "Виберіть дату та час");
      }

      const startTime = new Date(startDate);
      const endTime = new Date(startTime.getTime() + duration * 60 * 1000);

      const eventData: any = {
        type,
        title: title.trim(),
        description: description.trim(),
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        location: location.trim(),
        meetingLink: meetingLink.trim(),
        isRecurring,
        recurrence: isRecurring
          ? {
              frequency,
              interval,
              daysOfWeek: frequency === "weekly" ? daysOfWeek : undefined,
              endDate: endDate ? new Date(endDate).toISOString() : undefined
            }
          : undefined
      };

      const url = isEditing
        ? `/api/schedule/${existingEvent._id}`
        : `/api/classes/${classId}/schedule`;

      const res = await fetch(url, {
        method: isEditing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventData)
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save event");
      }

      onEventCreated();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const selectedTypeOption = EVENT_TYPE_OPTIONS.find(opt => opt.value === type);
  const TypeIcon = selectedTypeOption?.icon || Chalkboard;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-[32px] border border-ink/10 bg-paper shadow-xl">
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-ink/10 bg-gradient-to-br from-moss/10 to-paper p-6 backdrop-blur">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Calendar size={24} weight="fill" className="text-ink/60" />
                <h2 className="text-2xl font-semibold">
                  {isEditing
                    ? (locale === "pl" ? "Edytuj wydarzenie" : "Редагувати подію")
                    : (locale === "pl" ? "Nowe wydarzenie" : "Нова подія")}
                </h2>
              </div>
              <p className="mt-1 text-sm text-ink/60">
                {locale === "pl"
                  ? "Zaplanuj lekcję, test lub inne wydarzenie"
                  : "Заплануйте урок, тест чи іншу подію"}
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-full border border-ink/10 bg-paper p-2 transition-colors hover:bg-ink/5"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 p-6">
          {/* Event Type */}
          <div>
            <label className="mb-3 block text-sm font-semibold">
              {locale === "pl" ? "Typ wydarzenia" : "Тип події"}
            </label>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              {EVENT_TYPE_OPTIONS.map(option => {
                const Icon = option.icon;
                const isSelected = type === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setType(option.value)}
                    className={`flex flex-col items-center gap-2 rounded-[20px] border p-4 transition-all ${
                      isSelected
                        ? "border-moss/20 bg-moss/10 shadow-sm"
                        : "border-ink/10 bg-paper hover:bg-ink/5"
                    }`}
                  >
                    <Icon size={24} weight="fill" className={isSelected ? "text-moss" : "text-ink/60"} />
                    <span className={`text-xs font-medium ${isSelected ? "text-moss" : "text-ink/60"}`}>
                      {locale === "pl" ? option.labelPl : option.labelUk}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-semibold">
                {locale === "pl" ? "Nazwa" : "Назва"} <span className="text-terracotta">*</span>
              </label>
              {type === "lesson" && (
                <button
                  type="button"
                  onClick={() => setShowTemplates(!showTemplates)}
                  className="text-xs font-medium text-moss hover:underline"
                >
                  {showTemplates
                    ? (locale === "pl" ? "Ukryj szablony" : "Сховати шаблони")
                    : (locale === "pl" ? "Szablony" : "Шаблони")}
                </button>
              )}
            </div>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder={locale === "pl" ? "np. Gramatyka: Przypadki" : "напр. Граматика: Відмінки"}
              className="w-full rounded-[16px] border border-ink/10 bg-paper px-4 py-3 transition-all focus:border-moss/20 focus:outline-none focus:ring-2 focus:ring-moss/20"
              required
            />
            {showTemplates && type === "lesson" && (
              <div className="mt-3 grid grid-cols-2 gap-2">
                {templates.map((template, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setTitle(template);
                      setShowTemplates(false);
                    }}
                    className="rounded-[12px] border border-ink/10 bg-ink/5 px-3 py-2 text-left text-sm transition-all hover:bg-moss/10 hover:border-moss/20"
                  >
                    {template}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="mb-2 block text-sm font-semibold">
              {locale === "pl" ? "Opis" : "Опис"}
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder={locale === "pl" ? "Dodatkowe informacje..." : "Додаткова інформація..."}
              rows={3}
              className="w-full rounded-[16px] border border-ink/10 bg-paper px-4 py-3 transition-all focus:border-moss/20 focus:outline-none focus:ring-2 focus:ring-moss/20"
            />
          </div>

          {/* Date & Time */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold">
                {locale === "pl" ? "Data i czas" : "Дата та час"} <span className="text-terracotta">*</span>
              </label>
              <input
                type="datetime-local"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full rounded-[16px] border border-ink/10 bg-paper px-4 py-3 transition-all focus:border-moss/20 focus:outline-none focus:ring-2 focus:ring-moss/20"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold">
                {locale === "pl" ? "Czas trwania" : "Тривалість"}
              </label>
              <select
                value={duration}
                onChange={e => setDuration(Number(e.target.value))}
                className="w-full rounded-[16px] border border-ink/10 bg-paper px-4 py-3 transition-all focus:border-moss/20 focus:outline-none focus:ring-2 focus:ring-moss/20"
              >
                <option value={30}>30 {locale === "pl" ? "min" : "хв"}</option>
                <option value={45}>45 {locale === "pl" ? "min" : "хв"}</option>
                <option value={60}>60 {locale === "pl" ? "min" : "хв"}</option>
                <option value={90}>90 {locale === "pl" ? "min" : "хв"}</option>
                <option value={120}>120 {locale === "pl" ? "min" : "хв"}</option>
              </select>
            </div>
          </div>

          {/* Recurrence */}
          <div className="rounded-[24px] border border-ink/10 bg-gradient-to-br from-ink/5 to-paper p-6">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={isRecurring}
                onChange={e => setIsRecurring(e.target.checked)}
                className="h-5 w-5 rounded border-ink/20 text-moss focus:ring-moss/20"
              />
              <div className="flex items-center gap-2">
                <Repeat size={20} weight="bold" className="text-moss" />
                <span className="font-semibold">
                  {locale === "pl" ? "Powtarzające się" : "Періодична подія"}
                </span>
              </div>
            </label>

            {isRecurring && (
              <div className="mt-4 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-ink/60">
                      {locale === "pl" ? "Częstotliwość" : "Частота"}
                    </label>
                    <select
                      value={frequency}
                      onChange={e => setFrequency(e.target.value as RecurrenceFrequency)}
                      className="w-full rounded-[12px] border border-ink/10 bg-paper px-3 py-2 text-sm"
                    >
                      <option value="daily">{locale === "pl" ? "Codziennie" : "Щодня"}</option>
                      <option value="weekly">{locale === "pl" ? "Co tydzień" : "Щотижня"}</option>
                      <option value="monthly">{locale === "pl" ? "Co miesiąc" : "Щомісяця"}</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-ink/60">
                      {locale === "pl" ? "Co ile" : "Інтервал"}
                    </label>
                    <select
                      value={interval}
                      onChange={e => setInterval(Number(e.target.value))}
                      className="w-full rounded-[12px] border border-ink/10 bg-paper px-3 py-2 text-sm"
                    >
                      {[1, 2, 3, 4].map(n => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {frequency === "weekly" && (
                  <div>
                    <label className="mb-2 block text-sm font-medium text-ink/60">
                      {locale === "pl" ? "Dni tygodnia" : "Дні тижня"}
                    </label>
                    <div className="flex gap-2">
                      {dayNames.map((day, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => toggleDayOfWeek(idx)}
                          className={`flex h-10 w-10 items-center justify-center rounded-full border text-sm font-medium transition-all ${
                            daysOfWeek.includes(idx)
                              ? "border-moss/20 bg-moss/10 text-moss"
                              : "border-ink/10 bg-paper text-ink/60 hover:bg-ink/5"
                          }`}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="mb-2 block text-sm font-medium text-ink/60">
                    {locale === "pl" ? "Powtarzaj do" : "Повторювати до"} ({locale === "pl" ? "opcjonalne" : "опційно"})
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    className="w-full rounded-[12px] border border-ink/10 bg-paper px-3 py-2 text-sm"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Location & Link */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-semibold">
                <MapPin size={16} weight="fill" className="text-ink/60" />
                {locale === "pl" ? "Miejsce" : "Місце"}
              </label>
              <input
                type="text"
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder={locale === "pl" ? "np. Sala 101" : "напр. Аудиторія 101"}
                className="w-full rounded-[16px] border border-ink/10 bg-paper px-4 py-3 transition-all focus:border-moss/20 focus:outline-none focus:ring-2 focus:ring-moss/20"
              />
            </div>
            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-semibold">
                <LinkIcon size={16} weight="bold" className="text-ink/60" />
                {locale === "pl" ? "Link do spotkania" : "Посилання на зустріч"}
              </label>
              <input
                type="url"
                value={meetingLink}
                onChange={e => setMeetingLink(e.target.value)}
                placeholder="https://..."
                className="w-full rounded-[16px] border border-ink/10 bg-paper px-4 py-3 transition-all focus:border-moss/20 focus:outline-none focus:ring-2 focus:ring-moss/20"
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-[16px] border border-terracotta/20 bg-terracotta/10 p-4 text-sm text-terracotta">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-full border border-ink/10 bg-paper px-6 py-3 font-semibold transition-all hover:bg-ink/5"
            >
              {locale === "pl" ? "Anuluj" : "Скасувати"}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-full border border-moss/20 bg-moss px-6 py-3 font-semibold text-paper transition-all hover:bg-moss/90 disabled:opacity-50"
            >
              {saving
                ? (locale === "pl" ? "Zapisywanie..." : "Збереження...")
                : isEditing
                  ? (locale === "pl" ? "Zapisz zmiany" : "Зберегти зміни")
                  : (locale === "pl" ? "Utwórz wydarzenie" : "Створити подію")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
