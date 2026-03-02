"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { csrfFetch } from "@/lib/csrf-client";

type Teacher = {
  _id: string;
  username: string;
  name: string;
  email: string;
  role: string;
  teacherProfile: {
    status: string;
    planId: string;
    fullName: string;
    schoolOrInstitution?: string;
    createdAt: string;
    subscription: {
      expiresAt: string | null;
      autoRenew: boolean;
    };
    adminApproved: boolean;
    adminNotes?: string;
    stats: {
      totalClasses: number;
      totalStudents: number;
      totalAssignments: number;
    };
  };
  createdAt: string;
};

type StatusCounts = {
  active?: number;
  pending_payment?: number;
  grace_period?: number;
  verifying_email?: number;
};

export default function AdminTeachersClient() {
  const { t, locale } = useLocale();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [stats, setStats] = useState<StatusCounts>({});
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [notes, setNotes] = useState("");
  const [graceDays, setGraceDays] = useState(30);

  const statusLabels: Record<string, string> = {
    active: locale === "pl" ? "Aktywny" : "Активний",
    pending_payment: locale === "pl" ? "Oczekuje płatności" : "Очікує оплати",
    grace_period: locale === "pl" ? "Okres karencji" : "Grace period",
    verifying_email: locale === "pl" ? "Weryfikacja email" : "Верифікація email",
    all: locale === "pl" ? "Wszystkie" : "Всі",
  };

  useEffect(() => {
    loadTeachers();
  }, [selectedStatus]);

  async function loadTeachers() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedStatus !== "all") {
        params.set("status", selectedStatus);
      }

      const res = await fetch(`/api/admin/teachers?${params}`);
      if (!res.ok) throw new Error("Failed to load teachers");

      const data = await res.json();
      setTeachers(data.teachers || []);
      setStats(data.stats || {});
    } catch (error) {
      console.error("Failed to load teachers:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(action: string, teacherId: string) {
    setActionLoading(true);
    try {
      const res = await csrfFetch("/api/admin/teachers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          teacherId,
          notes: notes || undefined,
          gracePeriodDays: action === "extend_grace" ? graceDays : undefined,
        }),
      });

      if (!res.ok) throw new Error("Action failed");

      await loadTeachers();
      setSelectedTeacher(null);
      setNotes("");
      alert(locale === "pl" ? "Akcja wykonana" : "Дію виконано");
    } catch (error) {
      console.error("Action failed:", error);
      alert(locale === "pl" ? "Błąd" : "Помилка");
    } finally {
      setActionLoading(false);
    }
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString(locale === "pl" ? "pl-PL" : "uk-UA");
  };

  return (
    <div className="mx-auto max-w-7xl p-6">
      <h1 className="mb-6 text-3xl font-bold text-stone-900">
        {locale === "pl" ? "Nauczyciele" : "Вчителі"}
      </h1>

      {/* Stats Cards */}
      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
          <div className="text-sm text-stone-600">
            {locale === "pl" ? "Aktywni" : "Активні"}
          </div>
          <div className="text-2xl font-bold text-green-600">{stats.active || 0}</div>
        </div>
        <div className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
          <div className="text-sm text-stone-600">
            {locale === "pl" ? "Oczekuje płatności" : "Очікує оплати"}
          </div>
          <div className="text-2xl font-bold text-blue-600">{stats.pending_payment || 0}</div>
        </div>
        <div className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
          <div className="text-sm text-stone-600">
            {locale === "pl" ? "Okres karencji" : "Grace period"}
          </div>
          <div className="text-2xl font-bold text-orange-600">{stats.grace_period || 0}</div>
        </div>
        <div className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
          <div className="text-sm text-stone-600">
            {locale === "pl" ? "Weryfikacja" : "Верифікація"}
          </div>
          <div className="text-2xl font-bold text-amber-600">{stats.verifying_email || 0}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-4">
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="rounded-lg border border-stone-300 px-4 py-2"
        >
          <option value="all">{statusLabels.all}</option>
          <option value="active">{statusLabels.active}</option>
          <option value="pending_payment">{statusLabels.pending_payment}</option>
          <option value="grace_period">{statusLabels.grace_period}</option>
          <option value="verifying_email">{statusLabels.verifying_email}</option>
        </select>
      </div>

      {/* Teachers Table */}
      {loading ? (
        <div className="text-center text-stone-600">
          {locale === "pl" ? "Ładowanie..." : "Завантаження..."}
        </div>
      ) : teachers.length === 0 ? (
        <div className="text-center text-stone-600">
          {locale === "pl" ? "Brak nauczycieli" : "Немає вчителів"}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-stone-200 bg-white shadow-sm">
          <table className="w-full">
            <thead className="border-b border-stone-200 bg-stone-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-stone-700">
                  {locale === "pl" ? "Imię" : "Ім'я"}
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-stone-700">Email</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-stone-700">
                  {locale === "pl" ? "Plan" : "План"}
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-stone-700">Status</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-stone-700">
                  {locale === "pl" ? "Klasy" : "Класи"}
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-stone-700">
                  {locale === "pl" ? "Zarejestrowano" : "Зареєстровано"}
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-stone-700">
                  {locale === "pl" ? "Akcje" : "Дії"}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {teachers.map((teacher) => (
                <tr key={teacher._id} className="hover:bg-stone-50">
                  <td className="px-4 py-3 text-sm text-stone-900">
                    {teacher.teacherProfile.fullName}
                  </td>
                  <td className="px-4 py-3 text-sm text-stone-600">{teacher.email}</td>
                  <td className="px-4 py-3 text-sm text-stone-600">
                    {teacher.teacherProfile.planId}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${
                        teacher.teacherProfile.status === "active"
                          ? "bg-green-100 text-green-800"
                          : teacher.teacherProfile.status === "grace_period"
                            ? "bg-orange-100 text-orange-800"
                            : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {statusLabels[teacher.teacherProfile.status] || teacher.teacherProfile.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-stone-600">
                    {teacher.teacherProfile.stats.totalClasses}
                  </td>
                  <td className="px-4 py-3 text-sm text-stone-600">
                    {formatDate(teacher.teacherProfile.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setSelectedTeacher(teacher)}
                      className="text-sm font-medium text-blue-600 hover:text-blue-800"
                    >
                      {locale === "pl" ? "Szczegóły" : "Деталі"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Teacher Detail Modal */}
      {selectedTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-stone-900">
                {selectedTeacher.teacherProfile.fullName}
              </h2>
              <button
                onClick={() => setSelectedTeacher(null)}
                className="text-stone-600 hover:text-stone-900"
              >
                ✕
              </button>
            </div>

            <div className="mb-6 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-stone-600">Email:</span>
                <span className="font-medium text-stone-900">{selectedTeacher.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-600">
                  {locale === "pl" ? "Plan" : "План"}:
                </span>
                <span className="font-medium text-stone-900">
                  {selectedTeacher.teacherProfile.planId}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-600">
                  {locale === "pl" ? "Szkoła" : "Школа"}:
                </span>
                <span className="font-medium text-stone-900">
                  {selectedTeacher.teacherProfile.schoolOrInstitution || "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-600">
                  {locale === "pl" ? "Klasy" : "Класи"}:
                </span>
                <span className="font-medium text-stone-900">
                  {selectedTeacher.teacherProfile.stats.totalClasses}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-600">
                  {locale === "pl" ? "Uczniowie" : "Студенти"}:
                </span>
                <span className="font-medium text-stone-900">
                  {selectedTeacher.teacherProfile.stats.totalStudents}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-600">
                  {locale === "pl" ? "Zadania" : "Завдання"}:
                </span>
                <span className="font-medium text-stone-900">
                  {selectedTeacher.teacherProfile.stats.totalAssignments}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-600">
                  {locale === "pl" ? "Wygasa" : "Закінчується"}:
                </span>
                <span className="font-medium text-stone-900">
                  {formatDate(selectedTeacher.teacherProfile.subscription.expiresAt)}
                </span>
              </div>
            </div>

            {/* Admin Actions */}
            <div className="space-y-4 border-t border-stone-200 pt-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-stone-700">
                  {locale === "pl" ? "Notatki administratora" : "Примітки адміністратора"}
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full rounded-lg border border-stone-300 p-2 text-sm"
                  rows={3}
                  placeholder={
                    selectedTeacher.teacherProfile.adminNotes ||
                    (locale === "pl" ? "Dodaj notatkę..." : "Додати примітку...")
                  }
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {!selectedTeacher.teacherProfile.adminApproved && (
                  <button
                    onClick={() => handleAction("approve", selectedTeacher._id)}
                    disabled={actionLoading}
                    className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                  >
                    {locale === "pl" ? "Zatwierdź" : "Схвалити"}
                  </button>
                )}

                {selectedTeacher.teacherProfile.status === "grace_period" && (
                  <>
                    <input
                      type="number"
                      value={graceDays}
                      onChange={(e) => setGraceDays(parseInt(e.target.value))}
                      className="w-20 rounded-lg border border-stone-300 px-2 py-2 text-sm"
                      min="1"
                      max="90"
                    />
                    <button
                      onClick={() => handleAction("extend_grace", selectedTeacher._id)}
                      disabled={actionLoading}
                      className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      {locale === "pl" ? "Przedłuż okres karencji" : "Продовжити grace period"}
                    </button>
                  </>
                )}

                <button
                  onClick={() => handleAction("add_note", selectedTeacher._id)}
                  disabled={actionLoading}
                  className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50 disabled:opacity-50"
                >
                  {locale === "pl" ? "Zapisz notatkę" : "Зберегти примітку"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
