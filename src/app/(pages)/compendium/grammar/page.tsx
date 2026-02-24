import type { Metadata } from "next";
import { BookOpenText, CheckCircle, Lightning, Signpost } from "@phosphor-icons/react/dist/ssr";
import { getServerLocale } from "@/lib/i18n-server";
import { getDb } from "@/lib/db";
import { defaultCompendiumContent } from "@/lib/compendium-content";
import { renderSimpleMarkdown } from "@/components/markdown";
import { requireCompendiumAccess } from "@/lib/compendium-access";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Compendium · Grammar",
  description: "Граматика польської мови: структури, правила, приклади."
};

export default async function CompendiumGrammarPage() {
  await requireCompendiumAccess();
  const locale = getServerLocale();
  const pick = (uk: string, pl: string) => (locale === "pl" && pl ? pl : uk);
  const db = await getDb();
  const doc = await db.collection("settings").findOne({ key: "compendium_content" });
  const content = (doc?.value || defaultCompendiumContent).grammar;

  return (
    <main className="mx-auto w-full max-w-6xl px-5 sm:px-6 py-10 sm:py-14 pb-24">
      <section className="rounded-[36px] border border-ink/10 bg-gradient-to-br from-moss/15 via-paper to-ink/5 p-8 sm:p-10 shadow-soft">
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-ink/50">
          <BookOpenText size={18} />
          {locale === "pl" ? "Gramatyka" : "Граматика"}
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
            {locale === "pl" ? "Sprinty" : "Спринти"}
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
            {locale === "pl" ? "Fokus" : "Фокус"}
          </div>
          <h2 className="mt-3 text-lg font-semibold text-ink">
            {locale === "pl" ? "3 zasady na dziś" : "3 правила на сьогодні"}
          </h2>
          <ul className="mt-3 space-y-2 text-sm text-ink/70">
            <li>— {locale === "pl" ? "Najpierw czasownik, potem przypadek." : "Спочатку дієслово, потім відмінок."}</li>
            <li>— {locale === "pl" ? "Pytaj: gdzie? dokąd? skąd?" : "Питай: де? куди? звідки?"}</li>
            <li>— {locale === "pl" ? "Zapisuj przykłady pełnym zdaniem." : "Фіксуй приклади повним реченням."}</li>
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
