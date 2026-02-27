import type { Metadata, Route } from "next";
import Link from "next/link";
import { BookOpenText, GlobeHemisphereWest, Sparkle, MaskHappy, MagnifyingGlass, ArrowRight, Lightning } from "@phosphor-icons/react/dist/ssr";
import { getDictionary } from "@/lib/i18n-server";
import { requireCompendiumAccess } from "@/lib/compendium-access";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Compendium — довідник з польської мови, культури та ресурсів",
  description:
    "Повний довідник з польської мови: граматичні правила, культурні особливості Польщі, цікаві факти, корисні сайти для навчання. 120+ правил граматики, 80+ фактів, 50+ ресурсів. Ваша енциклопедія польської мови.",
  keywords: [
    "польська граматика",
    "граматика польської мови",
    "культура Польщі",
    "факти про Польщу",
    "навчальні ресурси польська",
    "довідник польської мови",
    "польська мова онлайн",
    "правила польської граматики"
  ],
  openGraph: {
    title: "Compendium — довідник з польської мови та культури",
    description:
      "120+ граматичних правил, 80+ цікавих фактів про Польщу, 50+ навчальних ресурсів. Повна енциклопедія для вивчення польської.",
    type: "website"
  }
};

const ICON_MAP = {
  grammar: BookOpenText,
  sites: GlobeHemisphereWest,
  facts: Sparkle,
  culture: MaskHappy
};

