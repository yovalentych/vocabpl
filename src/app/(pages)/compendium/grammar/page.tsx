import type { Metadata } from "next";
import Link from "next/link";
import { BookOpenText, Lightning, ArrowLeft, CheckCircle, ArrowRight, Sparkle } from "@phosphor-icons/react/dist/ssr";
import { getDictionary } from "@/lib/i18n-server";
import { loadCompendiumContent } from "@/lib/compendium-loader";
import { renderSimpleMarkdown } from "@/components/markdown";
import { requireCompendiumAccess } from "@/lib/compendium-access";

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
        {/* Sidebar */}
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-[28px] border border-ink/10 bg-paper/80 p-6 shadow-soft">
            {/* Navigation */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                <Lightning size={16} className="text-moss" weight="fill" />
                <h3 className="text-xs uppercase tracking-[0.3em] text-ink/50 font-semibold">
                  {t.compendium.sprintsLabel}
                </h3>
              </div>

              <nav className="space-y-2">
                {content.sprints.map((sprint, idx) => (
                  <a
                    key={sprint.id}
                    href={`#sprint-${sprint.id}`}
                    className="flex items-center gap-3 rounded-xl border border-ink/10 bg-paper/60 px-3 py-2 text-sm text-ink/70 hover:border-moss/30 hover:bg-moss/5 hover:text-moss transition-all group"
                  >
                    <span className="flex h-6 w-6 items-center justify-center rounded-full border border-ink/20 bg-paper text-xs font-semibold text-ink/50 group-hover:border-moss/40 group-hover:bg-moss/10 group-hover:text-moss">
                      {idx + 1}
                    </span>
                    <span className="font-medium">{pick(sprint.titleUk, sprint.titlePl)}</span>
                  </a>
                ))}
              </nav>
            </div>

            {/* Progress */}
            <div className="rounded-2xl border border-moss/20 bg-moss/5 p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs uppercase tracking-[0.2em] text-ink/50 font-semibold">
                  {locale === "uk" ? "Прогрес" : "Postęp"}
                </span>
                <span className="text-sm font-bold text-moss">60%</span>
              </div>
              <div className="h-2 rounded-full bg-ink/10 overflow-hidden">
                <div className="h-full bg-moss transition-all duration-500" style={{ width: "60%" }} />
              </div>
              <p className="mt-2 text-xs text-ink/60">
                {locale === "uk" ? "3 з 5 тем вивчено" : "3 z 5 tematów ukończonych"}
              </p>
            </div>

            {/* Focus Tips */}
            <div className="mt-6 rounded-2xl border border-gold/20 bg-gold/5 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Sparkle size={14} className="text-gold" weight="fill" />
                <h4 className="text-xs uppercase tracking-[0.2em] text-ink/50 font-semibold">
                  {t.compendium.focusLabel}
                </h4>
              </div>
              <p className="text-xs font-semibold text-ink mb-2">{t.compendium.focusTitle}</p>
              <ul className="space-y-1 text-xs text-ink/60">
                <li>→ {t.compendium.focusRule1}</li>
                <li>→ {t.compendium.focusRule2}</li>
                <li>→ {t.compendium.focusRule3}</li>
              </ul>
            </div>
          </div>
        </aside>

        {/* Content Area */}
        <div className="space-y-10">
          {/* Sprints Section */}
          <section>
            <h2 className="text-2xl font-bold text-ink mb-6 flex items-center gap-3">
              <div className="h-1 w-12 rounded-full bg-gradient-to-r from-moss to-moss/20" />
              {t.compendium.sprintsLabel}
            </h2>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {content.sprints.map((sprint) => (
                <div
                  key={sprint.id}
                  id={`sprint-${sprint.id}`}
                  className="group rounded-[24px] border border-moss/20 bg-gradient-to-br from-moss/5 to-paper p-6 shadow-soft hover:shadow-lg hover:border-moss/40 hover:scale-[1.02] transition-all duration-300"
                >
                  <h3 className="text-lg font-bold text-ink mb-3 group-hover:text-moss transition-colors">
                    {pick(sprint.titleUk, sprint.titlePl)}
                  </h3>
                  <div className="text-sm text-ink/70 leading-relaxed prose prose-sm prose-ul:pl-0 prose-li:pl-0">
                    {renderSimpleMarkdown(pick(sprint.hintUk, sprint.hintPl))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Rules Section */}
          <section>
            <h2 className="text-2xl font-bold text-ink mb-6 flex items-center gap-3">
              <div className="h-1 w-12 rounded-full bg-gradient-to-r from-gold to-gold/20" />
              {locale === "uk" ? "Детальні правила" : "Szczegółowe reguły"}
            </h2>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {content.rules.map((rule) => (
                <article
                  key={rule.id}
                  className="rounded-[24px] border border-ink/10 bg-paper/80 p-5 shadow-soft hover:shadow-md hover:border-gold/30 transition-all duration-300"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle size={16} className="text-gold" weight="fill" />
                    <h3 className="text-sm font-bold text-ink uppercase tracking-wide">
                      {pick(rule.titleUk, rule.titlePl)}
                    </h3>
                  </div>
                  <div className="text-sm text-ink/70 leading-relaxed prose prose-sm prose-strong:text-moss prose-strong:font-semibold">
                    {renderSimpleMarkdown(pick(rule.bodyUk, rule.bodyPl))}
                  </div>
                </article>
              ))}
            </div>
          </section>

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
