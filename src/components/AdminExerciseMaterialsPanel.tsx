"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale } from "@/components/LocaleProvider";

type ExerciseMaterial = {
  _id: string;
  type: string;
  level: string;
  title?: string;
  content: unknown;
  createdAt?: string;
};

const levelOptions = ["A1", "A2", "B1", "B2"];

export default function AdminExerciseMaterialsPanel() {
  const { t } = useLocale();
  const [items, setItems] = useState<ExerciseMaterial[]>([]);
  const [activeType, setActiveType] = useState("cloze");
  const [level, setLevel] = useState("A1");
  const [title, setTitle] = useState("");
  const sampleByType: Record<string, string> = useMemo(
    () => ({
      cloze: JSON.stringify(
        {
          items: [
            {
              id: "fg_001",
              text: "Ja ___ do pracy, ponieważ ___ pada.",
              gaps: [
                { index: 1, answers: ["idę", "chodzę"], hint: "дієслово руху" },
                { index: 2, answers: ["prawie nie", "już nie"] }
              ]
            }
          ]
        },
        null,
        2
      ),
      match: JSON.stringify(
        {
          shuffle: true,
          pairs: [
            { left: "prawie", right: "майже" },
            { left: "ponieważ", right: "тому що" },
            { left: "zwykle", right: "зазвичай" }
          ]
        },
        null,
        2
      ),
      dialogue: JSON.stringify(
        {
          dialogs: [
            {
              id: "md_static_001",
              scenario: {
                pl: "W sklepie: prosisz o chleb i pytasz o cenę.",
                uk: "У магазині: попроси хліб і запитай ціну."
              },
              participants: [
                { id: "p1", name: "Klient" },
                { id: "p2", name: "Sprzedawca" }
              ],
              turns: [
                { who: "p1", pl: "Dzień dobry! Poproszę chleb." },
                { who: "p2", pl: "Dzień dobry. Biały czy razowy?" },
                { who: "p1", pl: "Biały, proszę. Ile kosztuje?" },
                { who: "p2", pl: "Siedem złotych." }
              ]
            }
          ]
        },
        null,
        2
      ),
      paraphrase: JSON.stringify(
        {
          items: [
            {
              id: "pp_001",
              sourcePl: "Nie mam czasu, bo muszę pracować.",
              instructionUk: "Перефразуйте без слова «bo».",
              instructionPl: "Przepisz bez słowa „bo”.",
              constraints: {
                forbiddenWords: ["bo"],
                requireAtLeastOneOf: ["ponieważ", "więc"],
                minWords: 6
              },
              reference: [
                "Nie mam czasu, ponieważ muszę pracować.",
                "Nie mam czasu, gdyż muszę pracować."
              ],
              targetVocabIds: ["v_ponieważ", "v_muszę"]
            }
          ]
        },
        null,
        2
      )
    }),
    []
  );
  const [jsonText, setJsonText] = useState(sampleByType.cloze);
  const [status, setStatus] = useState<"idle" | "saving" | "error" | "saved">("idle");

  const types = useMemo(
    () => [
      { id: "cloze", label: t.workbook.exercises.cloze.title },
      { id: "match", label: t.workbook.exercises.match.title },
      { id: "dialogue", label: t.workbook.exercises.dialogue.title },
      { id: "paraphrase", label: t.workbook.exercises.rewrite.title }
    ],
    [t]
  );

  useEffect(() => {
    let mounted = true;
    async function load() {
      const res = await fetch("/api/admin/exercises");
      if (!res.ok) return;
      const data = await res.json().catch(() => ({}));
      if (!mounted) return;
      setItems(data.items || []);
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    setJsonText(sampleByType[activeType] || sampleByType.cloze);
  }, [activeType, sampleByType]);

  async function addItem() {
    setStatus("idle");
    let content: unknown = null;
    try {
      content = JSON.parse(jsonText);
    } catch (error) {
      setStatus("error");
      return;
    }
    setStatus("saving");
    const res = await fetch("/api/admin/exercises", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: activeType, level, title, content })
    });
    if (!res.ok) {
      setStatus("error");
      return;
    }
    const data = await res.json().catch(() => ({}));
    setItems((prev) => [data.item, ...prev]);
    setTitle("");
    setJsonText(sampleByType[activeType] || sampleByType.cloze);
    setStatus("saved");
  }

  async function removeItem(id: string) {
    await fetch(`/api/admin/exercises?id=${id}`, { method: "DELETE" });
    setItems((prev) => prev.filter((item) => item._id !== id));
  }

  const filtered = items.filter((item) => item.type === activeType);

  return (
    <div className="rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">{t.admin.exerciseMaterialsTitle}</h2>
          <p className="mt-2 text-sm text-ink/60">{t.admin.exerciseMaterialsSubtitle}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {types.map((type) => (
          <button
            key={type.id}
            onClick={() => setActiveType(type.id)}
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              activeType === type.id ? "bg-ink text-paper" : "border border-ink/20 text-ink"
            }`}
          >
            {type.label}
          </button>
        ))}
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-[160px_1fr]">
        <label className="text-sm text-ink/70">
          {t.admin.exerciseMaterialLevel}
          <select
            value={level}
            onChange={(event) => setLevel(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-ink/20 bg-paper px-3 py-2 text-sm"
          >
            {levelOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm text-ink/70">
          {t.admin.exerciseMaterialTitle}
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-ink/20 bg-paper px-4 py-2 text-sm"
            placeholder={t.admin.exerciseMaterialTitlePlaceholder}
          />
        </label>
      </div>

      <label className="mt-4 block text-sm text-ink/70">
        {t.admin.exerciseMaterialJson}
        <textarea
          value={jsonText}
          onChange={(event) => setJsonText(event.target.value)}
          className="mt-2 h-[220px] w-full rounded-2xl border border-ink/20 bg-paper px-4 py-3 font-mono text-[12px] text-ink"
          placeholder={t.admin.exerciseMaterialJsonPlaceholder}
        />
      </label>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          onClick={addItem}
          className="rounded-full bg-ink px-4 py-2 text-xs font-semibold text-paper"
        >
          {t.admin.exerciseMaterialAdd}
        </button>
        {status === "error" && <span className="text-xs text-terracotta">{t.admin.exerciseMaterialError}</span>}
        {status === "saved" && <span className="text-xs text-moss">{t.admin.exerciseMaterialSaved}</span>}
      </div>

      <div className="mt-6 space-y-3">
        {filtered.length === 0 ? (
          <p className="text-sm text-ink/60">{t.admin.exerciseMaterialEmpty}</p>
        ) : (
          filtered.map((item) => (
            <div key={item._id} className="rounded-2xl border border-ink/10 bg-paper/60 p-4 text-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">{item.title || t.admin.exerciseMaterialUntitled}</p>
                  <p className="mt-1 text-xs text-ink/50">{item.level}</p>
                </div>
                <button
                  onClick={() => removeItem(item._id)}
                  className="rounded-full border border-ink/20 px-3 py-1 text-xs"
                >
                  {t.common.delete}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
