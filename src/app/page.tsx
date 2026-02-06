import Link from "next/link";
import type { Route } from "next";
import { BookBookmark, BookOpen, NotePencil, TestTube, Trophy, Sparkle } from "@phosphor-icons/react/dist/ssr";
import { getDb } from "@/lib/db";
import { getDictionary } from "@/lib/i18n-server";

async function getStats() {
  const db = await getDb();
  const [verbs, adverbs, adjectives, tests] = await Promise.all([
    db.collection("words").countDocuments({ $or: [{ type: "verb" }, { pos: "verb" }] }),
    db.collection("words").countDocuments({ $or: [{ type: "adverb" }, { pos: "adverb" }] }),
    db.collection("words").countDocuments({ $or: [{ type: "adjective" }, { pos: "adjective" }] }),
    db.collection("tests").countDocuments({})
  ]);

  return { verbs, adverbs, adjectives, tests };
}

export default async function HomePage() {
  const { t } = getDictionary();
  const stats = await getStats();

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-14">
      <section className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6 fade-in">
          <p className="text-xs uppercase tracking-[0.4em] text-ink/50">{t.home.eyebrow}</p>
          <h1 className="text-5xl font-semibold leading-tight">
            {t.home.title}
          </h1>
          <p className="max-w-xl text-base text-ink/70">{t.home.subtitle}</p>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/register"
              className="rounded-full bg-ink px-6 py-3 text-sm font-semibold text-paper"
            >
              {t.home.start}
            </Link>
            <Link
              href="/deck"
              className="rounded-full border border-ink/20 px-6 py-3 text-sm font-semibold text-ink hover:bg-ink/5"
            >
              {t.home.explore}
            </Link>
          </div>
        </div>
        <div className="rounded-[32px] border border-ink/10 bg-paper/80 p-8 shadow-soft fade-in">
          <div className="pattern-grid rounded-2xl border border-ink/5 p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-ink/40">{t.home.snapshot}</p>
            <div className="mt-6 grid gap-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-ink/60">{t.home.verbs}</span>
                <span className="text-2xl font-semibold">{stats.verbs}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-ink/60">{t.home.adverbs}</span>
                <span className="text-2xl font-semibold">{stats.adverbs}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-ink/60">{t.home.adjectives}</span>
                <span className="text-2xl font-semibold">{stats.adjectives}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-ink/60">{t.home.tests}</span>
                <span className="text-2xl font-semibold">{stats.tests}</span>
              </div>
            </div>
            <div className="mt-6 rounded-2xl bg-fog/70 p-4 text-xs text-ink/70">
              {t.home.snapshotHint}
            </div>
          </div>
        </div>
      </section>

      <section className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {([
          {
            title: t.home.cards.dictionary,
            text: t.home.cards.dictionaryText,
            href: "/deck",
            cta: t.home.cards.dictionaryCta,
            icon: BookBookmark,
            tone: "bg-terracotta/20 text-terracotta"
          },
          {
            title: t.home.cards.tests,
            text: t.home.cards.testsText,
            href: "/tests",
            cta: t.home.cards.testsCta,
            icon: TestTube,
            tone: "bg-moss/20 text-moss"
          },
          {
            title: t.home.cards.reading,
            text: t.home.cards.readingText,
            href: "/reading",
            cta: t.home.cards.readingCta,
            icon: BookOpen,
            tone: "bg-gold/30 text-terracotta"
          },
          {
            title: t.home.cards.workbook,
            text: t.home.cards.workbookText,
            href: "/workbook",
            cta: t.home.cards.workbookCta,
            icon: NotePencil,
            tone: "bg-ink/10 text-ink"
          },
          {
            title: t.home.cards.notes,
            text: t.home.cards.notesText,
            href: "/deck",
            cta: t.home.cards.notesCta,
            icon: Sparkle,
            tone: "bg-terracotta/15 text-terracotta"
          },
          {
            title: t.home.cards.account,
            text: t.home.cards.accountText,
            href: "/cabinet",
            cta: t.home.cards.accountCta,
            icon: Trophy,
            tone: "bg-terracotta/15 text-terracotta"
          }
        ] satisfies {
          title: string;
          text: string;
          href: Route;
          cta: string;
          icon: typeof NotePencil;
          tone: string;
        }[]).map((card) => (
          <div
            key={card.title}
            className="rounded-3xl border border-ink/10 bg-paper/70 p-6 shadow-soft"
          >
            <div className="flex items-center gap-3">
              <span className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl ${card.tone}`}>
                <card.icon size={20} weight="bold" />
              </span>
              <h3 className="text-xl font-semibold">{card.title}</h3>
            </div>
            <p className="mt-2 text-sm text-ink/60">{card.text}</p>
            <Link
              href={card.href}
              className="mt-4 inline-flex rounded-full border border-ink/20 px-4 py-2 text-xs font-semibold text-ink hover:bg-ink/5"
            >
              <span className="flex items-center gap-2">
                {card.cta}
                <span className="text-terracotta">→</span>
              </span>
            </Link>
          </div>
        ))}
      </section>
    </main>
  );
}
