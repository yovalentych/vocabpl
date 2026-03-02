"use client";

import { useState } from "react";
import { X } from "@phosphor-icons/react";
import type { EventType } from "@/lib/schedule";

type CreateEventModalProps = {
  classId: string;
  locale: "uk" | "pl";
  onClose: () => void;
  onSuccess: () => void;
};

export default function CreateEventModal({
  classId,
  locale,
  onClose,
  onSuccess
}: CreateEventModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    type: "lesson" as EventType,
    title: "",
    description: "",
    startTime: "",
    endTime: "",
    location: "",
    meetingLink: "",
    isRecurring: false
  });

  const t = locale === "uk" ? {
    title: "Створити подію",
    save: "Зберегти",
    cancel: "Скасувати",
    fields: {
      type: "Тип",
      title: "Назва",
      description: "Опис",
      startTime: "Початок",
      endTime: "Кінець",
      location: "Місце",
      meetingLink: "Посилання",
      recurring: "Повторювана"
    },
    eventTypes: {
      lesson: "Заняття",
      test: "Тест",
      meeting: "Зустріч",
      announcement: "Оголошення"
    }
  } : {
    title: "Utwórz wydarzenie",
    save: "Zapisz",
    cancel: "Anuluj",
    fields: {
      type: "Typ",
      title: "Tytuł",
      description: "Opis",
      startTime: "Początek",
      endTime: "Koniec",
      location: "Miejsce",
      meetingLink: "Link",
      recurring: "Powtarzające się"
    },
    eventTypes: {
      lesson: "Lekcja",
      test: "Test",
      meeting: "Spotkanie",
      announcement: "Ogłoszenie"
    }
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.title || !formData.startTime || !formData.endTime) return;

    try {
      setSubmitting(true);
      const res = await fetch(`/api/classes/${classId}/schedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        alert("Failed to create event");
      }
    } catch (error) {
      console.error("Failed to create event:", error);
      alert("Failed to create event");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-sm">
      <div className="bg-paper rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-ink/10">
          <h2 className="text-xl font-bold text-ink">{t.title}</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-ink/5 transition-colors"
          >
            <X size={20} weight="bold" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-ink mb-2">
              {t.fields.type}
            </label>
            <select
              value={formData.type}
              onChange={e => setFormData({ ...formData, type: e.target.value as EventType })}
              className="w-full rounded-lg border border-ink/20 px-4 py-2.5 focus:border-moss focus:outline-none"
            >
              <option value="lesson">{t.eventTypes.lesson}</option>
              <option value="test">{t.eventTypes.test}</option>
              <option value="meeting">{t.eventTypes.meeting}</option>
              <option value="announcement">{t.eventTypes.announcement}</option>
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-ink mb-2">
              {t.fields.title} *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              required
              className="w-full rounded-lg border border-ink/20 px-4 py-2.5 focus:border-moss focus:outline-none"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-ink mb-2">
              {t.fields.description}
            </label>
            <textarea
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full rounded-lg border border-ink/20 px-4 py-2.5 focus:border-moss focus:outline-none resize-none"
            />
          </div>

          {/* Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-ink mb-2">
                {t.fields.startTime} *
              </label>
              <input
                type="datetime-local"
                value={formData.startTime}
                onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                required
                className="w-full rounded-lg border border-ink/20 px-4 py-2.5 focus:border-moss focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-2">
                {t.fields.endTime} *
              </label>
              <input
                type="datetime-local"
                value={formData.endTime}
                onChange={e => setFormData({ ...formData, endTime: e.target.value })}
                required
                className="w-full rounded-lg border border-ink/20 px-4 py-2.5 focus:border-moss focus:outline-none"
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-ink mb-2">
              {t.fields.location}
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={e => setFormData({ ...formData, location: e.target.value })}
              className="w-full rounded-lg border border-ink/20 px-4 py-2.5 focus:border-moss focus:outline-none"
            />
          </div>

          {/* Meeting Link */}
          <div>
            <label className="block text-sm font-medium text-ink mb-2">
              {t.fields.meetingLink}
            </label>
            <input
              type="url"
              value={formData.meetingLink}
              onChange={e => setFormData({ ...formData, meetingLink: e.target.value })}
              placeholder="https://..."
              className="w-full rounded-lg border border-ink/20 px-4 py-2.5 focus:border-moss focus:outline-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-lg border border-ink/20 text-ink hover:bg-ink/5 transition-colors"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              disabled={submitting || !formData.title || !formData.startTime || !formData.endTime}
              className="px-5 py-2.5 rounded-lg bg-moss text-white font-semibold hover:bg-moss/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? "..." : t.save}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
