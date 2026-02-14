"use client";

import { useState, useMemo } from "react";
import AdminUsersPanel from "@/components/AdminUsersPanel";
import AdminImportPanel from "@/components/AdminImportPanel";
import PromoCodesAdvancedPanel from "@/components/PromoCodesAdvancedPanel";
import AdminBillingPanel from "@/components/AdminBillingPanel";
import AdminWorkbookContentPanel from "@/components/AdminWorkbookContentPanel";
import AdminExerciseMaterialsPanel from "@/components/AdminExerciseMaterialsPanel";
import AdminAiUsagePanel from "@/components/AdminAiUsagePanel";
import AdminDiagnosticsPanel from "@/components/AdminDiagnosticsPanel";
import AdminAiModelsPanel from "@/components/AdminAiModelsPanel";
import AdminVideoPanel from "@/components/AdminVideoPanel";
import AdminAboutPanel from "@/components/AdminAboutPanel";
import { useLocale } from "@/components/LocaleProvider";
import {
  ChartBar,
  Users,
  BookBookmark,
  CurrencyDollar,
  Sparkle,
  ShieldCheck,
  Brain,
  Lightning,
  Article,
  ChartPie,
  ListChecks
} from "@phosphor-icons/react/dist/ssr";

const WORD_TYPE_LABELS: Record<string, string> = {
  verb: "Дієслова",
  adverb: "Прислівники",
  adjective: "Прикметники",
  noun: "Іменники",
  pronoun: "Займенники",
  conjunction: "Сполучники",
  preposition: "Прийменники",
  particle: "Частки",
  interjection: "Вигуки",
  numeral: "Числівники",
  phrase: "Фрази",
  slang: "Сленг",
  abbreviations: "Абревіатури",
  others: "Інше",
  clean_emotions: "Емоції (чисті)",
  soft_swears: "М'які лайки",
  unknown: "Невідомо"
};

const CHART_COLORS = [
  "#3f5c4f", // moss
  "#d46a4c", // terracotta
  "#e7b26f", // gold
  "#2b2118", // ink
  "#8b9f91", // moss light
  "#e89b7e", // terracotta light
  "#f0d0a0", // gold light
  "#6b5c4f", // ink light
  "#4a6b5a", // moss dark
  "#b85a3c"  // terracotta dark
];

type Summary = {
  totalWords: number;
  wordTypeStats: { type: string; count: number }[];
  tests: { id: string; title: string }[];
  materials: number;
  users: number;
  workbookContent: number;
};

