import type { Metadata } from "next";
import Link from "next/link";
import { GlobeHemisphereWest, LinkSimple, ArrowLeft, ArrowRight, Sparkle, ArrowSquareOut } from "@phosphor-icons/react/dist/ssr";
import { getDictionary } from "@/lib/i18n-server";
import { loadCompendiumContent } from "@/lib/compendium-loader";
import { renderSimpleMarkdown } from "@/components/markdown";
import { requireCompendiumAccess } from "@/lib/compendium-access";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Compendium · Useful Sites",
  description: "Підбірка корисних ресурсів для вивчення польської мови."
};

export default async function CompendiumUsefulSitesPage() {
  await requireCompendiumAccess();
  const { locale, t } = getDictionary();
  const pick = (uk: string, pl: string) => (locale === "pl" && pl ? pl : uk);
  const all = await loadCompendiumContent();
  const content = all.usefulSites;

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
      <section className="relative overflow-hidden rounded-[40px] border border-terracotta/20 bg-gradient-to-br from-terracotta/10 via-paper to-gold/10 p-8 sm:p-12 shadow-soft mb-8">
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-terracotta/20 blur-3xl" />
        <div className="absolute -left-16 bottom-0 h-32 w-32 rounded-full bg-gold/20 blur-3xl" />

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <div className="rounded-xl border border-terracotta/30 bg-terracotta/10 p-2">
              <GlobeHemisphereWest size={24} weight="fill" className="text-terracotta" />
            </div>
            <span className="text-xs uppercase tracking-[0.3em] text-ink/50 font-semibold">
              {t.compendium.sitesLabel}
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
            {/* Navigation */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                <LinkSimple size={16} className="text-terracotta" weight="bold" />
                <h3 className="text-xs uppercase tracking-[0.3em] text-ink/50 font-semibold">
                  {locale === "uk" ? "Категорії" : "Kategorie"}
                </h3>
              </div>

              <nav className="space-y-2">
                {content.groups.map((group, idx) => (
                  <a
                    key={group.id}
                    href={`#group-${group.id}`}
                    className="flex items-center gap-3 rounded-xl border border-ink/10 bg-paper/60 px-3 py-2 text-sm text-ink/70 hover:border-terracotta/30 hover:bg-terracotta/5 hover:text-terracotta transition-all group"
                  >
                    <span className="flex h-6 w-6 items-center justify-center rounded-full border border-ink/20 bg-paper text-xs font-semibold text-ink/50 group-hover:border-terracotta/40 group-hover:bg-terracotta/10 group-hover:text-terracotta">
                      {idx + 1}
                    </span>
                    <span className="font-medium">{pick(group.titleUk, group.titlePl)}</span>
                  </a>
                ))}
              </nav>
            </div>

            {/* Sidebar Note */}
            <div className="rounded-2xl border border-terracotta/20 bg-terracotta/5 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Sparkle size={14} className="text-terracotta" weight="fill" />
                <h4 className="text-xs uppercase tracking-[0.2em] text-ink/50 font-semibold">
                  {locale === "uk" ? "Порада" : "Wskazówka"}
                </h4>
              </div>
              <div className="text-xs text-ink/70 prose prose-xs">
                {renderSimpleMarkdown(pick(content.sidebarNoteUk, content.sidebarNotePl))}
              </div>
            </div>

            {/* Plan */}
            {(content.sidebarPlanUk || content.sidebarPlanPl) && (
              <div className="mt-4 rounded-2xl border border-gold/20 bg-gold/5 p-4">
                <div className="text-xs text-ink/70 prose prose-xs">
                  {renderSimpleMarkdown(pick(content.sidebarPlanUk, content.sidebarPlanPl))}
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Content Area */}
        <div className="space-y-10">
          {content.groups.map((group) => (
            <section key={group.id} id={`group-${group.id}`}>
              <h2 className="text-2xl font-bold text-ink mb-6 flex items-center gap-3">
                <div className="h-1 w-12 rounded-full bg-gradient-to-r from-terracotta to-terracotta/20" />
                {pick(group.titleUk, group.titlePl)}
              </h2>

              <div className="grid gap-4 sm:grid-cols-2">
                {group.items.map((item) => (
                  <a
                    key={item.id}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group rounded-[24px] border border-ink/10 bg-paper/80 p-5 shadow-soft hover:shadow-lg hover:border-terracotta/30 hover:scale-[1.02] transition-all duration-300"
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <h3 className="text-lg font-bold text-ink group-hover:text-terracotta transition-colors">
                        {item.name}
                      </h3>
                      <ArrowSquareOut
                        size={20}
                        className="text-ink/30 group-hover:text-terracotta group-hover:scale-110 transition-all flex-shrink-0"
                        weight="bold"
                      />
                    </div>

                    <p className="text-sm text-ink/70 leading-relaxed">
                      {pick(item.noteUk, item.notePl)}
                    </p>

                    <div className="mt-3 text-xs text-terracotta/70 font-mono truncate">
                      {item.url}
                    </div>
                  </a>
                ))}
              </div>
            </section>
          ))}

          {/* Bottom Navigation */}
          <div className="flex items-center justify-between pt-8 border-t border-ink/10">
            <Link
              href="/compendium/grammar"
              className="inline-flex items-center gap-2 rounded-full border border-moss/30 bg-moss/10 px-5 py-3 text-sm font-semibold text-moss hover:border-moss/50 hover:bg-moss/20 transition-all group"
            >
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
              <span>{locale === "uk" ? "Попередня секція" : "Poprzednia sekcja"}</span>
            </Link>

            <Link
              href="/compendium/facts"
              className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-5 py-3 text-sm font-semibold text-gold hover:border-gold/50 hover:bg-gold/20 transition-all group"
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