export default async function CompendiumPage() {
  await requireCompendiumAccess();
  const { locale, t } = getDictionary();

  // Section data from i18n
  const sections = [
    {
      id: "grammar",
      href: "/compendium/grammar" as Route,
      title: t.compendium.sections.grammar.title,
      body: t.compendium.sections.grammar.body,
      detail: t.compendium.sections.grammar.detail,
      highlights: [...t.compendium.sections.grammar.highlights],
      icon: "grammar" as const,
      color: "moss",
      gradient: "from-moss/20 via-moss/10 to-transparent"
    },
    {
      id: "sites",
      href: "/compendium/useful-sites" as Route,
      title: t.compendium.sections.sites.title,
      body: t.compendium.sections.sites.body,
      detail: t.compendium.sections.sites.detail,
      highlights: [...t.compendium.sections.sites.highlights],
      icon: "sites" as const,
      color: "terracotta",
      gradient: "from-terracotta/20 via-terracotta/10 to-transparent"
    },
    {
      id: "facts",
      href: "/compendium/facts" as Route,
      title: t.compendium.sections.facts.title,
      body: t.compendium.sections.facts.body,
      detail: t.compendium.sections.facts.detail,
      highlights: [...t.compendium.sections.facts.highlights],
      icon: "facts" as const,
      color: "gold",
      gradient: "from-gold/20 via-gold/10 to-transparent"
    },
    {
      id: "culture",
      href: "/compendium/culture" as Route,
      title: t.compendium.sections.culture.title,
      body: t.compendium.sections.culture.body,
      detail: t.compendium.sections.culture.detail,
      highlights: [...t.compendium.sections.culture.highlights],
      icon: "culture" as const,
      color: "ink",
      gradient: "from-ink/15 via-ink/8 to-transparent"
    }
  ];

  const grammar = sections[0];
  const sites = sections[1];
  const facts = sections[2];
  const culture = sections[3];

  return (
    <main className="mx-auto w-full max-w-7xl px-5 sm:px-6 py-10 sm:py-14 pb-24">
      {/* Hero Section with Animated Background */}
      <section className="relative overflow-hidden rounded-[40px] border border-ink/10 bg-gradient-to-br from-moss/10 via-gold/5 to-terracotta/10 p-10 sm:p-14 shadow-soft mb-8">
        {/* Animated background blobs */}
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-gradient-to-br from-moss/30 to-gold/20 blur-3xl animate-pulse" />
        <div className="absolute -left-20 bottom-0 h-48 w-48 rounded-full bg-gradient-to-br from-terracotta/30 to-moss/20 blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <Lightning size={28} weight="fill" className="text-gold animate-pulse" />
            <span className="text-xs uppercase tracking-[0.3em] text-ink/50 font-semibold">
              Knowledge Hub
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-ink mb-4">
            {t.compendium.title}
          </h1>

          <p className="text-base sm:text-lg text-ink/70 max-w-2xl mb-8">
            {t.compendium.subtitle}
          </p>

          {/* Search bar placeholder */}
          <div className="relative max-w-2xl">
            <div className="absolute left-4 top-1/2 -translate-y-1/2">
              <MagnifyingGlass size={20} className="text-ink/40" />
            </div>
            <input
              type="text"
              placeholder={locale === "uk" ? "Шукати в довіднику..." : "Szukaj w kompendium..."}
              className="w-full rounded-full border border-ink/20 bg-paper/80 backdrop-blur-sm px-12 py-4 text-sm text-ink placeholder:text-ink/40 focus:border-moss/40 focus:outline-none focus:ring-2 focus:ring-moss/20 transition-all"
              disabled
            />
          </div>

          {/* Stats */}
          <div className="flex flex-wrap gap-6 mt-8 text-sm">
            <div className="flex items-center gap-2">
              <BookOpenText size={18} className="text-moss" weight="fill" />
              <span className="text-ink/70">{locale === "uk" ? "120+ правил" : "120+ reguł"}</span>
            </div>
            <div className="flex items-center gap-2">
              <GlobeHemisphereWest size={18} className="text-terracotta" weight="fill" />
              <span className="text-ink/70">{locale === "uk" ? "50+ ресурсів" : "50+ zasobów"}</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkle size={18} className="text-gold" weight="fill" />
              <span className="text-ink/70">{locale === "uk" ? "80+ фактів" : "80+ faktów"}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Magazine Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 auto-rows-fr">
        {/* Grammar - Large featured card (2 columns on large screens) */}
        <Link
          href={grammar.href}
          className="group lg:col-span-2 relative overflow-hidden rounded-[32px] border border-moss/20 bg-gradient-to-br from-moss/5 via-paper to-moss/10 p-8 shadow-soft hover:shadow-lg transition-all duration-300 hover:scale-[1.02] hover:border-moss/40"
        >
          <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-moss/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          <div className="relative z-10">
            <div className="flex items-start justify-between mb-4">
              <div className="rounded-2xl border border-moss/30 bg-moss/10 p-3 group-hover:scale-110 transition-transform duration-300">
                <BookOpenText size={32} weight="fill" className="text-moss" />
              </div>
              <div className="rounded-full border border-moss/20 bg-moss/5 px-3 py-1 text-xs font-semibold text-moss uppercase tracking-wider">
                {locale === "uk" ? "Популярне" : "Popularne"}
              </div>
            </div>

            <h2 className="text-3xl font-bold text-ink mb-3">
              {grammar.title}
            </h2>

            <p className="text-ink/70 mb-6 max-w-xl">
              {grammar.detail}
            </p>

            {/* Quick access topics */}
            <div className="flex flex-wrap gap-2 mb-6">
              {grammar.highlights.slice(0, 3).map((highlight, idx) => (
                <div key={idx} className="rounded-full bg-moss/10 border border-moss/20 px-3 py-1 text-xs text-moss">
                  {highlight}
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 text-moss font-semibold group-hover:gap-3 transition-all">
              <span>{t.compendium.cta}</span>
              <ArrowRight size={18} weight="bold" />
            </div>
          </div>
        </Link>

        {/* Sites - Compact card */}
        <Link
          href={sites.href}
          className="group relative overflow-hidden rounded-[32px] border border-terracotta/20 bg-gradient-to-br from-terracotta/5 via-paper to-gold/5 p-6 shadow-soft hover:shadow-lg transition-all duration-300 hover:scale-[1.02] hover:border-terracotta/40"
        >
          <div className="absolute right-0 bottom-0 h-2/3 w-2/3 bg-gradient-to-tl from-terracotta/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          <div className="relative z-10 h-full flex flex-col">
            <div className="rounded-2xl border border-terracotta/30 bg-terracotta/10 p-3 w-fit mb-4 group-hover:scale-110 transition-transform duration-300">
              <GlobeHemisphereWest size={28} weight="fill" className="text-terracotta" />
            </div>

            <h3 className="text-2xl font-bold text-ink mb-3">
              {sites.title}
            </h3>

            <p className="text-sm text-ink/70 mb-4 flex-1">
              {sites.body}
            </p>

            <div className="flex items-center gap-2 text-terracotta font-semibold text-sm group-hover:gap-3 transition-all">
              <span>{t.compendium.cta}</span>
              <ArrowRight size={16} weight="bold" />
            </div>
          </div>
        </Link>

        {/* Facts - Compact card */}
        <Link
          href={facts.href}
          className="group relative overflow-hidden rounded-[32px] border border-gold/20 bg-gradient-to-br from-gold/5 via-paper to-gold/10 p-6 shadow-soft hover:shadow-lg transition-all duration-300 hover:scale-[1.02] hover:border-gold/40"
        >
          <div className="absolute left-0 top-0 h-2/3 w-2/3 bg-gradient-to-br from-gold/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          <div className="relative z-10 h-full flex flex-col">
            <div className="rounded-2xl border border-gold/30 bg-gold/10 p-3 w-fit mb-4 group-hover:scale-110 transition-transform duration-300">
              <Sparkle size={28} weight="fill" className="text-gold" />
            </div>

            <h3 className="text-2xl font-bold text-ink mb-3">
              {facts.title}
            </h3>

            <p className="text-sm text-ink/70 mb-4 flex-1">
              {facts.body}
            </p>

            <div className="flex items-center gap-2 text-gold font-semibold text-sm group-hover:gap-3 transition-all">
              <span>{t.compendium.cta}</span>
              <ArrowRight size={16} weight="bold" />
            </div>
          </div>
        </Link>

        {/* Culture - Wide card */}
        <Link
          href={culture.href}
          className="group lg:col-span-2 relative overflow-hidden rounded-[32px] border border-ink/15 bg-gradient-to-br from-ink/5 via-paper to-moss/5 p-6 sm:p-8 shadow-soft hover:shadow-lg transition-all duration-300 hover:scale-[1.02] hover:border-ink/30"
        >
          <div className="absolute right-0 top-0 h-full w-full bg-gradient-to-l from-ink/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          <div className="relative z-10 flex flex-col sm:flex-row gap-6 items-start">
            <div className="rounded-2xl border border-ink/20 bg-ink/10 p-3 group-hover:scale-110 transition-transform duration-300">
              <MaskHappy size={32} weight="fill" className="text-ink" />
            </div>

            <div className="flex-1">
              <h3 className="text-2xl sm:text-3xl font-bold text-ink mb-3">
                {culture.title}
              </h3>

              <p className="text-ink/70 mb-4">
                {culture.detail}
              </p>

              <div className="flex flex-wrap gap-2 mb-4">
                {culture.highlights.map((highlight, idx) => (
                  <div key={idx} className="rounded-full bg-ink/5 border border-ink/10 px-3 py-1 text-xs text-ink/70">
                    {highlight}
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 text-ink font-semibold group-hover:gap-3 transition-all">
                <span>{t.compendium.cta}</span>
                <ArrowRight size={18} weight="bold" />
              </div>
            </div>
          </div>
        </Link>
      </div>
    </main>
  );
}
