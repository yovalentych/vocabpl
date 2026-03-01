"use client";

import { useState } from "react";
import { ArrowLeft, Plus, Check, User } from "@phosphor-icons/react";

type AddStudentPageProps = {
  classId: string;
  locale: "uk" | "pl";
};

type AddedStudent = {
  username: string;
  addedAt: Date;
};

export default function AddStudentPage({ classId, locale }: AddStudentPageProps) {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justAdded, setJustAdded] = useState<string | null>(null);
  const [recentlyAdded, setRecentlyAdded] = useState<AddedStudent[]>([]);

  const t = locale === "uk" ? {
    title: "Додати студента",
    backToClass: "Назад до класу",
    usernamePlaceholder: "Введіть username студента",
    add: "Додати",
    adding: "Додавання...",
    added: "додано до класу",
    errorNotFound: "Користувача не знайдено",
    errorAlreadyInClass: "Студент вже в класі",
    errorGeneric: "Помилка додавання студента",
    recentlyAdded: "Нещодавно додані",
  } : {
    title: "Dodaj ucznia",
    backToClass: "Powrót do klasy",
    usernamePlaceholder: "Wprowadź username ucznia",
    add: "Dodaj",
    adding: "Dodawanie...",
    added: "dodano do klasy",
    errorNotFound: "Nie znaleziono użytkownika",
    errorAlreadyInClass: "Uczeń jest już w klasie",
    errorGeneric: "Błąd dodawania ucznia",
    recentlyAdded: "Ostatnio dodani",
  };

  async function handleAdd() {
    const trimmed = username.trim();
    if (!trimmed || loading) return;

    setLoading(true);
    setError(null);
    setJustAdded(null);

    try {
      const res = await fetch(`/api/classes/${classId}/students`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: trimmed }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 404) {
          setError(t.errorNotFound);
        } else if (res.status === 409) {
          setError(t.errorAlreadyInClass);
        } else {
          setError(data.error || t.errorGeneric);
        }
        return;
      }

      setJustAdded(trimmed);
      setRecentlyAdded((prev) => [
        { username: trimmed, addedAt: new Date() },
        ...prev,
      ]);
      setUsername("");
    } catch {
      setError(t.errorGeneric);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-5 sm:px-6 py-10">
      {/* Back link */}
      <a
        href={`/classes/${classId}?tab=students`}
        className="inline-flex items-center gap-2 text-sm text-ink/60 hover:text-ink transition-colors mb-6"
      >
        <ArrowLeft size={16} />
        {t.backToClass}
      </a>

      {/* Title */}
      <h1 className="text-3xl font-bold text-ink mb-8">{t.title}</h1>

      {/* Input + Add button */}
      <div className="flex gap-3">
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleAdd();
          }}
          placeholder={t.usernamePlaceholder}
          className="flex-1 rounded-2xl border border-ink/20 bg-paper px-4 py-3 text-ink placeholder:text-ink/40 outline-none focus:border-moss/50 transition-colors"
        />
        <button
          onClick={handleAdd}
          disabled={loading || !username.trim()}
          className="inline-flex items-center gap-2 rounded-full border border-moss/30 bg-moss px-5 py-2.5 text-sm font-semibold text-white hover:bg-moss/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus size={18} weight="bold" />
          {loading ? t.adding : t.add}
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div className="mt-4 rounded-2xl border border-terracotta/20 bg-terracotta/5 px-4 py-3 text-sm text-terracotta">
          {error}
        </div>
      )}

      {/* Success message */}
      {justAdded && (
        <div className="mt-4 rounded-2xl border border-moss/20 bg-moss/5 px-4 py-3 text-sm text-moss flex items-center gap-2">
          <Check size={16} weight="bold" />
          <span>
            <span className="font-semibold">@{justAdded}</span> {t.added}
          </span>
        </div>
      )}

      {/* Recently added students */}
      {recentlyAdded.length > 0 && (
        <div className="mt-8">
          <h2 className="text-sm font-semibold text-ink/60 mb-3">
            {t.recentlyAdded}
          </h2>
          <div className="space-y-2">
            {recentlyAdded.map((student, i) => (
              <div
                key={`${student.username}-${i}`}
                className="rounded-2xl border border-ink/10 bg-paper px-4 py-3 flex items-center gap-3"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-moss/10">
                  <User size={16} className="text-moss" />
                </div>
                <span className="font-semibold text-ink">
                  @{student.username}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
