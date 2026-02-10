"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { Tag, Plus, CheckCircle, Clock } from "@phosphor-icons/react/dist/ssr";

type PromoRow = {
  code: string;
  durationDays: number | null;
  createdAt: string;
  createdBy: string;
  redeemedBy: string | null;
  redeemedAt: string | null;
  expiresAt: string | null;
};

export default function PromoCodesPanel() {
  const { t } = useLocale();
  const [items, setItems] = useState<PromoRow[]>([]);
  const [duration, setDuration] = useState<string>("30");
  const [customCode, setCustomCode] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "done">("idle");

  async function load() {
    const res = await fetch("/api/admin/promo");
    if (!res.ok) return;
    const data = await res.json();
    setItems(data.items || []);
  }

  useEffect(() => {
    load();
  }, []);

  async function createCode() {
    setStatus("loading");
    const durationDays = duration === "unlimited" ? null : Number(duration);
    const res = await fetch("/api/admin/promo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ durationDays, customCode: customCode.trim() || null })
    });
    if (!res.ok) {
      setStatus("error");
      return;
    }
    setCustomCode("");
    setStatus("done");
    await load();
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft">
        <div className="flex items-center gap-2">
          <Tag size={24} weight="bold" className="text-gold" />
          <div>
            <h2 className="text-2xl font-semibold">{t.admin.promoTitle}</h2>
            <p className="mt-1 text-sm text-ink/60">{t.admin.promoSubtitle}</p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-2 text-xs uppercase tracking-[0.2em] text-ink/40">
            {t.admin.promoDuration}
            <select
              value={duration}
              onChange={(event) => setDuration(event.target.value)}
              className="rounded-2xl border border-ink/20 bg-paper px-3 py-2 text-sm text-ink"
            >
              <option value="7">{t.admin.promoDurations.week}</option>
              <option value="30">{t.admin.promoDurations.month}</option>
              <option value="182">{t.admin.promoDurations.halfYear}</option>
              <option value="365">{t.admin.promoDurations.year}</option>
              <option value="unlimited">{t.admin.promoDurations.unlimited}</option>
            </select>
          </label>
          <label className="flex flex-col gap-2 text-xs uppercase tracking-[0.2em] text-ink/40">
            {t.admin.promoCustom}
            <input
              value={customCode}
              onChange={(event) => setCustomCode(event.target.value.toUpperCase())}
              className="rounded-2xl border border-ink/20 bg-paper px-3 py-2 text-sm"
              placeholder="OPTIONAL"
            />
          </label>
          <button
            onClick={createCode}
            className="flex items-center gap-2 rounded-full bg-ink px-5 py-2 text-xs font-semibold text-paper transition hover:bg-ink/90 disabled:opacity-50"
            disabled={status === "loading"}
          >
            <Plus size={14} weight="bold" />
            {status === "loading" ? t.common.loading : t.admin.promoCreate}
          </button>
          {status === "error" && <span className="flex items-center gap-1 text-xs font-semibold text-terracotta">✗ {t.admin.promoError}</span>}
        </div>
      </div>

      <div className="rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft">
        <div className="flex items-center gap-2">
          <Tag size={20} weight="bold" className="text-ink" />
          <h3 className="text-xl font-semibold">{t.admin.promoList}</h3>
        </div>
        <div className="mt-4 space-y-3">
          {items.map((item) => {
            const statusLabel = item.redeemedBy ? t.admin.promoStatus.used : t.admin.promoStatus.active;
            const statusIcon = item.redeemedBy ? CheckCircle : Clock;
            const statusTone = item.redeemedBy ? "bg-ink/5 text-ink/60" : "bg-moss/20 text-moss";
            const StatusIcon = statusIcon;
            return (
              <div key={item.code} className="rounded-2xl border border-ink/10 bg-paper/70 px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">{item.code}</p>
                    <p className="text-xs text-ink/50">
                      {t.admin.promoColumns.duration}:{" "}
                      {item.durationDays === null ? t.admin.promoDurations.unlimited : item.durationDays}
                    </p>
                  </div>
                  <span className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${statusTone}`}>
                    <StatusIcon size={14} weight="fill" />
                    {statusLabel}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-ink/60">
                  <span className="rounded-full border border-ink/10 bg-paper px-3 py-1">
                    {t.admin.promoColumns.created}:{" "}
                    {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "-"}
                  </span>
                  {item.redeemedBy && (
                    <span className="rounded-full border border-ink/10 bg-paper px-3 py-1">
                      {t.admin.promoColumns.status}: {item.redeemedBy}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
          {!items.length && <p className="text-xs text-ink/50">{t.admin.noData}</p>}
        </div>
      </div>
    </div>
  );
}
