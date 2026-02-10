"use client";

import { useEffect, useState } from "react";
import {
  Ticket,
  Plus,
  CheckCircle,
  Clock,
  XCircle,
  Trash,
  Sparkle,
  Lightning,
  Copy,
  MagnifyingGlass,
  FunnelSimple
} from "@phosphor-icons/react";

type PromoBenefit =
  | "premium_access"
  | "ai_unlimited"
  | "video_access"
  | "workbook_access"
  | "priority_support"
  | "custom_words";

interface PromoCode {
  _id: string;
  code: string;
  durationDays: number | null;
  maxUses: number | null;
  usedCount: number;
  benefits: PromoBenefit[];
  planId: string | null;
  expiresAt: string | null;
  active: boolean;
  description: string;
  createdAt: string;
  createdBy: string;
  users: string[];
}

const BENEFIT_LABELS: Record<PromoBenefit, { label: string; icon: string; color: string }> = {
  premium_access: { label: "Premium доступ", icon: "⭐", color: "gold" },
  ai_unlimited: { label: "Безлімітні AI", icon: "🤖", color: "moss" },
  video_access: { label: "Відео", icon: "🎬", color: "terracotta" },
  workbook_access: { label: "Workbook", icon: "📚", color: "ink" },
  priority_support: { label: "Підтримка", icon: "💬", color: "moss" },
  custom_words: { label: "Власні слова", icon: "✍️", color: "gold" }
};

