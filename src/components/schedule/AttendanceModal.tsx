"use client";

import { useState, useEffect } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { X } from "@phosphor-icons/react";
import { csrfFetch } from "@/lib/csrf-client";

type AttendanceStatus = "present" | "absent" | "late" | "excused";

interface StudentRow {
  studentId: string;
  studentName: string;
  status: AttendanceStatus;
  note?: string;
}

interface Props {
  event: any;
  occurrenceDate: Date;
  existingAttendance: any;
  onClose: () => void;
  onSaved: () => void;
}

const STATUS_OPTIONS: { value: AttendanceStatus; uk: string; pl: string; active: string; inactive: string }[] = [
  { value: "present", uk: "Присутній", pl: "Obecny", active: "bg-moss text-paper border-moss/20", inactive: "bg-paper text-ink/60 border-ink/10 hover:bg-ink/5" },
  { value: "absent", uk: "Відсутній", pl: "Nieobecny", active: "bg-terracotta text-paper border-terracotta/20", inactive: "bg-paper text-ink/60 border-ink/10 hover:bg-ink/5" },
  { value: "late", uk: "Запізнився", pl: "Spóźniony", active: "bg-gold text-paper border-gold/30", inactive: "bg-paper text-ink/60 border-ink/10 hover:bg-ink/5" },
  { value: "excused", uk: "З причиною", pl: "Usprawiedl.", active: "bg-ink/70 text-paper border-ink/20", inactive: "bg-paper text-ink/60 border-ink/10 hover:bg-ink/5" },
];

export default function AttendanceModal({ event, occurrenceDate, existingAttendance, onClose, onSaved }: Props) {
  const { locale } = useLocale();
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [notes, setNotes] = useState(existingAttendance?.notes || "");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadStudents();
  }, []);

  async function loadStudents() {
    setLoading(true);
    try {
      const classId = event.classId?.toString() || event.classId;
      const res = await fetch(`/api/classes/${classId}/students`);
      if (res.ok) {
        const data = await res.json();
        const classStudents = data.students || [];
        setStudents(
          classStudents.map((s: any) => {
            const existing = existingAttendance?.students?.find(
              (ea: any) => ea.studentId === s.id
            );
            return {
              studentId: s.id,
              studentName: s.name || s.username,
              status: existing?.status || "present",
              note: existing?.note || "",
            };
          })
        );
      }
    } catch (err) {
      console.error("Failed to load students:", err);
    } finally {
      setLoading(false);
    }
  }

  function updateStatus(studentId: string, status: AttendanceStatus) {
    setStudents(prev => prev.map(s => s.studentId === studentId ? { ...s, status } : s));
  }

  function setAllPresent() {
    setStudents(prev => prev.map(s => ({ ...s, status: "present" })));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await csrfFetch(`/api/schedule/${event._id}/attendance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          occurrenceDate: occurrenceDate.toISOString(),
          conducted: true,
          students,
          notes: notes.trim(),
        }),
      });
      if (res.ok) onSaved();
    } catch (err) {
      console.error("Failed to save attendance:", err);
    } finally {
      setSaving(false);
    }
  }

  const presentCount = students.filter(s => s.status === "present" || s.status === "late").length;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-[32px] border border-ink/10 bg-paper shadow-xl">
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-ink/10 bg-gradient-to-br from-moss/10 to-paper p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">
                {locale === "uk" ? "Відвідуваність" : "Frekwencja"}
              </h2>
              <p className="mt-1 text-sm text-ink/60">
                {event.title} · {occurrenceDate.toLocaleDateString(locale === "uk" ? "uk-UA" : "pl-PL", { day: "numeric", month: "long" })}
              </p>
              {!loading && students.length > 0 && (
                <div className="mt-2 flex items-center gap-3">
                  <span className="text-sm text-ink/60">
                    {locale === "uk" ? "Присутніх" : "Obecnych"}: <strong className="text-moss">{presentCount}</strong>/{students.length}
                  </span>
                  <button onClick={setAllPresent} className="text-xs text-moss hover:underline font-medium">
                    {locale === "uk" ? "Всі присутні" : "Wszyscy obecni"}
                  </button>
                </div>
              )}
            </div>
            <button onClick={onClose} className="rounded-full border border-ink/10 p-2 hover:bg-ink/5 shrink-0">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {loading ? (
            <div className="py-8 text-center text-ink/50">
              {locale === "uk" ? "Завантаження..." : "Ładowanie..."}
            </div>
          ) : students.length === 0 ? (
            <div className="py-8 text-center text-ink/50">
              {locale === "uk" ? "Немає студентів у класі" : "Brak uczniów w klasie"}
            </div>
          ) : (
            students.map(student => (
              <div key={student.studentId} className="rounded-[16px] border border-ink/10 bg-paper p-4">
                <div className="mb-3 font-medium">{student.studentName}</div>
                <div className="flex gap-2 flex-wrap">
                  {STATUS_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => updateStatus(student.studentId, opt.value)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-all ${
                        student.status === opt.value ? opt.active : opt.inactive
                      }`}
                    >
                      {locale === "uk" ? opt.uk : opt.pl}
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}

          {!loading && (
            <div>
              <label className="mb-2 block text-sm font-medium text-ink/60">
                {locale === "uk" ? "Нотатки до уроку" : "Notatki do lekcji"}
              </label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={2}
                className="w-full rounded-[16px] border border-ink/10 bg-paper px-4 py-3 text-sm transition-all focus:border-moss/20 focus:outline-none focus:ring-2 focus:ring-moss/20"
                placeholder={locale === "uk" ? "Що було пройдено на уроці..." : "Co było przerabiane na lekcji..."}
              />
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 rounded-full border border-ink/10 py-3 font-semibold hover:bg-ink/5"
            >
              {locale === "uk" ? "Скасувати" : "Anuluj"}
            </button>
            <button
              onClick={handleSave}
              disabled={saving || loading || students.length === 0}
              className="flex-1 rounded-full bg-moss py-3 font-semibold text-paper transition-all hover:bg-moss/90 disabled:opacity-50"
            >
              {saving ? "..." : (locale === "uk" ? "Зберегти" : "Zapisz")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
