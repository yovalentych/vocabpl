import type { Metadata } from "next";
import Link from "next/link";
import { GlobeHemisphereWest, LinkSimple, Star, ArrowLeft } from "@phosphor-icons/react/dist/ssr";
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
    <main className="mx-auto w-full max-w-6xl px-5 sm:px-6 py-10 sm:py-14 pb-24">
      <Link
        href="/compendium"
        className="mb-6 inline-flex items-center gap-2 text-sm text-ink/50 transition hover:text-ink"
      >
        <ArrowLeft size={16} />
        {t.compendium.back}
      </Link>

      <section className="rounded-[36px] border border-ink/10 bg-gradient-to-br from-terracotta/10 via-paper to-gold/10 p-8 sm:p-10 shadow-soft">
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-ink/50">
          <GlobeHemisphereWest size={18} />
          {t.compendium.sitesLabel}
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
            {t.compendium.draftLabel}
          </div>
          <div className="mt-3 text-sm text-ink/70">
            {renderSimpleMarkdown(pick(content.sidebarNoteUk, content.sidebarNotePl))}
          </div>
        </aside>
      </section>
    </main>
  );
}
