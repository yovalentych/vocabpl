import type { Metadata } from "next";
import Link from "next/link";
import { MaskHappy, Compass, ArrowLeft, Heart, Sparkle } from "@phosphor-icons/react/dist/ssr";
import { getDictionary } from "@/lib/i18n-server";
import { loadCompendiumContent } from "@/lib/compendium-loader";
import { renderSimpleMarkdown } from "@/components/markdown";
import { requireCompendiumAccess } from "@/lib/compendium-access";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Compendium · Culture",
  description: "Культурний контекст для вивчення польської мови."
};

export default async function CompendiumCulturePage() {
  await requireCompendiumAccess();
  const { locale, t } = getDictionary();
  const pick = (uk: string, pl: string) => (locale === "pl" && pl ? pl : uk);
  const all = await loadCompendiumContent();
  const content = all.culture;

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
      <section className="relative overflow-hidden rounded-[40px] border border-ink/15 bg-gradient-to-br from-ink/5 via-paper to-moss/5 p-8 sm:p-12 shadow-soft mb-8">
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-ink/10 blur-3xl" />
        <div className="absolute -left-16 bottom-0 h-32 w-32 rounded-full bg-moss/20 blur-3xl" />

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <div className="rounded-xl border border-ink/20 bg-ink/10 p-2">
              <MaskHappy size={24} weight="fill" className="text-ink" />
            </div>
            <span className="text-xs uppercase tracking-[0.3em] text-ink/50 font-semibold">
              {t.compendium.cultureLabel}
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
            <div className="mb-6 rounded-2xl border border-ink/20 bg-ink/5 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Compass size={16} className="text-ink" weight="fill" />
                <h3 className="text-xs uppercase tracking-[0.3em] text-ink/50 font-semibold">
                  {locale === "uk" ? "Теми" : "Tematy"}
                </h3>
              </div>
              <p className="text-2xl font-bold text-ink mb-1">{content.pulses.length}</p>
              <p className="text-xs text-ink/60">
                {locale === "uk" ? "Культурних тем" : "Tematów kulturowych"}
              </p>
            </div>

            {/* Sidebar Note */}
            <div className="rounded-2xl border border-moss/20 bg-moss/5 p-4 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Heart size={14} className="text-moss" weight="fill" />
                <h4 className="text-xs uppercase tracking-[0.2em] text-ink/50 font-semibold">
                  {locale === "uk" ? "Про культуру" : "O kulturze"}
                </h4>
              </div>
              <div className="text-xs text-ink/70 prose prose-xs">
                {renderSimpleMarkdown(pick(content.sidebarNoteUk, content.sidebarNotePl))}
              </div>
            </div>

            {/* Plan */}
            {(content.sidebarPlanUk || content.sidebarPlanPl) && (
              <div className="rounded-2xl border border-gold/20 bg-gold/5 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkle size={14} className="text-gold" weight="fill" />
                  <h4 className="text-xs uppercase tracking-[0.2em] text-ink/50 font-semibold">
                    {locale === "uk" ? "План" : "Plan"}
                  </h4>
                </div>
                <div className="text-xs text-ink/70 prose prose-xs">
                  {renderSimpleMarkdown(pick(content.sidebarPlanUk, content.sidebarPlanPl))}
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Content Area */}
        <div className="space-y-6">
          {content.pulses.map((pulse, idx) => (
            <article
              key={pulse.id}
              className="group rounded-[28px] border border-ink/10 bg-paper/80 p-6 sm:p-8 shadow-soft hover:shadow-lg hover:border-ink/25 hover:scale-[1.01] transition-all duration-300"
            >
              {/* Pulse header */}
              <div className="flex items-start gap-4 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-ink/20 bg-ink/5 text-sm font-bold text-ink group-hover:scale-110 group-hover:border-moss/40 group-hover:bg-moss/10 group-hover:text-moss transition-all">
                  {idx + 1}
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-ink group-hover:text-moss transition-colors">
                    {pick(pulse.titleUk, pulse.titlePl)}
                  </h2>
                </div>
              </div>

              {/* Pulse content */}
              <div className="text-base text-ink/70 leading-relaxed prose prose-base prose-strong:text-ink prose-strong:font-semibold max-w-none">
                {renderSimpleMarkdown(pick(pulse.bodyUk, pulse.bodyPl))}
              </div>
            </article>
          ))}

          {/* Bottom Navigation */}
          <div className="flex items-center justify-between pt-8 border-t border-ink/10">
            <Link
              href="/compendium/facts"
              className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-5 py-3 text-sm font-semibold text-gold hover:border-gold/50 hover:bg-gold/20 transition-all group"
            >
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
              <span>{locale === "uk" ? "Попередня секція" : "Poprzednia sekcja"}</span>
            </Link>

            <Link
              href="/compendium"
              className="inline-flex items-center gap-2 rounded-full border border-ink/20 px-5 py-3 text-sm font-semibold text-ink hover:border-ink/40 hover:bg-ink/5 transition-all group"
            >
              <span>{t.compendium.back}</span>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
