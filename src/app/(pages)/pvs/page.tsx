import type { Metadata } from "next";
import { getServerLocale } from "@/lib/i18n-server";
import { getDictionary } from "@/lib/i18n-server";
import { getDb } from "@/lib/db";
import { defaultAboutContent, AboutContent } from "@/lib/about-content";
import { Heart, Sparkle, BookOpen, Brain, MapPin } from "@phosphor-icons/react/dist/ssr";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Про проєкт",
  description: "Polish Vocab Studio — безкоштовний тренажер польської мови для українців. Історія, місія та команда проєкту."
};

const ACCENT_CLASSES = {
  moss: "border-moss/20 bg-moss/5 text-moss",
  terracotta: "border-terracotta/20 bg-terracotta/5 text-terracotta",
  gold: "border-gold/20 bg-gold/10 text-gold",
  ink: "border-ink/10 bg-ink/5 text-ink"
} as const;

export default async function AboutPvsPage() {
  const { locale: dictLocale, t } = getDictionary();
  const locale = getServerLocale();
  const db = await getDb();
  const doc = await db.collection("settings").findOne({ key: "about_pvs" });
  const content = (doc?.value || defaultAboutContent) as AboutContent;

  const heroTitle = locale === "uk" ? content.hero.titleUk : content.hero.titlePl;
  const heroSubtitle = locale === "uk" ? content.hero.subtitleUk : content.hero.subtitlePl;
  const heroLead = locale === "uk" ? content.hero.leadUk : content.hero.leadPl;
  const heroNote = locale === "uk" ? content.hero.noteUk : content.hero.notePl;
  const ctaTitle = locale === "uk" ? content.cta.titleUk : content.cta.titlePl;
  const ctaBody = locale === "uk" ? content.cta.bodyUk : content.cta.bodyPl;

  return (
    <main className="mx-auto w-full max-w-6xl px-5 sm:px-6 py-10 sm:py-14 pb-24">
      <section className="relative overflow-hidden rounded-[32px] border border-ink/10 bg-gradient-to-br from-moss/10 via-paper to-terracotta/10 p-8 sm:p-10 shadow-soft">
        <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gold/20 blur-3xl" />
        <div className="absolute -left-12 bottom-0 h-28 w-28 rounded-full bg-moss/20 blur-3xl" />
        <div className="relative">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-ink/60">
            <Sparkle size={18} weight="fill" className="text-gold" />
            Polish Vocab Studio
          </div>
          <h1 className="mt-3 text-3xl sm:text-4xl font-semibold text-ink">{heroTitle}</h1>
          <p className="mt-3 text-base sm:text-lg text-ink/70">{heroSubtitle}</p>
          <p className="mt-4 text-sm sm:text-base text-ink/70 leading-relaxed max-w-3xl">
            {heroLead}
          </p>
          <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-ink/10 bg-paper/70 px-4 py-2 text-xs sm:text-sm text-ink/70">
            <Brain size={16} weight="fill" className="text-moss" />
            {heroNote}
          </div>
        </div>
      </section>

      <section className="mt-10 grid gap-6 sm:grid-cols-2">
        {content.sections
          .filter((section) => section.enabled)
          .map((section) => {
            const title = locale === "uk" ? section.titleUk : section.titlePl;
            const body = locale === "uk" ? section.bodyUk : section.bodyPl;
            const accent = ACCENT_CLASSES[section.accent || "ink"];
            return (
              <article
                key={section.id}
                className="rounded-[28px] border border-ink/10 bg-paper/80 p-6 shadow-soft"
              >
                <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.3em] ${accent}`}>
                  <BookOpen size={14} weight="bold" />
                  {title}
                </div>
                <p className="mt-4 text-sm sm:text-base text-ink/70 leading-relaxed">
                  {body}
                </p>
              </article>
            );
          })}
      </section>

      <section className="mt-10 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[28px] border border-moss/20 bg-gradient-to-br from-moss/10 to-paper p-6 sm:p-8 shadow-soft">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-ink/60">
            <MapPin size={16} weight="fill" className="text-moss" />
            PVS
          </div>
          <h2 className="mt-3 text-2xl font-semibold text-ink">{ctaTitle}</h2>
          <p className="mt-3 text-sm sm:text-base text-ink/70">{ctaBody}</p>
          <a
            className="mt-5 inline-flex items-center gap-2 rounded-full border border-ink/15 bg-paper px-4 py-2 text-sm font-semibold text-ink/80 transition hover:border-ink/30 hover:bg-ink/5"
            href={`mailto:${content.cta.email}`}
          >
            <Heart size={16} weight="fill" className="text-terracotta" />
            {content.cta.email}
          </a>
        </div>

        <div className="rounded-[28px] border border-ink/10 bg-paper/80 p-6 sm:p-8 shadow-soft">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-ink/60">
            <Sparkle size={16} weight="fill" className="text-gold" />
            {t.pvs.explore}
          </div>
          <p className="mt-3 text-sm sm:text-base text-ink/70">
            {t.pvs.exploreDescription}
          </p>
          <div className="mt-5 rounded-2xl border border-ink/10 bg-paper/60 px-4 py-3 text-xs text-ink/60">
            {t.pvs.exploreTip}
          </div>
        </div>
      </section>
    </main>
  );
}