export default function AdminDashboard({ summary }: { summary: Summary }) {
  const { t } = useLocale();
  const [tab, setTab] = useState<"overview" | "users" | "content" | "monetization">("overview");
  const [chartType, setChartType] = useState<"bar" | "pie">("pie");

  const wordTypeLabels = WORD_TYPE_LABELS;
  const chartColors = CHART_COLORS;

  // Обчислення для графіків
  const chartData = useMemo(() => {
    const total = summary.wordTypeStats.reduce((sum, stat) => sum + stat.count, 0);
    return summary.wordTypeStats.map((stat, idx) => {
      const normalizedType = stat.type.toLowerCase();
      return {
        type: normalizedType,
        label: wordTypeLabels[normalizedType] || stat.type,
        count: stat.count,
        percentage: ((stat.count / total) * 100).toFixed(1),
        color: chartColors[idx % chartColors.length]
      };
    });
  }, [summary.wordTypeStats, chartColors, wordTypeLabels]);


  const tabItems = [
    { id: "overview", label: t.admin.tabs.overview, icon: ChartBar },
    { id: "users", label: t.admin.tabs.users, icon: Users },
    { id: "content", label: t.admin.tabs.content, icon: BookBookmark },
    { id: "monetization", label: t.admin.tabs.monetization, icon: CurrencyDollar }
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Admin Header with Gradient */}
      <section className="relative overflow-hidden rounded-3xl sm:rounded-[32px] border border-ink/10 bg-gradient-to-br from-moss/10 via-paper/80 to-terracotta/10 p-6 sm:p-8 shadow-soft">
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gold/20 blur-3xl" />
        <div className="absolute -left-8 bottom-0 h-24 w-24 rounded-full bg-moss/20 blur-3xl" />
        <div className="relative">
          <div className="flex items-center gap-2">
            <ShieldCheck size={24} weight="fill" className="text-moss sm:w-7 sm:h-7" />
            <p className="text-xs uppercase tracking-[0.3em] text-ink/60">{t.admin.title}</p>
          </div>
          <h1 className="mt-2 text-2xl sm:text-3xl md:text-4xl font-semibold">Панель адміністратора</h1>
          <p className="mt-2 text-sm sm:text-base text-ink/70">Управління всіма функціями платформи</p>

          <div className="mt-6 grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-2 lg:grid-cols-5">
            <div className="rounded-2xl border border-moss/20 bg-moss/5 p-4">
              <div className="flex items-center gap-2">
                <Brain size={20} weight="fill" className="text-moss" />
                <span className="text-xs uppercase tracking-[0.2em] text-ink/60">AI System</span>
              </div>
              <p className="mt-1 text-2xl font-semibold text-moss">Active</p>
            </div>

            <div className="rounded-2xl border border-terracotta/20 bg-terracotta/5 p-4">
              <div className="flex items-center gap-2">
                <BookBookmark size={20} weight="fill" className="text-terracotta" />
                <span className="text-xs uppercase tracking-[0.2em] text-ink/60">Слова</span>
              </div>
              <p className="mt-1 text-2xl font-semibold text-terracotta">
                {summary.totalWords}
              </p>
            </div>

            <div className="rounded-2xl border border-gold/30 bg-gold/5 p-4">
              <div className="flex items-center gap-2">
                <Sparkle size={20} weight="fill" className="text-gold" />
                <span className="text-xs uppercase tracking-[0.2em] text-ink/60">Тести</span>
              </div>
              <p className="mt-1 text-2xl font-semibold text-ink">{summary.tests.length}</p>
            </div>

            <div className="rounded-2xl border border-ink/10 bg-ink/5 p-4">
              <div className="flex items-center gap-2">
                <Article size={20} weight="fill" className="text-ink" />
                <span className="text-xs uppercase tracking-[0.2em] text-ink/60">Матеріали</span>
              </div>
              <p className="mt-1 text-2xl font-semibold text-ink">{summary.materials}</p>
            </div>

            <div className="rounded-2xl border border-moss/20 bg-moss/5 p-4">
              <div className="flex items-center gap-2">
                <Users size={20} weight="fill" className="text-moss" />
                <span className="text-xs uppercase tracking-[0.2em] text-ink/60">Користувачі</span>
              </div>
              <p className="mt-1 text-2xl font-semibold text-moss">{summary.users}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-[240px_1fr]">
        <aside className="rounded-3xl border border-ink/10 bg-paper/80 p-3 sm:p-4 shadow-soft">
          <p className="px-2 pb-3 text-xs uppercase tracking-[0.3em] text-ink/40">Навігація</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-1 sm:space-y-0 sm:flex sm:flex-col">
            {tabItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setTab(item.id as typeof tab)}
                className={`flex w-full items-center justify-center sm:justify-start gap-2 sm:gap-3 rounded-2xl px-3 py-2 text-xs sm:text-sm font-semibold transition ${
                  tab === item.id
                    ? "bg-ink text-paper"
                    : "border border-ink/10 bg-paper/60 text-ink/70 hover:border-ink/30 hover:bg-paper"
                }`}
              >
                <item.icon size={16} weight="bold" className="sm:w-[18px] sm:h-[18px]" />
                <span className="flex-1 text-left hidden sm:inline">{item.label}</span>
                <span className="sm:hidden text-[10px]">{item.label}</span>
              </button>
            ))}
          </div>
        </aside>

        <div className="space-y-4 sm:space-y-6">
          {tab === "overview" && (
            <div className="space-y-4 sm:space-y-6">
              {/* Content Stats - Word Types Charts */}
              <div className="rounded-3xl border border-ink/10 bg-paper/80 p-4 sm:p-6 shadow-soft">
                <div className="mb-4 sm:mb-6 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <BookBookmark size={20} weight="bold" className="text-ink sm:w-6 sm:h-6" />
                    <h2 className="text-lg sm:text-xl font-semibold">Слова по типах</h2>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setChartType("bar")}
                      className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition ${
                        chartType === "bar"
                          ? "bg-ink text-paper"
                          : "border border-ink/20 text-ink hover:bg-ink/5"
                      }`}
                    >
                      <ChartBar size={16} weight="bold" />
                      Bar Chart
                    </button>
                    <button
                      onClick={() => setChartType("pie")}
                      className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition ${
                        chartType === "pie"
                          ? "bg-ink text-paper"
                          : "border border-ink/20 text-ink hover:bg-ink/5"
                      }`}
                    >
                      <ChartPie size={16} weight="bold" />
                      Pie Chart
                    </button>
                  </div>
                </div>

                {chartType === "bar" ? (
                  // Bar Chart
                  <div className="space-y-3">
                    {chartData.map((item) => (
                      <div key={item.type} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-semibold">{item.label}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-ink/60">{item.count} слів</span>
                            <span className="font-semibold" style={{ color: item.color }}>
                              {item.percentage}%
                            </span>
                          </div>
                        </div>
                        <div className="relative h-8 overflow-hidden rounded-full bg-fog">
                          <div
                            className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
                            style={{
                              width: `${item.percentage}%`,
                              background: `linear-gradient(90deg, ${item.color}, ${item.color}dd)`
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  // Pie Chart
                  <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
                    {/* SVG Pie */}
                    <div className="flex items-center justify-center">
                      <svg viewBox="0 0 200 200" className="h-[300px] w-[300px]">
                        {(() => {
                          let currentAngle = -90; // Start from top
                          return chartData.map((item, idx) => {
                            const percentage = parseFloat(item.percentage);
                            const angle = (percentage / 100) * 360;
                            const startAngle = currentAngle;
                            const endAngle = currentAngle + angle;
                            currentAngle = endAngle;

                            // Calculate SVG arc path
                            const startRad = (startAngle * Math.PI) / 180;
                            const endRad = (endAngle * Math.PI) / 180;
                            const x1 = 100 + 80 * Math.cos(startRad);
                            const y1 = 100 + 80 * Math.sin(startRad);
                            const x2 = 100 + 80 * Math.cos(endRad);
                            const y2 = 100 + 80 * Math.sin(endRad);
                            const largeArc = angle > 180 ? 1 : 0;

                            return (
                              <g key={item.type}>
                                <path
                                  d={`M 100 100 L ${x1} ${y1} A 80 80 0 ${largeArc} 1 ${x2} ${y2} Z`}
                                  fill={item.color}
                                  className="transition-opacity hover:opacity-80"
                                />
                              </g>
                            );
                          });
                        })()}
                        {/* Center circle for donut effect */}
                        <circle cx="100" cy="100" r="50" fill="#fbf3ea" />
                        <text
                          x="100"
                          y="95"
                          textAnchor="middle"
                          className="text-2xl font-semibold"
                          fill="#2b2118"
                        >
                          {summary.totalWords}
                        </text>
                        <text
                          x="100"
                          y="110"
                          textAnchor="middle"
                          className="text-xs"
                          fill="#2b211899"
                        >
                          всього
                        </text>
                      </svg>
                    </div>

                    {/* Legend */}
                    <div className="grid gap-2 md:grid-cols-2">
                      {chartData.map((item) => (
                        <div
                          key={item.type}
                          className="flex items-center gap-3 rounded-2xl border border-ink/10 bg-paper/60 px-4 py-3"
                        >
                          <div
                            className="h-4 w-4 flex-shrink-0 rounded-full"
                            style={{ backgroundColor: item.color }}
                          />
                          <div className="flex-1">
                            <p className="text-sm font-semibold">{item.label}</p>
                            <p className="text-xs text-ink/60">
                              {item.count} ({item.percentage}%)
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Additional Content Stats */}
              <div>
                <div className="mb-4 flex items-center gap-2">
                  <Article size={24} weight="bold" className="text-ink" />
                  <h2 className="text-xl font-semibold">Інші ресурси</h2>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  {[
                    { label: t.home.tests, value: summary.tests.length, icon: ShieldCheck, tone: "moss" },
                    { label: "Матеріали для вправ", value: summary.materials, icon: Article, tone: "terracotta" },
                    { label: "Workbook контент", value: summary.workbookContent, icon: BookBookmark, tone: "gold" }
                  ].map((stat) => (
                    <div key={stat.label} className="group rounded-3xl border border-ink/10 bg-paper/80 p-5 shadow-soft transition hover:shadow-md">
                      <div className="flex items-center gap-2">
                        <div
                          className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl ${
                            stat.tone === "moss"
                              ? "bg-moss/10 text-moss"
                              : stat.tone === "terracotta"
                              ? "bg-terracotta/10 text-terracotta"
                              : "bg-gold/20 text-terracotta"
                          } transition group-hover:scale-110`}
                        >
                          <stat.icon size={20} weight="fill" />
                        </div>
                      </div>
                      <p className="mt-3 text-xs uppercase tracking-[0.3em] text-ink/40">{stat.label}</p>
                      <p className="mt-2 text-3xl font-semibold">{stat.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Available Tests */}
              <div className="rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft">
                <div className="flex items-center gap-2">
                  <ListChecks size={24} weight="bold" className="text-ink" />
                  <h2 className="text-xl font-semibold">{t.admin.availableTests}</h2>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {summary.tests.map((test, idx) => (
                    <div
                      key={test.id}
                      className="flex items-center gap-3 rounded-2xl border border-ink/10 bg-paper/60 px-4 py-3 text-sm transition hover:border-ink/20"
                    >
                      <div className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-moss/10 text-xs font-semibold text-moss">
                        {idx + 1}
                      </div>
                      <span className="text-ink/70">{test.title}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* System Diagnostics */}
              <AdminDiagnosticsPanel />

              {/* AI Models Configuration */}
              <AdminAiModelsPanel />
            </div>
          )}

          {tab === "users" && <AdminUsersPanel />}

          {tab === "content" && (
            <div className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-[0.6fr_0.4fr]">
                <AdminImportPanel />
                <div className="rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft">
                  <h2 className="text-2xl font-semibold">{t.admin.availableTests}</h2>
                  <ul className="mt-4 space-y-3 text-sm text-ink/70">
                    {summary.tests.map((test) => (
                      <li key={test.id} className="rounded-2xl border border-ink/10 bg-paper/60 px-4 py-3">
                        {test.title}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <AdminWorkbookContentPanel />
              <AdminExerciseMaterialsPanel />
              <AdminVideoPanel />
              <AdminAboutPanel />
            </div>
          )}

          {tab === "monetization" && (
            <div className="space-y-6">
              <AdminBillingPanel />
              <PromoCodesAdvancedPanel />
              <AdminAiUsagePanel />
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
