"use client";

import { useState, useEffect } from "react";
import { X, Check, GraduationCap } from "@phosphor-icons/react";
import Loader from "../ui/Loader";

type Class = {
  _id: string;
  name: string;
  description?: string;
  stats: {
    totalStudents: number;
  };
};

type SelectClassModalProps = {
  onSelect: (classId: string) => void;
  onClose: () => void;
  locale: "uk" | "pl";
  excludeClassId?: string;
};

export default function SelectClassModal({
  onSelect,
  onClose,
  locale,
  excludeClassId
}: SelectClassModalProps) {
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const t = locale === "uk" ? {
    title: "Вибрати клас",
    select: "Вибрати",
    cancel: "Скасувати",
    loading: "Завантаження...",
    noClasses: "Немає доступних класів",
    students: "студентів"
  } : {
    title: "Wybierz klasę",
    select: "Wybierz",
    cancel: "Anuluj",
    loading: "Ładowanie...",
    noClasses: "Brak dostępnych klas",
    students: "uczniów"
  };

  useEffect(() => {
    loadClasses();
  }, []);

  async function loadClasses() {
    try {
      setLoading(true);
      const res = await fetch("/api/classes");
      if (res.ok) {
        const data = await res.json();
        const availableClasses = (data.classes || []).filter(
          (c: Class) => c._id !== excludeClassId
        );
        setClasses(availableClasses);
      }
    } catch (error) {
      console.error("Failed to load classes:", error);
    } finally {
      setLoading(false);
    }
  }

  function handleSelect() {
    if (selectedId) {
      onSelect(selectedId);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-2xl bg-paper rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-ink/10">
          <h2 className="text-xl font-bold text-ink">{t.title}</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-ink/40 hover:bg-ink/5 hover:text-ink transition-colors"
          >
            <X size={24} weight="bold" />
          </button>
        </div>

        {/* Content */}
        <div className="max-h-96 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader size="lg" label={t.loading} />
            </div>
          ) : classes.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-ink/60">{t.noClasses}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {classes.map((cls) => (
                <button
                  key={cls._id}
                  type="button"
                  onClick={() => setSelectedId(cls._id)}
                  className={`w-full rounded-xl border-2 p-4 text-left transition-all ${
                    selectedId === cls._id
                      ? "border-moss bg-moss/10"
                      : "border-ink/10 hover:border-moss/30"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      {selectedId === cls._id && (
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-moss">
                          <Check size={14} weight="bold" className="text-white" />
                        </div>
                      )}
                      <div>
                        <h3 className="font-bold text-ink">{cls.name}</h3>
                        {cls.description && (
                          <p className="text-sm text-ink/60 line-clamp-1">{cls.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-ink/50">
                      <GraduationCap size={16} weight="fill" />
                      <span>{cls.stats.totalStudents} {t.students}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-ink/10">
          <button
            onClick={onClose}
            className="rounded-full border border-ink/20 bg-paper px-5 py-2.5 text-sm font-semibold text-ink hover:bg-ink/5 transition-colors"
          >
            {t.cancel}
          </button>
          <button
            onClick={handleSelect}
            disabled={!selectedId}
            className="rounded-full border border-moss/30 bg-moss px-5 py-2.5 text-sm font-semibold text-white hover:bg-moss/90 transition-colors disabled:opacity-50"
          >
            {t.select}
          </button>
        </div>
      </div>
    </div>
  );
}
