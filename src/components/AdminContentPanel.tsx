"use client";

import { useState } from "react";
import AdminImportPanel from "@/components/AdminImportPanel";
import AdminWorkbookContentPanel from "@/components/AdminWorkbookContentPanel";
import AdminExerciseMaterialsPanel from "@/components/AdminExerciseMaterialsPanel";
import AdminVideoPanel from "@/components/AdminVideoPanel";
import AdminAboutPanel from "@/components/AdminAboutPanel";
import AdminLegalPanel from "@/components/AdminLegalPanel";
import AdminContactPanel from "@/components/AdminContactPanel";

const SECTIONS = [
  { id: "library", label: "Бібліотека" },
  { id: "video", label: "Відео" },
  { id: "pages", label: "Сторінки" }
] as const;

type SectionId = typeof SECTIONS[number]["id"];

export default function AdminContentPanel() {
  const [section, setSection] = useState<SectionId>("library");

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-ink/10 bg-paper/80 p-5 shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">Контент</h2>
            <p className="mt-1 text-sm text-ink/60">Створення, редагування та керування матеріалами.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {SECTIONS.map((item) => (
              <button
                key={item.id}
                onClick={() => setSection(item.id)}
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  section === item.id ? "bg-ink text-paper" : "border border-ink/20 text-ink/60"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {section === "library" && (
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-[0.6fr_0.4fr]">
            <AdminImportPanel />
            <div className="rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft">
              <h3 className="text-lg font-semibold">Швидкий доступ</h3>
              <p className="mt-1 text-sm text-ink/60">
                Використовуй імпорт або додавання контенту для зошита й вправ.
              </p>
              <div className="mt-4 rounded-2xl border border-ink/10 bg-paper/60 px-4 py-3 text-xs text-ink/60">
                Порада: після великих оновлень запускай seed/оновлення бази, щоб зміни зʼявились у всіх вправах.
              </div>
            </div>
          </div>
          <AdminWorkbookContentPanel />
          <AdminExerciseMaterialsPanel />
        </div>
      )}

      {section === "video" && (
        <div className="space-y-6">
          <AdminVideoPanel />
        </div>
      )}

      {section === "pages" && (
        <div className="space-y-6">
          <AdminAboutPanel />
          <AdminLegalPanel />
          <AdminContactPanel />
        </div>
      )}
    </div>
  );
}
