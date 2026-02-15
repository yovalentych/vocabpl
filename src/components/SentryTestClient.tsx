"use client";

import { useState } from "react";

export default function SentryTestClient() {
  const [serverResult, setServerResult] = useState<string | null>(null);

  async function triggerServerError() {
    setServerResult(null);
    try {
      const res = await fetch("/api/admin/sentry-test", { method: "POST" });
      const data = await res.json().catch(() => null);
      setServerResult(data?.error || "Server responded");
    } catch (error) {
      setServerResult("Server error triggered");
    }
  }

  function triggerClientError() {
    throw new Error("Sentry test: client error");
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4 rounded-3xl border border-ink/10 bg-paper/90 p-6 shadow-soft">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold text-ink">Sentry Test</h1>
        <span className="rounded-full border border-terracotta/40 bg-terracotta/10 px-3 py-1 text-[11px] font-semibold text-terracotta">
          Admin only
        </span>
      </div>
      <p className="text-sm text-ink/60">
        Використай кнопки нижче, щоб перевірити, чи Sentry ловить помилки з клієнта та сервера.
      </p>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={triggerClientError}
          className="rounded-full border border-terracotta/30 bg-terracotta/10 px-4 py-2 text-sm font-semibold text-terracotta hover:bg-terracotta/20"
        >
          Trigger client error
        </button>
        <button
          type="button"
          onClick={triggerServerError}
          className="rounded-full border border-ink/20 bg-paper px-4 py-2 text-sm font-semibold text-ink/70 hover:bg-ink/5"
        >
          Trigger server error
        </button>
      </div>
      {serverResult && (
        <p className="text-xs text-ink/50">{serverResult}</p>
      )}
    </div>
  );
}
