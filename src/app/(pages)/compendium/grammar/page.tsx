import type { Metadata } from "next";
import Link from "next/link";
import { BookOpenText, ArrowLeft, ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { getDictionary } from "@/lib/i18n-server";
import { loadCompendiumContent } from "@/lib/compendium-loader";
import { renderSimpleMarkdown } from "@/components/markdown";
import { requireCompendiumAccess } from "@/lib/compendium-access";
import GrammarSidebar from "@/components/compendium/GrammarSidebar";
import GrammarInteractive from "@/components/compendium/GrammarInteractive";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = getDictionary();
  return {
    title: `Compendium · ${t.metadata.grammarTitle}`,
    description: t.metadata.grammarDescription
  };
}

export default async function CompendiumGrammarPage() {
  await requireCompendiumAccess();
  const { locale, t } = getDictionary();
  const pick = (uk: string, pl: string) => (locale === "pl" && pl ? pl : uk);
  const all = await loadCompendiumContent();
  const content = all.grammar;

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
      <section className="relative overflow-hidden rounded-[40px] border border-moss/20 bg-gradient-to-br from-moss/10 via-paper to-moss/5 p-8 sm:p-12 shadow-soft mb-8">
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-moss/20 blur-3xl" />
        <div className="absolute -left-16 bottom-0 h-32 w-32 rounded-full bg-gold/20 blur-3xl" />

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <div className="rounded-xl border border-moss/30 bg-moss/10 p-2">
              <BookOpenText size={24} weight="fill" className="text-moss" />
            </div>
            <span className="text-xs uppercase tracking-[0.3em] text-ink/50 font-semibold">
              {t.compendium.grammarLabel}
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
        {/* Sidebar - Client Component */}
        <GrammarSidebar
          sprints={content.sprints}
          totalTopics={content.sprints.length + content.rules.length}
          locale={locale}
          focusTitle={t.compendium.focusTitle}
          focusRule1={t.compendium.focusRule1}
          focusRule2={t.compendium.focusRule2}
          focusRule3={t.compendium.focusRule3}
          sprintsLabel={t.compendium.sprintsLabel}
          focusLabel={t.compendium.focusLabel}
        />

        {/* Content Area - Client Component with Interactive Features */}
        <div className="space-y-10">
          <GrammarInteractive
            sprints={content.sprints}
            rules={content.rules}
            locale={locale}
          />

          {/* Bottom Navigation */}
          <div className="flex items-center justify-between pt-8 border-t border-ink/10">
            <Link
              href="/compendium"
              className="inline-flex items-center gap-2 rounded-full border border-ink/20 px-5 py-3 text-sm font-semibold text-ink hover:border-ink/40 hover:bg-ink/5 transition-all group"
            >
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
              {t.compendium.back}
            </Link>

            <Link
              href="/compendium/useful-sites"
              className="inline-flex items-center gap-2 rounded-full border border-terracotta/30 bg-terracotta/10 px-5 py-3 text-sm font-semibold text-terracotta hover:border-terracotta/50 hover:bg-terracotta/20 transition-all group"
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
