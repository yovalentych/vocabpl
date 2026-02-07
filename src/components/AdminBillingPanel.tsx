"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { plans as defaultPlans, Plan } from "@/lib/plans";

type BillingSettings = {
  blurPlans: boolean;
  plans: Plan[];
};

export default function AdminBillingPanel() {
  const { t } = useLocale();
  const [settings, setSettings] = useState<BillingSettings>({ blurPlans: false, plans: defaultPlans });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<"idle" | "done" | "error">("idle");

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/admin/billing");
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data?.plans)) {
        setSettings({ blurPlans: Boolean(data?.blurPlans), plans: data.plans });
      }
    }
    load();
  }, []);

  function updatePrice(id: Plan["id"], priceUah: number) {
    setSettings((prev) => ({
      ...prev,
      plans: prev.plans.map((plan) => (plan.id === id ? { ...plan, priceUah } : plan))
    }));
  }

  async function save() {
    setSaving(true);
    setSaved("idle");
    const prices = settings.plans.reduce<Record<string, number>>((acc, plan) => {
      acc[plan.id] = plan.priceUah;
      return acc;
    }, {});
    const res = await fetch("/api/admin/billing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ blurPlans: settings.blurPlans, prices })
    });
    setSaving(false);
    setSaved(res.ok ? "done" : "error");
  }

  return (
    <div className="rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold">{t.admin.billingTitle}</h2>
          <p className="mt-2 text-sm text-ink/60">{t.admin.billingSubtitle}</p>
        </div>
        <label className="flex items-center gap-2 rounded-full border border-ink/10 bg-paper/70 px-4 py-2 text-xs font-semibold text-ink/70">
          <input
            type="checkbox"
            checked={settings.blurPlans}
            onChange={(event) => setSettings((prev) => ({ ...prev, blurPlans: event.target.checked }))}
          />
          {t.admin.billingBlur}
        </label>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {settings.plans.map((plan) => (
          <div key={plan.id} className="rounded-2xl border border-ink/10 bg-paper/80 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-ink/50">{t.cabinet.planLabels[plan.id]}</p>
            <label className="mt-3 flex items-center gap-2 text-sm text-ink/70">
              <input
                type="number"
                min={0}
                value={plan.priceUah}
                onChange={(event) => updatePrice(plan.id, Number(event.target.value))}
                className="w-full rounded-2xl border border-ink/20 bg-paper px-3 py-2 text-sm"
              />
              <span className="text-sm font-semibold">₴</span>
            </label>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          onClick={save}
          className="rounded-full bg-ink px-5 py-2 text-xs font-semibold text-paper"
          disabled={saving}
        >
          {saving ? t.common.loading : t.common.save}
        </button>
        {saved === "done" && <span className="text-xs text-moss">{t.admin.billingSaved}</span>}
        {saved === "error" && <span className="text-xs text-terracotta">{t.admin.billingError}</span>}
      </div>
    </div>
  );
}
