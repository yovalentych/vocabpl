import Link from "next/link";
import type { Route } from "next";
import {
  BookBookmark,
  BookOpen,
  NotePencil,
  TestTube,
  Trophy,
  Sparkle,
  Lightning,
  Brain,
  Target,
  ChatCircle,
  PuzzlePiece,
  Translate,
  PencilLine,
  Article
} from "@phosphor-icons/react/dist/ssr";
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
    <main className="mx-auto w-full max-w-6xl px-4 sm:px-6 py-8 sm:py-14">
      {/* Hero Section */}
      <section className="relative">
        <div className="absolute -left-8 -top-8 h-32 w-32 rounded-full bg-gold/10 blur-3xl" />
        <div className="absolute -right-12 top-12 h-40 w-40 rounded-full bg-moss/10 blur-3xl" />

        <div className="relative space-y-8 text-center fade-in">
          <div className="inline-flex items-center gap-2 rounded-full border border-ink/10 bg-paper/80 px-4 py-2 shadow-soft">
            <Sparkle size={16} weight="fill" className="text-gold" />
            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-ink/70">
              {t.home.aiPowered}
            </span>
          </div>

          <h1 className="mx-auto max-w-4xl text-3xl font-semibold leading-tight sm:text-4xl md:text-5xl lg:text-6xl">
            {t.home.aiTitle}
          </h1>

          <p className="mx-auto max-w-2xl text-base sm:text-lg text-ink/70">
            {t.home.aiSubtitle}
          </p>

          <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center justify-center gap-3 sm:gap-4 max-w-md sm:max-w-none mx-auto">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-ink px-8 py-3 text-sm font-semibold text-paper shadow-soft transition hover:bg-ink/90"
            >
              <Lightning size={18} weight="fill" />
              {t.home.start}
            </Link>
            <Link
              href="/class/dict"
              className="inline-flex items-center justify-center rounded-full border border-ink/20 px-8 py-3 text-sm font-semibold text-ink transition hover:bg-ink/5"
            >
              {t.home.explore}
            </Link>
          </div>
        </div>
      </section>

      {/* AI Features Grid */}
      <section className="mt-24">
        <div className="mb-8 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-ink/50">{t.home.aiFeatures}</p>
          <h2 className="mt-2 text-3xl font-semibold">{t.home.aiExercises}</h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              title: t.home.aiCards.sentences,
              text: t.home.aiCards.sentencesText,
              icon: PencilLine,
              tone: "bg-terracotta/10 text-terracotta"
            },
            {
              title: t.home.aiCards.cloze,
              text: t.home.aiCards.clozeText,
              icon: Target,
              tone: "bg-moss/10 text-moss"
            },
            {
              title: t.home.aiCards.match,
              text: t.home.aiCards.matchText,
              icon: PuzzlePiece,
              tone: "bg-gold/20 text-terracotta"
            },
            {
              title: t.home.aiCards.translate,
              text: t.home.aiCards.translateText,
              icon: Translate,
              tone: "bg-ink/5 text-ink"
            },
            {
              title: t.home.aiCards.dialogue,
              text: t.home.aiCards.dialogueText,
              icon: ChatCircle,
              tone: "bg-terracotta/10 text-terracotta"
            },
            {
              title: t.home.aiCards.paraphrase,
              text: t.home.aiCards.paraphraseText,
              icon: NotePencil,
              tone: "bg-moss/10 text-moss"
            },
            {
              title: t.home.aiCards.story,
              text: t.home.aiCards.storyText,
              icon: Article,
              tone: "bg-gold/20 text-terracotta"
            },
            {
              title: t.home.aiChecking,
              text: t.home.aiRealtime,
              icon: Brain,
              tone: "bg-ink/5 text-ink"
            }
          ].map((card, idx) => (
            <div
              key={idx}
              className="group rounded-3xl border border-ink/10 bg-paper/70 p-6 shadow-soft transition hover:border-ink/20 hover:shadow-md"
            >
              <div className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl ${card.tone} transition group-hover:scale-110`}>
                <card.icon size={24} weight="bold" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">{card.title}</h3>
              <p className="mt-2 text-sm text-ink/60">{card.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Stats & CTA Section */}
      <section className="mt-24 grid gap-8 lg:grid-cols-2">
        {/* Stats Panel */}
        <div className="rounded-[32px] border border-ink/10 bg-paper/80 p-8 shadow-soft">
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

        {/* AI Features Highlights */}
        <div className="space-y-4">
          <div className="rounded-3xl border border-moss/20 bg-moss/5 p-6 shadow-soft">
            <div className="flex items-start gap-4">
              <div className="inline-flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-moss/20 text-moss">
                <Brain size={24} weight="fill" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-moss">{t.home.aiPersonalized}</h3>
                <p className="mt-1 text-sm text-ink/70">
                  AI аналізує твій рівень і пропонує вправи, які підходять саме тобі
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-terracotta/20 bg-terracotta/5 p-6 shadow-soft">
            <div className="flex items-start gap-4">
              <div className="inline-flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-terracotta/20 text-terracotta">
                <Lightning size={24} weight="fill" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-terracotta">{t.home.aiRealtime}</h3>
                <p className="mt-1 text-sm text-ink/70">
                  Миттєва перевірка відповідей та детальний feedback від AI
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-gold/30 bg-gold/5 p-6 shadow-soft">
            <div className="flex items-start gap-4">
              <div className="inline-flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-gold/30 text-terracotta">
                <Target size={24} weight="fill" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-ink">{t.home.aiChecking}</h3>
                <p className="mt-1 text-sm text-ink/70">
                  AI перевіряє граматику, вокабуляр та стиль твоїх відповідей
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Traditional Features */}
      <section className="mt-24">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-semibold">Додаткові можливості</h2>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[
            {
              title: t.home.cards.dictionary,
              text: t.home.cards.dictionaryText,
              href: "/class/dict",
              cta: t.home.cards.dictionaryCta,
              icon: BookBookmark,
              tone: "bg-terracotta/20 text-terracotta"
            },
            {
              title: t.home.cards.tests,
              text: t.home.cards.testsText,
              href: "/class/tests",
              cta: t.home.cards.testsCta,
              icon: TestTube,
              tone: "bg-moss/20 text-moss"
            },
            {
              title: t.home.cards.reading,
              text: t.home.cards.readingText,
              href: "/class/reading",
              cta: t.home.cards.readingCta,
              icon: BookOpen,
              tone: "bg-gold/30 text-terracotta"
            }
          ].map((card) => (
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
                href={card.href as Route}
                className="mt-4 inline-flex rounded-full border border-ink/20 px-4 py-2 text-xs font-semibold text-ink hover:bg-ink/5"
              >
                <span className="flex items-center gap-2">
                  {card.cta}
                  <span className="text-terracotta">→</span>
                </span>
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="mt-16 sm:mt-24 rounded-3xl sm:rounded-[32px] border border-ink/10 bg-gradient-to-br from-moss/5 to-terracotta/5 p-6 sm:p-10 md:p-12 text-center shadow-soft">
        <Sparkle size={40} weight="fill" className="mx-auto text-gold sm:w-12 sm:h-12" />
        <h2 className="mt-4 text-2xl sm:text-3xl font-semibold">Готовий почати?</h2>
        <p className="mt-2 text-sm sm:text-base text-ink/70">Приєднуйся до тисяч студентів, які вже вчаться з AI</p>
        <Link
          href="/register"
          className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-ink px-8 py-3 text-sm font-semibold text-paper shadow-soft transition hover:bg-ink/90 w-full sm:w-auto max-w-xs mx-auto"
        >
          <Lightning size={18} weight="fill" />
          {t.home.start}
        </Link>
      </section>
    </main>
  );
}
