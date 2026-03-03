"use client";

import { useState, useEffect } from "react";
import { useLocale } from "@/components/LocaleProvider";
import Link from "next/link";
import { Users, MagnifyingGlass, ChartBar } from "@phosphor-icons/react";

export default function AcademyStudents() {
  const { t, locale } = useLocale();
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadStudents();
  }, []);

  async function loadStudents() {
    setLoading(true);
    try {
      // Load all classes to get all students
      const classesRes = await fetch("/api/classes");
      if (classesRes.ok) {
        const data = await classesRes.json();
        const allStudents = new Map();

        // Gather unique students from all classes
        for (const cls of data.classes || []) {
          const classRes = await fetch(`/api/classes/${cls._id}`);
          if (classRes.ok) {
            const classData = await classRes.json();
            (classData.class?.students || []).forEach((student: any) => {
              if (!allStudents.has(student._id?.toString())) {
                allStudents.set(student._id?.toString(), {
                  ...student,
                  classes: [{ id: cls._id, name: cls.name }]
                });
              } else {
                const existing = allStudents.get(student._id?.toString());
                existing.classes.push({ id: cls._id, name: cls.name });
              }
            });
          }
        }

        setStudents(Array.from(allStudents.values()));
      }
    } catch (error) {
      console.error("Failed to load students:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-ink/60">{locale === "pl" ? "Ładowanie..." : "Завантаження..."}</div>
      </div>
    );
  }

  const filteredStudents = students.filter(s =>
    s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">
            {locale === "pl" ? "Wszyscy studenci" : "Всі студенти"}
          </h2>
          <p className="text-sm text-ink/60">
            {locale === "pl" ? "Zarządzaj studentami ze wszystkich klas" : "Керуйте студентами з усіх класів"}
          </p>
        </div>
        <div className="text-2xl font-semibold text-moss">{students.length}</div>
      </div>

      {/* Search */}
      <div className="relative">
        <MagnifyingGlass
          size={20}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/40"
        />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder={locale === "pl" ? "Szukaj studenta..." : "Шукати студента..."}
          className="w-full rounded-full border border-ink/10 bg-paper py-3 pl-12 pr-4 transition-all focus:border-moss/20 focus:outline-none focus:ring-2 focus:ring-moss/20"
        />
      </div>

      {/* Students List */}
      {filteredStudents.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredStudents.map((student: any) => (
            <div
              key={student._id}
              className="rounded-[24px] border border-ink/10 bg-paper p-6 shadow-soft"
            >
              <div className="mb-3 flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold">{student.name || student.username}</h3>
                  <p className="text-sm text-ink/60">@{student.username}</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-moss/20 bg-moss/10">
                  <Users size={20} weight="fill" className="text-moss" />
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm">
                  <span className="text-ink/60">{locale === "pl" ? "Klasy:" : "Класи:"}</span>{" "}
                  <span className="font-medium">{student.classes?.length || 0}</span>
                </div>
                {student.classes && student.classes.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {student.classes.slice(0, 3).map((cls: any) => (
                      <Link
                        key={cls.id}
                        href={`/classes/${cls.id}`}
                        className="rounded-full border border-ink/10 bg-ink/5 px-2 py-0.5 text-xs hover:bg-moss/10"
                      >
                        {cls.name}
                      </Link>
                    ))}
                    {student.classes.length > 3 && (
                      <span className="rounded-full border border-ink/10 bg-ink/5 px-2 py-0.5 text-xs">
                        +{student.classes.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-[24px] border border-ink/10 bg-ink/5 p-12 text-center">
          <Users size={48} weight="thin" className="mx-auto mb-4 text-ink/40" />
          <p className="text-ink/60">
            {searchQuery
              ? (locale === "pl" ? "Nie znaleziono studentów" : "Студентів не знайдено")
              : (locale === "pl" ? "Nie masz jeszcze studentów" : "У вас ще немає студентів")}
          </p>
        </div>
      )}
    </div>
  );
}
