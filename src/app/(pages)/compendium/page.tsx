import type { Metadata, Route } from "next";
import { BookOpenText, GlobeHemisphereWest, Sparkle, MaskHappy } from "@phosphor-icons/react/dist/ssr";
import { getDictionary } from "@/lib/i18n-server";
import { requireCompendiumAccess } from "@/lib/compendium-access";
import CompendiumCarousel from "@/components/CompendiumCarousel";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Compendium",
  description: "Довідник з граматики, культури, фактів та корисних ресурсів."
};

type SectionDef = {
  id: string;
  href: Route;
  tone: string;
  titleUk: string;
  titlePl: string;
  bodyUk: string;
  bodyPl: string;
  detailUk: string;
  detailPl: string;
  highlightsUk: string[];
  highlightsPl: string[];
  iconKey: "grammar" | "sites" | "facts" | "culture";
};

export default async function CompendiumPage() {
  await requireCompendiumAccess();
  const { locale, t } = getDictionary();
  const pick = (uk: string, pl: string) => (locale === "pl" && pl ? pl : uk);

  const SECTIONS: SectionDef[] = [
    {
      id: "grammar",
      href: "/compendium/grammar",
      tone: "from-moss/15 via-paper to-moss/5",
      titleUk: t.compendium.sections.grammar.title,
      titlePl: t.compendium.sections.grammar.title,
      bodyUk: t.compendium.sections.grammar.body,
      bodyPl: t.compendium.sections.grammar.body,
      detailUk: t.compendium.sections.grammar.detail,
      detailPl: t.compendium.sections.grammar.detail,
      highlightsUk: [...t.compendium.sections.grammar.highlights],
      highlightsPl: [...t.compendium.sections.grammar.highlights],
      iconKey: "grammar"
    },
    {
      id: "sites",
      href: "/compendium/useful-sites",
      tone: "from-terracotta/15 via-paper to-gold/10",
      titleUk: t.compendium.sections.sites.title,
      titlePl: t.compendium.sections.sites.title,
      bodyUk: t.compendium.sections.sites.body,
      bodyPl: t.compendium.sections.sites.body,
      detailUk: t.compendium.sections.sites.detail,
      detailPl: t.compendium.sections.sites.detail,
      highlightsUk: [...t.compendium.sections.sites.highlights],
      highlightsPl: [...t.compendium.sections.sites.highlights],
      iconKey: "sites"
    },
    {
      id: "facts",
      href: "/compendium/facts",
      tone: "from-gold/15 via-paper to-moss/10",
      titleUk: t.compendium.sections.facts.title,
      titlePl: t.compendium.sections.facts.title,
      bodyUk: t.compendium.sections.facts.body,
      bodyPl: t.compendium.sections.facts.body,
      detailUk: t.compendium.sections.facts.detail,
      detailPl: t.compendium.sections.facts.detail,
      highlightsUk: [...t.compendium.sections.facts.highlights],
      highlightsPl: [...t.compendium.sections.facts.highlights],
      iconKey: "facts"
    },
    {
      id: "culture",
      href: "/compendium/culture",
      tone: "from-ink/10 via-paper to-moss/10",
      titleUk: t.compendium.sections.culture.title,
      titlePl: t.compendium.sections.culture.title,
      bodyUk: t.compendium.sections.culture.body,
      bodyPl: t.compendium.sections.culture.body,
      detailUk: t.compendium.sections.culture.detail,
      detailPl: t.compendium.sections.culture.detail,
      highlightsUk: [...t.compendium.sections.culture.highlights],
      highlightsPl: [...t.compendium.sections.culture.highlights],
      iconKey: "culture"
    }
  ];

  const sections = SECTIONS.map((s) => ({
    id: s.id,
    href: s.href,
    title: pick(s.titleUk, s.titlePl),
    body: pick(s.bodyUk, s.bodyPl),
    detail: pick(s.detailUk, s.detailPl),
    highlights: locale === "pl" ? s.highlightsPl : s.highlightsUk,
    tone: s.tone,
    icon: s.iconKey
  }));

  return (
    <main className="mx-auto w-full max-w-6xl px-5 sm:px-6 py-10 sm:py-14 pb-24">
      <section className="rounded-[36px] border border-ink/10 bg-gradient-to-br from-ink/5 via-paper to-moss/10 p-8 sm:p-10 shadow-soft">
        <div className="text-xs uppercase tracking-[0.3em] text-ink/50">Compendium</div>
        <h1 className="mt-3 text-3xl sm:text-4xl font-semibold text-ink">
          {t.compendium.title}
        </h1>
        <p className="mt-3 text-sm sm:text-base text-ink/70 max-w-3xl">
          {t.compendium.subtitle}
        </p>
        <CompendiumCarousel
          sections={sections}
          ctaLabel={t.compendium.cta}
          autoplayLabel={t.compendium.autoplay}
        />
      </section>
    </main>
  );
}
