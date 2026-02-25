import type { Metadata } from "next";
import Link from "next/link";
import { MaskHappy, Compass, ArrowLeft } from "@phosphor-icons/react/dist/ssr";
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
    <main className="mx-auto w-full max-w-6xl px-5 sm:px-6 py-10 sm:py-14 pb-24">
      <Link
        href="/compendium"
        className="mb-6 inline-flex items-center gap-2 text-sm text-ink/50 transition hover:text-ink"
      >
        <ArrowLeft size={16} />
        {t.compendium.back}
      </Link>

      <section className="rounded-[36px] border border-ink/10 bg-gradient-to-br from-ink/10 via-paper to-terracotta/10 p-8 sm:p-10 shadow-soft">
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-ink/50">
          <MaskHappy size={18} />
          {t.compendium.cultureLabel}
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

      <section className="mt-10 grid gap-6 lg:grid-cols-[0.55fr_0.45fr]">
        <div className="space-y-4">
          {content.pulses.map((item) => (
            <article key={item.id} className="rounded-[28px] border border-ink/10 bg-paper/80 p-6 shadow-soft">
              <h2 className="text-lg font-semibold text-ink">{pick(item.titleUk, item.titlePl)}</h2>
              <div className="mt-3 text-sm text-ink/70 leading-relaxed">
                {renderSimpleMarkdown(pick(item.bodyUk, item.bodyPl))}
              </div>
            </article>
          ))}
        </div>

        <aside className="rounded-[28px] border border-ink/10 bg-paper/80 p-6 shadow-soft">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-ink/50">
            <Compass size={16} />
            {t.compendium.navigatorLabel}
          </div>
          <div className="mt-3 text-sm text-ink/70">
            {renderSimpleMarkdown(pick(content.sidebarNoteUk, content.sidebarNotePl))}
          </div>
        </aside>
      </section>
    </main>
  );
}
