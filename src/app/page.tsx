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
import { getAuthUser } from "@/lib/auth";
import { ObjectId } from "mongodb";

export const dynamic = "force-dynamic";

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

async function getUserSnapshot() {
  const auth = await getAuthUser();
  if (!auth) return null;
  const db = await getDb();
  const user = await db.collection("users").findOne({ _id: new ObjectId(auth.id) });
  if (!user) return null;
  return {
    username: user.username || "",
    name: user.name || "",
    stats: {
      wordsStudied: Number(user.stats?.wordsStudied || 0),
      sessions: Number(user.stats?.sessions || 0),
      testsTaken: Number(user.stats?.testsTaken || 0),
      points: Number(user.stats?.points || 0)
    }
  };
}

export default async function HomePage() {
  const { t } = getDictionary();
  const stats = await getStats();
  const user = await getUserSnapshot();

  return (
    <main className="mx-auto w-full max-w-6xl px-5 sm:px-6 py-12 sm:py-14 pb-24 sm:pb-14">
      {/* Hero Section */}
      <section className="relative">
        <div className="absolute -left-8 -top-8 h-32 w-32 sm:h-40 sm:w-40 rounded-full bg-gold/10 blur-3xl" />
        <div className="absolute -right-12 top-12 h-40 w-40 sm:h-48 sm:w-48 rounded-full bg-moss/10 blur-3xl" />

        <div className="relative space-y-6 sm:space-y-8 text-center fade-in">
          <div className="inline-flex items-center gap-2 sm:gap-2.5 rounded-full border border-ink/10 bg-paper/80 px-5 py-2.5 sm:px-4 sm:py-2 shadow-soft">
            <Sparkle size={18} weight="fill" className="text-gold sm:w-4 sm:h-4" />
            <span className="text-xs sm:text-xs font-semibold uppercase tracking-[0.3em] text-ink/70">
              {user ? t.home.snapshot : t.home.aiPowered}
            </span>
          </div>

          <h1 className="mx-auto max-w-4xl text-4xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.15] sm:leading-tight px-2">
            {user ? `Привіт, ${user.name || user.username || "друже"}!` : t.home.aiTitle}
          </h1>

          <p className="mx-auto max-w-2xl text-lg sm:text-lg leading-relaxed text-ink/70 px-4 sm:px-0">
            {user
              ? "Повертаємось до навчання: твій прогрес збережено, а AI вправи готові."
              : t.home.aiSubtitle}
          </p>

          <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center justify-center gap-4 max-w-sm sm:max-w-none mx-auto pt-2">
            {user ? (
              <>
                <Link
                  href="/class"
                  className="inline-flex items-center justify-center gap-2.5 rounded-full bg-ink px-10 py-4 sm:px-8 sm:py-3 text-base sm:text-sm font-bold sm:font-semibold text-paper shadow-soft transition active:scale-95 hover:bg-ink/90"
                >
                  <Lightning size={20} weight="fill" className="sm:w-[18px] sm:h-[18px]" />
                  Продовжити навчання
                </Link>
                <Link
                  href="/cabinet"
                  className="inline-flex items-center justify-center rounded-full border-2 border-ink/20 px-10 py-4 sm:px-8 sm:py-3 text-base sm:text-sm font-bold sm:font-semibold text-ink transition active:scale-95 hover:bg-ink/5"
                >
                  Мій кабінет
                </Link>
                <Link
                  href="/class/workbook"
                  className="inline-flex items-center justify-center rounded-full border-2 border-ink/10 px-10 py-4 sm:px-8 sm:py-3 text-base sm:text-sm font-semibold text-ink/70 transition active:scale-95 hover:bg-ink/5"
                >
                  Вправи та зошит
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center gap-2.5 rounded-full bg-ink px-10 py-4 sm:px-8 sm:py-3 text-base sm:text-sm font-bold sm:font-semibold text-paper shadow-soft transition active:scale-95 hover:bg-ink/90"
                >
                  <Lightning size={20} weight="fill" className="sm:w-[18px] sm:h-[18px]" />
                  {t.home.start}
                </Link>
                <Link
                  href="/class/dict"
                  className="inline-flex items-center justify-center rounded-full border-2 border-ink/20 px-10 py-4 sm:px-8 sm:py-3 text-base sm:text-sm font-bold sm:font-semibold text-ink transition active:scale-95 hover:bg-ink/5"
                >
                  {t.home.explore}
                </Link>
              </>
            )}
          </div>

          {user && (
            <div className="mx-auto mt-6 grid w-full max-w-3xl gap-4 sm:grid-cols-4">
              {[
                { label: "Слова", value: user.stats.wordsStudied },
                { label: "Сесії", value: user.stats.sessions },
                { label: "Тести", value: user.stats.testsTaken },
                { label: "Балів", value: user.stats.points }
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-ink/10 bg-paper/80 px-4 py-3 text-center shadow-soft"
                >
                  <div className="text-xs uppercase tracking-[0.3em] text-ink/40 font-semibold">
                    {item.label}
                  </div>
                  <div className="mt-2 text-2xl font-bold text-ink">{item.value}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* AI Features Grid */}
      <section className="mt-20 sm:mt-24">
        <div className="mb-10 sm:mb-8 text-center px-4">
          <p className="text-xs sm:text-xs uppercase tracking-[0.3em] text-ink/50 font-bold">{t.home.aiFeatures}</p>
          <h2 className="mt-3 text-3xl sm:text-3xl font-bold">{t.home.aiExercises}</h2>
        </div>

        <div className="grid gap-5 sm:gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
              className="group rounded-3xl sm:rounded-3xl border border-ink/10 bg-paper/70 p-7 sm:p-6 shadow-soft transition active:scale-[0.98] hover:border-ink/20 hover:shadow-md"
            >
              <div className={`inline-flex h-14 w-14 sm:h-12 sm:w-12 items-center justify-center rounded-2xl ${card.tone} transition group-hover:scale-110`}>
                <card.icon size={28} weight="bold" className="sm:w-6 sm:h-6" />
              </div>
              <h3 className="mt-5 sm:mt-4 text-xl sm:text-lg font-bold sm:font-semibold leading-snug">{card.title}</h3>
              <p className="mt-3 sm:mt-2 text-base sm:text-sm text-ink/60 leading-relaxed">{card.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Stats & CTA Section */}
      <section className="mt-20 sm:mt-24 grid gap-6 sm:gap-8 lg:grid-cols-2">
        {/* Stats Panel */}
        <div className="rounded-[32px] border border-ink/10 bg-paper/80 p-6 sm:p-8 shadow-soft">
          <div className="pattern-grid rounded-2xl border border-ink/5 p-6 sm:p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-ink/40 font-bold">{t.home.snapshot}</p>
            <div className="mt-8 sm:mt-6 grid gap-5 sm:gap-4">
              <div className="flex items-center justify-between">
                <span className="text-base sm:text-sm text-ink/60 font-medium">{t.home.verbs}</span>
                <span className="text-3xl sm:text-2xl font-bold">{stats.verbs}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-base sm:text-sm text-ink/60 font-medium">{t.home.adverbs}</span>
                <span className="text-3xl sm:text-2xl font-bold">{stats.adverbs}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-base sm:text-sm text-ink/60 font-medium">{t.home.adjectives}</span>
                <span className="text-3xl sm:text-2xl font-bold">{stats.adjectives}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-base sm:text-sm text-ink/60 font-medium">{t.home.tests}</span>
                <span className="text-3xl sm:text-2xl font-bold">{stats.tests}</span>
              </div>
            </div>
            <div className="mt-6 rounded-2xl bg-fog/70 p-5 sm:p-4 text-sm sm:text-xs text-ink/70 leading-relaxed">
              {t.home.snapshotHint}
            </div>
          </div>
        </div>

        {/* AI Features Highlights */}
        <div className="space-y-5 sm:space-y-4">
          <div className="rounded-3xl border border-moss/20 bg-moss/5 p-7 sm:p-6 shadow-soft">
            <div className="flex items-start gap-5 sm:gap-4">
              <div className="inline-flex h-14 w-14 sm:h-12 sm:w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-moss/20 text-moss">
                <Brain size={28} weight="fill" className="sm:w-6 sm:h-6" />
              </div>
              <div>
                <h3 className="text-xl sm:text-lg font-bold sm:font-semibold text-moss leading-snug">{t.home.aiPersonalized}</h3>
                <p className="mt-2 sm:mt-1 text-base sm:text-sm text-ink/70 leading-relaxed">
                  AI аналізує твій рівень і пропонує вправи, які підходять саме тобі
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-terracotta/20 bg-terracotta/5 p-7 sm:p-6 shadow-soft">
            <div className="flex items-start gap-5 sm:gap-4">
              <div className="inline-flex h-14 w-14 sm:h-12 sm:w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-terracotta/20 text-terracotta">
                <Lightning size={28} weight="fill" className="sm:w-6 sm:h-6" />
              </div>
              <div>
                <h3 className="text-xl sm:text-lg font-bold sm:font-semibold text-terracotta leading-snug">{t.home.aiRealtime}</h3>
                <p className="mt-2 sm:mt-1 text-base sm:text-sm text-ink/70 leading-relaxed">
                  Миттєва перевірка відповідей та детальний feedback від AI
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-gold/30 bg-gold/5 p-7 sm:p-6 shadow-soft">
            <div className="flex items-start gap-5 sm:gap-4">
              <div className="inline-flex h-14 w-14 sm:h-12 sm:w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-gold/30 text-terracotta">
                <Target size={28} weight="fill" className="sm:w-6 sm:h-6" />
              </div>
              <div>
                <h3 className="text-xl sm:text-lg font-bold sm:font-semibold text-ink leading-snug">{t.home.aiChecking}</h3>
                <p className="mt-2 sm:mt-1 text-base sm:text-sm text-ink/70 leading-relaxed">
                  AI перевіряє граматику, вокабуляр та стиль твоїх відповідей
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Traditional Features */}
      <section className="mt-20 sm:mt-24">
        <div className="mb-10 sm:mb-8 text-center px-4">
          <h2 className="text-3xl sm:text-3xl font-bold">Додаткові можливості</h2>
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
              className="rounded-3xl border border-ink/10 bg-paper/70 p-7 sm:p-6 shadow-soft transition active:scale-[0.98]"
            >
              <div className="flex items-center gap-4 sm:gap-3">
                <span className={`inline-flex h-12 w-12 sm:h-10 sm:w-10 items-center justify-center rounded-2xl ${card.tone}`}>
                  <card.icon size={24} weight="bold" className="sm:w-5 sm:h-5" />
                </span>
                <h3 className="text-2xl sm:text-xl font-bold sm:font-semibold leading-tight">{card.title}</h3>
              </div>
              <p className="mt-4 sm:mt-2 text-base sm:text-sm text-ink/60 leading-relaxed">{card.text}</p>
              <Link
                href={card.href as Route}
                className="mt-5 sm:mt-4 inline-flex rounded-full border-2 border-ink/20 px-6 py-3 sm:px-4 sm:py-2 text-sm sm:text-xs font-bold sm:font-semibold text-ink transition active:scale-95 hover:bg-ink/5"
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
      <section className="mt-20 sm:mt-24 rounded-3xl sm:rounded-[32px] border border-ink/10 bg-gradient-to-br from-moss/5 to-terracotta/5 p-10 sm:p-10 md:p-12 text-center shadow-soft">
        <Sparkle size={48} weight="fill" className="mx-auto text-gold sm:w-12 sm:h-12" />
        <h2 className="mt-6 sm:mt-4 text-3xl sm:text-3xl font-bold leading-tight">Готовий почати?</h2>
        <p className="mt-3 sm:mt-2 text-base sm:text-base text-ink/70 leading-relaxed px-4">Приєднуйся до тисяч студентів, які вже вчаться з AI</p>
        <Link
          href="/register"
          className="mt-8 sm:mt-6 inline-flex items-center justify-center gap-2.5 rounded-full bg-ink px-10 py-4 sm:px-8 sm:py-3 text-base sm:text-sm font-bold sm:font-semibold text-paper shadow-soft transition active:scale-95 hover:bg-ink/90 w-full sm:w-auto max-w-xs mx-auto"
        >
          <Lightning size={20} weight="fill" className="sm:w-[18px] sm:h-[18px]" />
          {t.home.start}
        </Link>
      </section>
    </main>
  );
}
