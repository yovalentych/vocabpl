"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Check } from "@phosphor-icons/react";

export default function NewClassPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [locale, setLocale] = useState<'uk' | 'pl'>('uk');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const t = {
    title: "Створити новий клас",
    className: "Назва класу",
    classNamePlaceholder: "напр. Польська А1 - Група 1",
    description: "Опис (опціонально)",
    descriptionPlaceholder: "Короткий опис класу для студентів",
    settings: "Налаштування",
    publicClass: "Публічний клас",
    publicClassDesc: "Студенти зможуть приєднатися за кодом запрошення",
    classLocale: "Основна мова",
    ukrainian: "Українська",
    polish: "Польська",
    cancel: "Скасувати",
    create: "Створити клас",
    creating: "Створення..."
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Введіть назву класу");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          settings: {
            isPublic,
            locale
          }
        })
      });

      const data = await res.json();

      if (res.ok) {
        window.location.href = `/classes/${data.classId}`;
      } else {
        setError(data.error || "Помилка створення класу");
      }
    } catch (err) {
      setError("Помилка з'єднання з сервером");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-5 sm:px-6 py-10">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/classes"
          className="inline-flex items-center gap-2 text-sm text-ink/60 hover:text-ink transition-colors mb-4"
        >
          <ArrowLeft size={16} />
          Назад до класів
        </Link>
        <h1 className="text-3xl font-bold text-ink">{t.title}</h1>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="rounded-2xl border border-terracotta/30 bg-terracotta/10 p-4 text-sm text-terracotta">
            {error}
          </div>
        )}

        {/* Class Name */}
        <div>
          <label className="block text-sm font-semibold text-ink mb-2">
            {t.className} <span className="text-terracotta">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t.classNamePlaceholder}
            maxLength={100}
            className="w-full rounded-2xl border border-ink/20 bg-paper px-4 py-3 text-ink placeholder:text-ink/40 focus:border-moss/50 focus:outline-none focus:ring-2 focus:ring-moss/20"
          />
          <div className="mt-1 text-xs text-ink/50 text-right">
            {name.length}/100
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-semibold text-ink mb-2">
            {t.description}
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t.descriptionPlaceholder}
            rows={3}
            maxLength={500}
            className="w-full rounded-2xl border border-ink/20 bg-paper px-4 py-3 text-ink placeholder:text-ink/40 focus:border-moss/50 focus:outline-none focus:ring-2 focus:ring-moss/20 resize-none"
          />
        </div>

        {/* Settings */}
        <div className="rounded-2xl border border-ink/10 bg-paper/60 p-6">
          <h3 className="text-sm font-bold text-ink mb-4">{t.settings}</h3>

          {/* Public Class */}
          <label className="flex items-start gap-3 p-4 rounded-xl border border-ink/10 bg-paper cursor-pointer hover:border-moss/30 transition-colors mb-4">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="mt-0.5 rounded border-ink/30"
            />
            <div className="flex-1">
              <div className="font-semibold text-ink text-sm">{t.publicClass}</div>
              <div className="text-xs text-ink/60 mt-1">{t.publicClassDesc}</div>
            </div>
          </label>

          {/* Locale */}
          <div>
            <label className="block text-sm font-semibold text-ink mb-2">
              {t.classLocale}
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setLocale('uk')}
                className={`relative rounded-xl border p-3 text-sm font-semibold transition-all ${
                  locale === 'uk'
                    ? 'border-moss bg-moss/10 text-moss'
                    : 'border-ink/20 bg-paper text-ink/70 hover:border-moss/30'
                }`}
              >
                {locale === 'uk' && (
                  <Check size={16} weight="bold" className="absolute top-2 right-2" />
                )}
                🇺🇦 {t.ukrainian}
              </button>
              <button
                type="button"
                onClick={() => setLocale('pl')}
                className={`relative rounded-xl border p-3 text-sm font-semibold transition-all ${
                  locale === 'pl'
                    ? 'border-moss bg-moss/10 text-moss'
                    : 'border-ink/20 bg-paper text-ink/70 hover:border-moss/30'
                }`}
              >
                {locale === 'pl' && (
                  <Check size={16} weight="bold" className="absolute top-2 right-2" />
                )}
                🇵🇱 {t.polish}
              </button>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Link
            href="/classes"
            className="flex-1 rounded-full border border-ink/20 bg-paper px-6 py-3 text-center text-sm font-semibold text-ink hover:bg-ink/5 transition-colors"
          >
            {t.cancel}
          </Link>
          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="flex-1 rounded-full border border-moss/30 bg-moss px-6 py-3 text-sm font-semibold text-white hover:bg-moss/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? t.creating : t.create}
          </button>
        </div>
      </form>
    </div>
  );
}
