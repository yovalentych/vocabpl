import type { Metadata } from "next";
import { GlobeHemisphereWest, LinkSimple, Star } from "@phosphor-icons/react/dist/ssr";
import { getServerLocale } from "@/lib/i18n-server";
import { getDb } from "@/lib/db";
import { defaultCompendiumContent } from "@/lib/compendium-content";
import { renderSimpleMarkdown } from "@/components/markdown";
import { requireCompendiumAccess } from "@/lib/compendium-access";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Compendium · Useful Sites",
  description: "Підбірка корисних ресурсів для вивчення польської мови."
};

export default async function CompendiumUsefulSitesPage() {
  await requireCompendiumAccess();
  const locale = getServerLocale();
  const pick = (uk: string, pl: string) => (locale === "pl" && pl ? pl : uk);
  const db = await getDb();
  const doc = await db.collection("settings").findOne({ key: "compendium_content" });
  const content = (doc?.value || defaultCompendiumContent).usefulSites;

  return (
    <main className="mx-auto w-full max-w-6xl px-5 sm:px-6 py-10 sm:py-14 pb-24">
      <section className="rounded-[36px] border border-ink/10 bg-gradient-to-br from-terracotta/10 via-paper to-gold/10 p-8 sm:p-10 shadow-soft">
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-ink/50">
          <GlobeHemisphereWest size={18} />
          {locale === "pl" ? "Przydatne strony" : "Корисні сайти"}
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

      <section className="mt-10 grid gap-6 lg:grid-cols-[0.7fr_0.3fr]">
        <div className="space-y-6">
          {content.groups.map((group) => (
            <div key={group.id} className="rounded-[28px] border border-ink/10 bg-paper/80 p-6 shadow-soft">
              <h2 className="text-lg font-semibold text-ink">{pick(group.titleUk, group.titlePl)}</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {group.items.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-ink/10 bg-paper/60 p-4">
                    <div className="flex items-center justify-between">
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm font-semibold text-ink underline underline-offset-4"
                      >
                        {item.name}
                      </a>
                      <LinkSimple size={16} className="text-ink/40" />
                    </div>
                    <div className="mt-2 text-xs text-ink/60">
                      {renderSimpleMarkdown(pick(item.noteUk, item.notePl))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <aside className="rounded-[28px] border border-ink/10 bg-paper/80 p-6 shadow-soft">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-ink/50">
            <Star size={16} />
            {locale === "pl" ? "Чернетка" : "Чернетка"}
          </div>
          <div className="mt-3 text-sm text-ink/70">
            {renderSimpleMarkdown(pick(content.sidebarNoteUk, content.sidebarNotePl))}
          </div>
          <div className="mt-4 rounded-2xl border border-ink/10 bg-paper/60 px-4 py-3 text-xs text-ink/60">
            {renderSimpleMarkdown(pick(content.sidebarPlanUk, content.sidebarPlanPl))}
          </div>
        </aside>
      </section>
    </main>
  );
}
