"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/components/LocaleProvider";
import Loader from "@/components/ui/Loader";
import { Brain, Eye, Check, Lightning } from "@phosphor-icons/react/dist/ssr";

interface AIModel {
  id: string;
  name: string;
  provider: string;
  maxTokens: number;
  supportsVision: boolean;
  costPer1kTokens: number;
  defaultFor: string[];
  description: string;
}

interface ModelStats {
  count: number;
  totalTokens: number;
  totalCredits: number;
  modes: Record<string, number>;
  visionUsage: number;
}

interface AIModelsData {
  models: AIModel[];
  stats: Record<string, ModelStats>;
  config: {
    defaultModel: string;
    defaultVisionModel: string;
  };
  period: string;
}

export default function AdminAiModelsPanel() {
  const { t } = useLocale();
  const [data, setData] = useState<AIModelsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedDefault, setSelectedDefault] = useState("");
  const [selectedVision, setSelectedVision] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/ai-models");
      const json = await res.json();
      setData(json);
      setSelectedDefault(json.config?.defaultModel || "gpt-4.1-mini");
      setSelectedVision(json.config?.defaultVisionModel || "gpt-4o");
    } catch (err) {
      console.error("Failed to load AI models:", err);
    } finally {
      setLoading(false);
    }
  }

  async function saveConfig() {
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/ai-models", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          defaultModel: selectedDefault,
          defaultVisionModel: selectedVision
        })
      });

      const result = await res.json();

      if (res.ok) {
        setMessage({ type: "success", text: "Конфігурацію оновлено ✓" });
        await loadData();
      } else {
        setMessage({ type: "error", text: result.error || "Помилка" });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Помилка збереження" });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft">
        <Loader label="Завантаження..." />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft">
        <p className="text-sm text-ink/60">Немає даних</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft">
        <div className="flex items-center gap-3">
          <Brain size={28} weight="bold" className="text-violet" />
          <div>
            <h2 className="text-2xl font-semibold">AI Моделі</h2>
            <p className="mt-1 text-sm text-ink/60">
              Конфігурація та статистика використання AI моделей
            </p>
          </div>
        </div>
      </div>

      {/* Configuration */}
      <div className="rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft">
        <h3 className="mb-4 text-lg font-semibold">Налаштування моделей</h3>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Default Model */}
          <div>
            <label className="block text-sm font-semibold text-ink/70">
              Модель за замовчуванням
            </label>
            <select
              value={selectedDefault}
              onChange={(e) => setSelectedDefault(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-ink/20 bg-paper px-4 py-3 text-sm"
            >
              {data.models.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name} ({model.maxTokens} tokens)
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-ink/50">
              Використовується для текстових завдань
            </p>
          </div>

          {/* Vision Model */}
          <div>
            <label className="block text-sm font-semibold text-ink/70">
              Модель для Vision
            </label>
            <select
              value={selectedVision}
              onChange={(e) => setSelectedVision(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-ink/20 bg-paper px-4 py-3 text-sm"
            >
              {data.models
                .filter((m) => m.supportsVision)
                .map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name} ({model.maxTokens} tokens)
                  </option>
                ))}
            </select>
            <p className="mt-1 text-xs text-ink/50">
              Використовується для аналізу зображень
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={saveConfig}
            disabled={saving}
            className="flex items-center gap-2 rounded-full bg-ink px-6 py-2 text-sm font-semibold text-paper disabled:opacity-50"
          >
            <Check size={16} weight="bold" />
            {saving ? "Збереження..." : "Зберегти"}
          </button>

          {message && (
            <span
              className={`text-sm font-semibold ${
                message.type === "success" ? "text-moss" : "text-terracotta"
              }`}
            >
              {message.text}
            </span>
          )}
        </div>
      </div>

      {/* Models List */}
      <div className="rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft">
        <h3 className="mb-4 text-lg font-semibold">
          Доступні моделі
        </h3>

        <div className="space-y-3">
          {data.models.map((model) => {
            const stats = data.stats[model.id];
            const isDefaultText = model.id === data.config.defaultModel;
            const isDefaultVision = model.id === data.config.defaultVisionModel;

            return (
              <div
                key={model.id}
                className="rounded-2xl border border-ink/10 bg-paper p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">{model.name}</h4>
                      {model.supportsVision && (
                        <span className="rounded-full bg-violet/10 px-2 py-0.5 text-xs font-semibold text-violet">
                          <Eye size={12} weight="fill" className="inline mr-1" />
                          Vision
                        </span>
                      )}
                      {isDefaultText && (
                        <span className="rounded-full bg-moss/10 px-2 py-0.5 text-xs font-semibold text-moss">
                          Default
                        </span>
                      )}
                      {isDefaultVision && (
                        <span className="rounded-full bg-amber/10 px-2 py-0.5 text-xs font-semibold text-amber">
                          Vision Default
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-ink/60">{model.description}</p>
                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-ink/50">
                      <span>Max tokens: {model.maxTokens}</span>
                      <span>•</span>
                      <span>Provider: {model.provider}</span>
                      <span>•</span>
                      <span>Cost: ${model.costPer1kTokens}/1k tokens</span>
                    </div>
                  </div>

                  {stats && (
                    <div className="rounded-xl border border-ink/10 bg-paper/80 px-3 py-2">
                      <p className="text-xs uppercase tracking-wider text-ink/40">
                        {data.period}
                      </p>
                      <div className="mt-2 space-y-1 text-sm">
                        <div className="flex items-center gap-2">
                          <Lightning size={14} className="text-amber" />
                          <span className="font-semibold">{stats.count}</span>
                          <span className="text-xs text-ink/60">викликів</span>
                        </div>
                        <p className="text-xs text-ink/60">
                          {stats.totalTokens.toLocaleString()} tokens
                        </p>
                        <p className="text-xs text-ink/60">
                          {stats.totalCredits} credits
                        </p>
                        {stats.visionUsage > 0 && (
                          <p className="text-xs text-violet">
                            <Eye size={12} className="inline mr-1" />
                            {stats.visionUsage} vision
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {stats && Object.keys(stats.modes).length > 0 && (
                  <div className="mt-3 border-t border-ink/10 pt-3">
                    <p className="mb-2 text-xs uppercase tracking-wider text-ink/40">
                      Використання по modes
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(stats.modes)
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 5)
                        .map(([mode, count]) => (
                          <span
                            key={mode}
                            className="rounded-full bg-ink/5 px-2 py-1 text-xs"
                          >
                            {mode}: {count}
                          </span>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
