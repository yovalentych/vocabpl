"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Check } from "@phosphor-icons/react";

export default function JoinClassPage() {
  const router = useRouter();
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const t = {
    title: "Приєднатися до класу",
    subtitle: "Введіть код запрошення від вашого викладача",
    inviteCode: "Код запрошення",
    inviteCodePlaceholder: "ABC-123",
    inviteCodeHelp: "Формат: XXX-123 (3 літери та 3 цифри)",
    cancel: "Скасувати",
    join: "Приєднатися",
    joining: "Приєднання...",
    successMessage: "Успішно приєдналися до класу!"
  };

  function formatInviteCode(value: string): string {
    // Видаляємо все крім літер і цифр
    let clean = value.toUpperCase().replace(/[^A-Z0-9]/g, '');

    // Обмежуємо довжину
    if (clean.length > 6) {
      clean = clean.slice(0, 6);
    }

    // Додаємо дефіс після 3 символів
    if (clean.length > 3) {
      clean = clean.slice(0, 3) + '-' + clean.slice(3);
    }

    return clean;
  }

  function handleCodeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const formatted = formatInviteCode(e.target.value);
    setInviteCode(formatted);
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (inviteCode.length !== 7) {
      setError("Введіть повний код (формат: XXX-123)");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/classes/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteCode })
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(`${t.successMessage} "${data.className}"`);
        setTimeout(() => {
          window.location.href = `/classes/${data.classId}`;
        }, 1500);
      } else {
        if (data.error === "Class not found or invite code is invalid") {
          setError("Клас не знайдено. Перевірте правильність коду.");
        } else if (data.error === "You are already in this class") {
          setError("Ви вже є учасником цього класу");
        } else {
          setError(data.error || "Помилка приєднання до класу");
        }
      }
    } catch (err) {
      setError("Помилка з'єднання з сервером");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-lg px-5 sm:px-6 py-10">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/classes"
          className="inline-flex items-center gap-2 text-sm text-ink/60 hover:text-ink transition-colors mb-4"
        >
          <ArrowLeft size={16} />
          Назад до класів
        </Link>
        <h1 className="text-3xl font-bold text-ink mb-2">{t.title}</h1>
        <p className="text-ink/60">{t.subtitle}</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="rounded-2xl border border-terracotta/30 bg-terracotta/10 p-4 text-sm text-terracotta">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-2xl border border-moss/30 bg-moss/10 p-4 text-sm text-moss flex items-center gap-2">
            <Check size={18} weight="bold" />
            {success}
          </div>
        )}

        {/* Invite Code */}
        <div>
          <label className="block text-sm font-semibold text-ink mb-2">
            {t.inviteCode}
          </label>
          <input
            type="text"
            value={inviteCode}
            onChange={handleCodeChange}
            placeholder={t.inviteCodePlaceholder}
            className="w-full rounded-2xl border border-ink/20 bg-paper px-4 py-3 text-center text-2xl font-mono font-bold tracking-widest text-ink placeholder:text-ink/40 placeholder:font-normal placeholder:text-base focus:border-moss/50 focus:outline-none focus:ring-2 focus:ring-moss/20"
            autoComplete="off"
            autoFocus
          />
          <div className="mt-2 text-xs text-ink/50 text-center">
            {t.inviteCodeHelp}
          </div>
        </div>

        {/* Example */}
        <div className="rounded-2xl border border-moss/20 bg-moss/5 p-4">
          <div className="text-xs font-semibold text-moss/70 mb-2">💡 Підказка</div>
          <div className="text-sm text-ink/70">
            Код запрошення складається з 3 великих літер, дефіса та 3 цифр.
            Наприклад: <span className="font-mono font-bold text-moss">ABC-123</span>
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
            disabled={loading || inviteCode.length !== 7}
            className="flex-1 rounded-full border border-moss/30 bg-moss px-6 py-3 text-sm font-semibold text-white hover:bg-moss/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? t.joining : t.join}
          </button>
        </div>
      </form>
    </div>
  );
}
