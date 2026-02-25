import type { Metadata } from "next";
import Link from "next/link";
import { BookOpenText, CheckCircle, Lightning, Signpost, ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import { getDictionary } from "@/lib/i18n-server";
import { loadCompendiumContent } from "@/lib/compendium-loader";
import { renderSimpleMarkdown } from "@/components/markdown";
import { requireCompendiumAccess } from "@/lib/compendium-access";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Compendium · Grammar",
  description: "Граматика польської мови: структури, правила, приклади."
};

export default async function CompendiumGrammarPage() {
  await requireCompendiumAccess();
  const { locale, t } = getDictionary();
  const pick = (uk: string, pl: string) => (locale === "pl" && pl ? pl : uk);
  const all = await loadCompendiumContent();
  const content = all.grammar;

  return (
    <main className="mx-auto w-full max-w-6xl px-5 sm:px-6 py-10 sm:py-14 pb-24">
      <Link
        href="/compendium"
        className="mb-6 inline-flex items-center gap-2 text-sm text-ink/50 transition hover:text-ink"
      >
        <ArrowLeft size={16} />
        {t.compendium.back}
      </Link>

      <section className="rounded-[36px] border border-ink/10 bg-gradient-to-br from-moss/15 via-paper to-ink/5 p-8 sm:p-10 shadow-soft">
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-ink/50">
          <BookOpenText size={18} />
          {t.compendium.grammarLabel}
        </div>
        <h1 className="mt-3 text-3xl sm:text-4xl font-semibold text-ink">
          {pick(content.hero.titleUk, content.hero.titlePl)}
        </h1>
        <div className="mt-3 max-w-3xl text-sm sm:text-base text-ink/70">
          {renderSimpleMarkdown(pick(content.hero.subtitleUk, content.hero.subtitlePl))}
        </div>
        <div className="mt-3 max-w-3xl text-sm sm:text-base text-ink/60">
          {renderSimpleMarkdown(pick(content.hero.leadUk, content.hero.leadPl))}
        </div>
      </section>

      <section className="mt-10 grid gap-6 lg:grid-cols-[0.65fr_0.35fr]">
        <div className="rounded-[28px] border border-ink/10 bg-paper/80 p-6 shadow-soft">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-ink/50">
            <Signpost size={16} />
            {t.compendium.sprintsLabel}
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {content.sprints.map((item) => (
              <div key={item.id} className="rounded-2xl border border-ink/10 bg-paper/70 p-4">
                <p className="text-sm font-semibold text-ink">{pick(item.titleUk, item.titlePl)}</p>
                <div className="mt-2 text-xs text-ink/60">
                  {renderSimpleMarkdown(pick(item.hintUk, item.hintPl))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <aside className="rounded-[28px] border border-moss/20 bg-gradient-to-br from-moss/10 to-paper p-6 shadow-soft">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-ink/50">
            <Lightning size={16} />
            {t.compendium.focusLabel}
          </div>
          <h2 className="mt-3 text-lg font-semibold text-ink">
            {t.compendium.focusTitle}
          </h2>
          <ul className="mt-3 space-y-2 text-sm text-ink/70">
            <li>— {t.compendium.focusRule1}</li>
            <li>— {t.compendium.focusRule2}</li>
            <li>— {t.compendium.focusRule3}</li>
          </ul>
        </aside>
      </section>

      <section className="mt-10 grid gap-4 sm:grid-cols-3">
        {content.rules.map((rule) => (
          <article key={rule.id} className="rounded-[26px] border border-ink/10 bg-paper/80 p-5 shadow-soft">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-ink/40">
              <CheckCircle size={14} />
              {pick(rule.titleUk, rule.titlePl)}
            </div>
            <div className="mt-3 text-sm text-ink/70 leading-relaxed">
              {renderSimpleMarkdown(pick(rule.bodyUk, rule.bodyPl))}
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
