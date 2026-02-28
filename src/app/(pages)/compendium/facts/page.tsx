import type { Metadata } from "next";
import Link from "next/link";
import { Sparkle, ArrowLeft, ArrowRight, Lightbulb, LinkSimple } from "@phosphor-icons/react/dist/ssr";
import { getDictionary } from "@/lib/i18n-server";
import { loadCompendiumContent } from "@/lib/compendium-loader";
import { renderSimpleMarkdown } from "@/components/markdown";
import { requireCompendiumAccess } from "@/lib/compendium-access";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Compendium · Facts",
  description: "Цікаві факти про польську мову та культуру."
};

export default async function CompendiumFactsPage() {
  await requireCompendiumAccess();
  const { locale, t } = getDictionary();
  const pick = (uk: string, pl: string) => (locale === "pl" && pl ? pl : uk);
  const all = await loadCompendiumContent();
  const content = all.facts;

  return (
    <main className="mx-auto w-full max-w-7xl px-5 sm:px-6 py-10 sm:py-14 pb-24">
      {/* Breadcrumb */}
      <Link
        href="/compendium"
        className="mb-6 inline-flex items-center gap-2 text-sm text-ink/50 hover:text-ink transition-colors group"
      >
        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
        {t.compendium.back}
      </Link>

      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-[40px] border border-gold/20 bg-gradient-to-br from-gold/10 via-paper to-moss/10 p-8 sm:p-12 shadow-soft mb-8">
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-gold/20 blur-3xl" />
        <div className="absolute -left-16 bottom-0 h-32 w-32 rounded-full bg-moss/20 blur-3xl" />

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <div className="rounded-xl border border-gold/30 bg-gold/10 p-2">
              <Sparkle size={24} weight="fill" className="text-gold" />
            </div>
            <span className="text-xs uppercase tracking-[0.3em] text-ink/50 font-semibold">
              {t.compendium.factsLabel}
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold text-ink mb-4">
            {pick(content.hero.titleUk, content.hero.titlePl)}
          </h1>

          <div className="text-base sm:text-lg text-ink/70 mb-4 max-w-3xl">
            {renderSimpleMarkdown(pick(content.hero.subtitleUk, content.hero.subtitlePl))}
          </div>

          <div className="text-sm sm:text-base text-ink/60 max-w-3xl">
            {renderSimpleMarkdown(pick(content.hero.leadUk, content.hero.leadPl))}
          </div>
        </div>
      </section>

      {/* Main Content with Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8">
        {/* Sidebar */}
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-[28px] border border-ink/10 bg-paper/80 p-6 shadow-soft">
            {/* Stats */}
            <div className="mb-6 rounded-2xl border border-gold/20 bg-gold/5 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb size={16} className="text-gold" weight="fill" />
                <h3 className="text-xs uppercase tracking-[0.3em] text-ink/50 font-semibold">
                  {locale === "uk" ? "Статистика" : "Statystyki"}
                </h3>
              </div>
              <p className="text-2xl font-bold text-gold mb-1">{content.items.length}</p>
              <p className="text-xs text-ink/60">
                {locale === "uk" ? "Цікавих фактів" : "Ciekawych faktów"}
              </p>
            </div>

            {/* Sidebar Note */}
            <div className="rounded-2xl border border-ink/10 bg-paper/60 p-4 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Sparkle size={14} className="text-gold" weight="fill" />
                <h4 className="text-xs uppercase tracking-[0.2em] text-ink/50 font-semibold">
                  {locale === "uk" ? "Про факти" : "O faktach"}
                </h4>
              </div>
              <div className="text-xs text-ink/70 prose prose-xs">
                {renderSimpleMarkdown(pick(content.sidebarNoteUk, content.sidebarNotePl))}
              </div>
            </div>

            {/* Plan */}
            {(content.sidebarPlanUk || content.sidebarPlanPl) && (
              <div className="rounded-2xl border border-moss/20 bg-moss/5 p-4">
                <div className="text-xs text-ink/70 prose prose-xs">
                  {renderSimpleMarkdown(pick(content.sidebarPlanUk, content.sidebarPlanPl))}
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Content Area */}
        <div className="space-y-6">
          {content.items.map((fact: any, idx: number) => (
            <article
              key={fact.id}
              className="group rounded-[28px] border border-ink/10 bg-paper/80 p-6 sm:p-8 shadow-soft hover:shadow-lg hover:border-gold/30 hover:scale-[1.01] transition-all duration-300"
            >
              {/* Fact number badge */}
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-gold/30 bg-gold/10 text-sm font-bold text-gold group-hover:scale-110 transition-transform">
                    {idx + 1}
                  </div>
                  <h2 className="text-2xl font-bold text-ink group-hover:text-gold transition-colors">
                    {pick(fact.titleUk, fact.titlePl)}
                  </h2>
                </div>
              </div>

              {/* Fact content */}
              <div className="text-base text-ink/70 leading-relaxed prose prose-base prose-strong:text-gold prose-strong:font-semibold max-w-none">
                {renderSimpleMarkdown(pick(fact.bodyUk, fact.bodyPl))}
              </div>

              {/* Source link */}
              {fact.sourceUrl && fact.sourceLabel && (
                <a
                  href={fact.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-2 rounded-full border border-ink/20 bg-paper/60 px-4 py-2 text-xs font-semibold text-ink/60 hover:border-gold/40 hover:bg-gold/10 hover:text-gold transition-all"
                >
                  <LinkSimple size={14} weight="bold" />
                  {fact.sourceLabel}
                </a>
              )}
            </article>
          ))}

          {/* Bottom Navigation */}
          <div className="flex items-center justify-between pt-8 border-t border-ink/10">
            <Link
              href="/compendium/useful-sites"
              className="inline-flex items-center gap-2 rounded-full border border-terracotta/30 bg-terracotta/10 px-5 py-3 text-sm font-semibold text-terracotta hover:border-terracotta/50 hover:bg-terracotta/20 transition-all group"
            >
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
              <span>{locale === "uk" ? "Попередня секція" : "Poprzednia sekcja"}</span>
            </Link>

            <Link
              href="/compendium/culture"
              className="inline-flex items-center gap-2 rounded-full border border-ink/30 bg-ink/10 px-5 py-3 text-sm font-semibold text-ink hover:border-ink/50 hover:bg-ink/20 transition-all group"
            >
              <span>{locale === "uk" ? "Наступна секція" : "Następna sekcja"}</span>
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
