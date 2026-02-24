import type { Metadata } from "next";
import { Sparkle, Timer, MapPinLine } from "@phosphor-icons/react/dist/ssr";
import { getServerLocale } from "@/lib/i18n-server";
import { getDb } from "@/lib/db";
import { defaultCompendiumContent, type CompendiumContent } from "@/lib/compendium-content";
import { renderSimpleMarkdown } from "@/components/markdown";
import { requireCompendiumAccess } from "@/lib/compendium-access";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Compendium · Facts",
  description: "Цікаві факти про польську мову та культуру."
};

export default async function CompendiumFactsPage() {
  await requireCompendiumAccess();
  const locale = getServerLocale();
  const pick = (uk: string, pl: string) => (locale === "pl" && pl ? pl : uk);
  const db = await getDb();
  const doc = await db.collection("settings").findOne({ key: "compendium_content" });
  const content = (doc?.value || defaultCompendiumContent).facts as CompendiumContent["facts"];

  return (
    <main className="mx-auto w-full max-w-6xl px-5 sm:px-6 py-10 sm:py-14 pb-24">
      <section className="rounded-[36px] border border-ink/10 bg-gradient-to-br from-gold/10 via-paper to-moss/10 p-8 sm:p-10 shadow-soft">
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-ink/50">
          <Sparkle size={18} />
          {locale === "pl" ? "Ciekawe fakty" : "Цікаві факти"}
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

      <section className="mt-10 grid gap-6 lg:grid-cols-[0.4fr_0.6fr]">
        <aside className="rounded-[28px] border border-ink/10 bg-paper/80 p-6 shadow-soft">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-ink/50">
            <Timer size={16} />
            {locale === "pl" ? "Темп" : "Темп"}
          </div>
          <div className="mt-3 text-sm text-ink/70">
            {renderSimpleMarkdown(pick(content.sidebarNoteUk, content.sidebarNotePl))}
          </div>
          <div className="mt-4 rounded-2xl border border-ink/10 bg-paper/60 px-4 py-3 text-xs text-ink/60">
            {renderSimpleMarkdown(pick(content.sidebarPlanUk, content.sidebarPlanPl))}
          </div>
        </aside>

        <div className="space-y-4">
          {content.items.map((fact, index) => (
            <article key={fact.id} className="rounded-[28px] border border-ink/10 bg-paper/80 p-6 shadow-soft">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-ink/40">#{index + 1}</p>
                  <h2 className="mt-2 text-lg font-semibold text-ink">{pick(fact.titleUk, fact.titlePl)}</h2>
                </div>
                <MapPinLine size={18} className="text-ink/40" />
              </div>
              <div className="mt-3 text-sm text-ink/70 leading-relaxed">
                {renderSimpleMarkdown(pick(fact.bodyUk, fact.bodyPl))}
              </div>
              {fact.sourceLabel && fact.sourceUrl && (
                <a
                  href={fact.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex text-xs text-ink/50 underline underline-offset-4"
                >
                  {fact.sourceLabel}
                </a>
              )}
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