export default function PromoCodesAdvancedPanel() {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "used" | "expired">("all");

  // Form state
  const [formData, setFormData] = useState({
    type: "random" as "random" | "readable" | "memorable" | "custom",
    customCode: "",
    prefix: "",
    suffix: "",
    durationDays: 30,
    unlimited: false,
    maxUses: null as number | null,
    usesUnlimited: true,
    benefits: [] as PromoBenefit[],
    planId: "",
    expiresAt: "",
    description: ""
  });

  useEffect(() => {
    loadPromoCodes();
  }, []);

  const loadPromoCodes = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/promo/advanced");
      if (res.ok) {
        const data = await res.json();
        setPromoCodes(data.promoCodes || []);
      }
    } catch (error) {
      console.error("Failed to load promo codes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    const payload = {
      type: formData.type,
      customCode: formData.type === "custom" ? formData.customCode : undefined,
      prefix: formData.prefix,
      suffix: formData.suffix,
      durationDays: formData.unlimited ? null : formData.durationDays,
      maxUses: formData.usesUnlimited ? null : formData.maxUses,
      benefits: formData.benefits,
      planId: formData.planId || null,
      expiresAt: formData.expiresAt || null,
      description: formData.description
    };

    const res = await fetch("/api/admin/promo/advanced", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      setShowForm(false);
      resetForm();
      loadPromoCodes();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Видалити промокод?")) return;

    await fetch("/api/admin/promo/advanced", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id })
    });

    loadPromoCodes();
  };

  const handleToggleActive = async (id: string, active: boolean) => {
    await fetch("/api/admin/promo/advanced", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, active: !active })
    });

    loadPromoCodes();
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
  };

  const resetForm = () => {
    setFormData({
      type: "random",
      customCode: "",
      prefix: "",
      suffix: "",
      durationDays: 30,
      unlimited: false,
      maxUses: null,
      usesUnlimited: true,
      benefits: [],
      planId: "",
      expiresAt: "",
      description: ""
    });
    setEditingId(null);
  };

  const filteredCodes = promoCodes.filter((code) => {
    // Search filter
    if (searchQuery && !code.code.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    // Status filter
    if (filterStatus === "active" && (!code.active || code.usedCount >= (code.maxUses || Infinity))) {
      return false;
    }
    if (filterStatus === "used" && code.usedCount < (code.maxUses || Infinity)) {
      return false;
    }
    if (filterStatus === "expired" && code.active) {
      return false;
    }

    return true;
  });

  const stats = {
    total: promoCodes.length,
    active: promoCodes.filter((c) => c.active).length,
    used: promoCodes.filter((c) => c.usedCount > 0).length,
    totalUses: promoCodes.reduce((sum, c) => sum + c.usedCount, 0)
  };

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="rounded-3xl border border-gold/30 bg-gradient-to-br from-gold/5 to-terracotta/5 p-6 shadow-soft">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Ticket size={24} weight="fill" className="text-gold" />
              <h2 className="text-2xl font-semibold">Система промокодів</h2>
            </div>
            <p className="mt-1 text-sm text-ink/60">Управління промокодами з розширеними можливостями</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 rounded-full bg-gold px-5 py-2.5 text-sm font-semibold text-paper transition hover:bg-gold/90"
          >
            <Plus size={16} weight="bold" />
            Створити промокод
          </button>
        </div>

        {/* Stats */}
        <div className="mt-6 grid gap-4 sm:grid-cols-4">
          <div className="rounded-2xl border border-ink/10 bg-paper/60 p-4">
            <p className="text-xs uppercase tracking-wider text-ink/50">Всього</p>
            <p className="mt-1 text-2xl font-semibold text-ink">{stats.total}</p>
          </div>
          <div className="rounded-2xl border border-moss/20 bg-moss/5 p-4">
            <p className="text-xs uppercase tracking-wider text-ink/50">Активні</p>
            <p className="mt-1 text-2xl font-semibold text-moss">{stats.active}</p>
          </div>
          <div className="rounded-2xl border border-terracotta/20 bg-terracotta/5 p-4">
            <p className="text-xs uppercase tracking-wider text-ink/50">Використані</p>
            <p className="mt-1 text-2xl font-semibold text-terracotta">{stats.used}</p>
          </div>
          <div className="rounded-2xl border border-gold/20 bg-gold/5 p-4">
            <p className="text-xs uppercase tracking-wider text-ink/50">Застосувань</p>
            <p className="mt-1 text-2xl font-semibold text-gold">{stats.totalUses}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-3xl border border-ink/10 bg-paper/80 p-4 shadow-soft">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <MagnifyingGlass
              size={18}
              weight="bold"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40"
            />
            <input
              type="text"
              placeholder="Пошук промокодів..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-2xl border border-ink/20 bg-paper py-2 pl-10 pr-4 text-sm transition focus:border-ink/40 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <FunnelSimple size={18} weight="bold" className="text-ink/40" />
            {(["all", "active", "used", "expired"] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                  filterStatus === status
                    ? "bg-ink text-paper"
                    : "border border-ink/20 text-ink/70 hover:bg-ink/5"
                }`}
              >
                {status === "all" && "Всі"}
                {status === "active" && "Активні"}
                {status === "used" && "Використані"}
                {status === "expired" && "Неактивні"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Promo Codes List */}
      <div className="rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft">
        {loading ? (
          <div className="py-12 text-center">
            <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-gold border-t-transparent" />
            <p className="text-sm text-ink/60">Завантаження...</p>
          </div>
        ) : filteredCodes.length === 0 ? (
          <div className="py-12 text-center">
            <Ticket size={48} weight="fill" className="mx-auto text-ink/20" />
            <p className="mt-4 text-sm text-ink/60">Промокоди не знайдені</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredCodes.map((promo) => {
              const isExpired = promo.expiresAt && new Date(promo.expiresAt) < new Date();
              const isFullyUsed = promo.maxUses !== null && promo.usedCount >= promo.maxUses;
              const isActive = promo.active && !isExpired && !isFullyUsed;

              return (
                <div
                  key={promo._id}
                  className={`rounded-2xl border p-4 transition ${
                    isActive
                      ? "border-moss/20 bg-moss/5"
                      : "border-ink/10 bg-paper/60 opacity-75"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <code className="rounded-lg bg-ink/5 px-3 py-1 text-lg font-bold tracking-wider text-ink">
                          {promo.code}
                        </code>
                        <button
                          onClick={() => copyToClipboard(promo.code)}
                          className="rounded-full border border-ink/20 p-1.5 text-ink/60 transition hover:bg-ink/5"
                          title="Копіювати"
                        >
                          <Copy size={14} weight="bold" />
                        </button>
                        {isActive ? (
                          <span className="flex items-center gap-1 rounded-full bg-moss/20 px-2 py-0.5 text-xs font-semibold text-moss">
                            <CheckCircle size={12} weight="fill" />
                            Активний
                          </span>
                        ) : isFullyUsed ? (
                          <span className="flex items-center gap-1 rounded-full bg-terracotta/20 px-2 py-0.5 text-xs font-semibold text-terracotta">
                            <XCircle size={12} weight="fill" />
                            Вичерпано
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 rounded-full bg-ink/10 px-2 py-0.5 text-xs font-semibold text-ink/60">
                            <Clock size={12} weight="fill" />
                            Неактивний
                          </span>
                        )}
                      </div>

                      {promo.description && (
                        <p className="mt-2 text-sm text-ink/60">{promo.description}</p>
                      )}

                      {/* Benefits */}
                      {promo.benefits && promo.benefits.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {promo.benefits.map((benefit) => {
                            const info = BENEFIT_LABELS[benefit];
                            return (
                              <span
                                key={benefit}
                                className="inline-flex items-center gap-1 rounded-full border border-ink/10 bg-paper px-2 py-0.5 text-xs font-medium text-ink/70"
                              >
                                <span>{info.icon}</span>
                                {info.label}
                              </span>
                            );
                          })}
                        </div>
                      )}

                      {/* Stats */}
                      <div className="mt-3 flex flex-wrap gap-3 text-xs text-ink/60">
                        <span className="flex items-center gap-1">
                          <Clock size={14} />
                          {promo.durationDays
                            ? `${promo.durationDays} днів`
                            : "Необмежено"}
                        </span>
                        <span className="flex items-center gap-1">
                          <Lightning size={14} />
                          {promo.usedCount}
                          {promo.maxUses ? ` / ${promo.maxUses}` : " використань"}
                        </span>
                        <span>
                          Створено: {new Date(promo.createdAt).toLocaleDateString()}
                        </span>
                        {promo.expiresAt && (
                          <span>
                            Діє до: {new Date(promo.expiresAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleToggleActive(promo._id, promo.active)}
                        className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                          promo.active
                            ? "border-terracotta/30 text-terracotta hover:bg-terracotta/10"
                            : "border-moss/30 text-moss hover:bg-moss/10"
                        }`}
                      >
                        {promo.active ? "Деактивувати" : "Активувати"}
                      </button>
                      <button
                        onClick={() => handleDelete(promo._id)}
                        className="rounded-full border border-ink/20 p-1.5 text-terracotta transition hover:bg-terracotta/10"
                        title="Видалити"
                      >
                        <Trash size={14} weight="bold" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-ink/10 bg-paper p-6 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-2xl font-semibold">Створити промокод</h3>
              <button
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="rounded-full border border-ink/20 p-2 text-ink/60 transition hover:bg-ink/5"
              >
                <XCircle size={20} weight="bold" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Code Type */}
              <div>
                <label className="block text-sm font-medium text-ink/70">Тип генерації</label>
                <div className="mt-2 grid grid-cols-4 gap-2">
                  {(["random", "readable", "memorable", "custom"] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setFormData({ ...formData, type })}
                      className={`rounded-2xl border px-3 py-2 text-xs font-semibold transition ${
                        formData.type === type
                          ? "border-gold bg-gold/10 text-gold"
                          : "border-ink/20 text-ink/70 hover:bg-ink/5"
                      }`}
                    >
                      {type === "random" && "Випадковий"}
                      {type === "readable" && "Читабельний"}
                      {type === "memorable" && "Запам'ятний"}
                      {type === "custom" && "Власний"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Code */}
              {formData.type === "custom" && (
                <div>
                  <label className="block text-sm font-medium text-ink/70">Власний код</label>
                  <input
                    type="text"
                    value={formData.customCode}
                    onChange={(e) =>
                      setFormData({ ...formData, customCode: e.target.value.toUpperCase() })
                    }
                    className="mt-2 w-full rounded-2xl border border-ink/20 bg-paper px-4 py-2 text-sm uppercase"
                    placeholder="MYCODE2024"
                  />
                </div>
              )}

              {/* Prefix & Suffix */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-ink/70">Префікс (опційно)</label>
                  <input
                    type="text"
                    value={formData.prefix}
                    onChange={(e) =>
                      setFormData({ ...formData, prefix: e.target.value.toUpperCase() })
                    }
                    className="mt-2 w-full rounded-2xl border border-ink/20 bg-paper px-4 py-2 text-sm uppercase"
                    placeholder="VIP"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink/70">Суфікс (опційно)</label>
                  <input
                    type="text"
                    value={formData.suffix}
                    onChange={(e) =>
                      setFormData({ ...formData, suffix: e.target.value.toUpperCase() })
                    }
                    className="mt-2 w-full rounded-2xl border border-ink/20 bg-paper px-4 py-2 text-sm uppercase"
                    placeholder="2024"
                  />
                </div>
              </div>

              {/* Duration */}
              <div>
                <label className="block text-sm font-medium text-ink/70">Тривалість доступу</label>
                <div className="mt-2 flex items-center gap-3">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.unlimited}
                      onChange={(e) =>
                        setFormData({ ...formData, unlimited: e.target.checked })
                      }
                      className="rounded accent-moss"
                    />
                    <span className="text-sm">Необмежено</span>
                  </label>
                  {!formData.unlimited && (
                    <select
                      value={formData.durationDays}
                      onChange={(e) =>
                        setFormData({ ...formData, durationDays: Number(e.target.value) })
                      }
                      className="rounded-2xl border border-ink/20 bg-paper px-4 py-2 text-sm"
                    >
                      <option value={7}>7 днів</option>
                      <option value={30}>30 днів</option>
                      <option value={90}>90 днів</option>
                      <option value={182}>6 місяців</option>
                      <option value={365}>1 рік</option>
                    </select>
                  )}
                </div>
              </div>

              {/* Max Uses */}
              <div>
                <label className="block text-sm font-medium text-ink/70">
                  Кількість використань
                </label>
                <div className="mt-2 flex items-center gap-3">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.usesUnlimited}
                      onChange={(e) =>
                        setFormData({ ...formData, usesUnlimited: e.target.checked })
                      }
                      className="rounded accent-moss"
                    />
                    <span className="text-sm">Необмежено</span>
                  </label>
                  {!formData.usesUnlimited && (
                    <input
                      type="number"
                      min="1"
                      value={formData.maxUses || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, maxUses: Number(e.target.value) || null })
                      }
                      className="w-32 rounded-2xl border border-ink/20 bg-paper px-4 py-2 text-sm"
                      placeholder="100"
                    />
                  )}
                </div>
              </div>

              {/* Benefits */}
              <div>
                <label className="block text-sm font-medium text-ink/70">Привілеї</label>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {(Object.keys(BENEFIT_LABELS) as PromoBenefit[]).map((benefit) => {
                    const info = BENEFIT_LABELS[benefit];
                    const isSelected = formData.benefits.includes(benefit);
                    return (
                      <button
                        key={benefit}
                        onClick={() => {
                          setFormData({
                            ...formData,
                            benefits: isSelected
                              ? formData.benefits.filter((b) => b !== benefit)
                              : [...formData.benefits, benefit]
                          });
                        }}
                        className={`flex items-center gap-2 rounded-2xl border px-3 py-2 text-xs font-medium transition ${
                          isSelected
                            ? "border-moss bg-moss/10 text-moss"
                            : "border-ink/20 text-ink/70 hover:bg-ink/5"
                        }`}
                      >
                        <span>{info.icon}</span>
                        {info.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Expires At */}
              <div>
                <label className="block text-sm font-medium text-ink/70">
                  Термін придатності промокоду (опційно)
                </label>
                <input
                  type="date"
                  value={formData.expiresAt}
                  onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                  className="mt-2 w-full rounded-2xl border border-ink/20 bg-paper px-4 py-2 text-sm"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-ink/70">Опис (опційно)</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="mt-2 w-full rounded-2xl border border-ink/20 bg-paper px-4 py-2 text-sm"
                  rows={3}
                  placeholder="Промокод для бета-тестерів..."
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleCreate}
                  className="flex-1 rounded-full bg-gold px-6 py-3 font-semibold text-paper transition hover:bg-gold/90"
                >
                  Створити промокод
                </button>
                <button
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                  className="rounded-full border border-ink/20 px-6 py-3 font-semibold text-ink transition hover:bg-ink/5"
                >
                  Скасувати
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
