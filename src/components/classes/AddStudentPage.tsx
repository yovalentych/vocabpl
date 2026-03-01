"use client";

import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Plus, Check, User, MagnifyingGlass } from "@phosphor-icons/react";

type AddStudentPageProps = {
  classId: string;
  locale: "uk" | "pl";
};

type AddedStudent = {
  username: string;
  addedAt: Date;
};

type SearchResult = {
  id: string;
  username: string;
  name: string;
};

export default function AddStudentPage({ classId, locale }: AddStudentPageProps) {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justAdded, setJustAdded] = useState<string | null>(null);
  const [recentlyAdded, setRecentlyAdded] = useState<AddedStudent[]>([]);

  // Search autocomplete
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [searching, setSearching] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const t = locale === "uk" ? {
    title: "Додати студента",
    backToClass: "Назад до класу",
    usernamePlaceholder: "Почніть вводити ім'я або username...",
    add: "Додати",
    adding: "Додавання...",
    added: "додано до класу",
    errorNotFound: "Користувача не знайдено",
    errorAlreadyInClass: "Студент вже в класі",
    errorGeneric: "Помилка додавання студента",
    recentlyAdded: "Нещодавно додані",
    searching: "Пошук...",
    noResults: "Нічого не знайдено",
  } : {
    title: "Dodaj ucznia",
    backToClass: "Powrót do klasy",
    usernamePlaceholder: "Zacznij wpisywać imię lub username...",
    add: "Dodaj",
    adding: "Dodawanie...",
    added: "dodano do klasy",
    errorNotFound: "Nie znaleziono użytkownika",
    errorAlreadyInClass: "Uczeń jest już w klasie",
    errorGeneric: "Błąd dodawania ucznia",
    recentlyAdded: "Ostatnio dodani",
    searching: "Szukanie...",
    noResults: "Nie znaleziono",
  };

  // Search users with debouncing
  useEffect(() => {
    const trimmed = username.trim();
    if (trimmed.length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      setSelectedIndex(-1);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setSearching(true);
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(trimmed)}`);
        if (!res.ok) throw new Error();

        const data = await res.json();
        setSearchResults(data.users || []);
        setShowDropdown(true);
        setSelectedIndex(-1);
      } catch {
        setSearchResults([]);
        setShowDropdown(false);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [username]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
        setSelectedIndex(-1);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
      setShowDropdown(false);
      setSearchResults([]);
    } catch {
      setError(t.errorGeneric);
    } finally {
      setLoading(false);
    }
  }

  function selectUser(user: SearchResult) {
    setUsername(user.username);
    setShowDropdown(false);
    setSearchResults([]);
    setSelectedIndex(-1);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!showDropdown || searchResults.length === 0) {
      if (e.key === "Enter") {
        e.preventDefault();
        handleAdd();
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev < searchResults.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < searchResults.length) {
        selectUser(searchResults[selectedIndex]);
      } else {
        handleAdd();
      }
    } else if (e.key === "Escape") {
      setShowDropdown(false);
      setSelectedIndex(-1);
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
      <div className="relative" ref={dropdownRef}>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setError(null);
                setJustAdded(null);
              }}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                if (searchResults.length > 0) setShowDropdown(true);
              }}
              placeholder={t.usernamePlaceholder}
              className="w-full rounded-2xl border border-ink/20 bg-paper pl-11 pr-4 py-3 text-ink placeholder:text-ink/40 outline-none focus:border-moss/50 transition-colors"
            />
            <MagnifyingGlass
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/40"
            />
            {searching && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-moss/20 border-t-moss" />
              </div>
            )}
          </div>
          <button
            onClick={handleAdd}
            disabled={loading || !username.trim()}
            className="inline-flex items-center gap-2 rounded-full border border-moss/30 bg-moss px-5 py-2.5 text-sm font-semibold text-white hover:bg-moss/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus size={18} weight="bold" />
            {loading ? t.adding : t.add}
          </button>
        </div>

        {/* Search results dropdown */}
        {showDropdown && username.trim().length >= 2 && (
          <div className="absolute z-10 mt-2 w-full rounded-2xl border border-ink/10 bg-paper shadow-lg max-h-80 overflow-y-auto">
            {searchResults.length > 0 ? (
              <div className="py-2">
                {searchResults.map((user, index) => (
                  <button
                    key={user.id}
                    onClick={() => selectUser(user)}
                    className={`w-full px-4 py-3 text-left flex items-center gap-3 transition-colors ${
                      index === selectedIndex
                        ? "bg-moss/10"
                        : "hover:bg-ink/5"
                    }`}
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-moss/10">
                      <User size={18} className="text-moss" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-ink truncate">
                        @{user.username}
                      </p>
                      {user.name && (
                        <p className="text-xs text-ink/60 truncate">
                          {user.name}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="px-4 py-8 text-center text-sm text-ink/50">
                {searching ? t.searching : t.noResults}
              </div>
            )}
          </div>
        )}
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
