import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth";
import { getDictionary } from "@/lib/i18n-server";
import Link from "next/link";
import SchoolContextPanel from "@/components/SchoolContextPanel";
import type { Route } from "next";
import {
  Sparkle,
  PencilLine,
  Target,
  PuzzlePiece,
  Translate,
  ChatCircle,
  NotePencil,
  Article,
  BookBookmark,
  TestTube,
  BookOpen,
  Trophy,
  ChartLineUp,
  Lightning,
  RankingIcon,
  CalendarBlank,
  Shuffle
} from "@phosphor-icons/react/dist/ssr";
import { getDb } from "@/lib/db";
import { ObjectId } from "mongodb";

async function getUserStats(userId: string) {
  const db = await getDb();
  const userObjectId = new ObjectId(userId);

  try {
    const [attemptsCount, totalPoints, aiAttemptsCount, recentAttempts, activityDays] = await Promise.all([
      // Total attempts
      db.collection("exercise_attempts").countDocuments({ userId: userObjectId }),

      // Total points
      db.collection("exercise_attempts")
        .aggregate([
          { $match: { userId: userObjectId } },
          { $group: { _id: null, total: { $sum: "$points" } } }
        ])
        .toArray()
        .then((r) => r[0]?.total || 0),

      // AI attempts count (exercises that used AI)
      db.collection("exercise_attempts").countDocuments({
        userId: userObjectId,
        type: { $in: ["sentences", "cloze", "match", "translate", "dialogue", "paraphrase", "story", "describe"] }
      }),

      // Recent attempts
      db.collection("exercise_attempts")
        .find({ userId: userObjectId })
        .sort({ createdAt: -1 })
        .limit(5)
        .toArray(),

      // Activity heatmap data (last 90 days)
      db.collection("exercise_attempts")
        .aggregate([
          {
            $match: {
              userId: userObjectId,
              createdAt: { $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) }
            }
          },
          {
            $group: {
              _id: {
                $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
              },
              count: { $sum: 1 }
            }
          }
        ])
        .toArray()
    ]);

    // Create activity heatmap
    const activityMap = new Map();
    activityDays.forEach((day: any) => {
      activityMap.set(day._id, day.count);
    });

    return {
      attemptsCount,
      totalPoints: Math.round(totalPoints),
      aiAttemptsCount,
      recentAttempts,
      activityMap
    };
  } catch (error) {
    return {
      attemptsCount: 0,
      totalPoints: 0,
      aiAttemptsCount: 0,
      recentAttempts: [],
      activityMap: new Map()
    };
  }
}

// Random exercise picker
const AI_EXERCISES = [
  { name: "sentences", href: "/class/workbook/sentences" },
  { name: "cloze", href: "/class/workbook/cloze" },
  { name: "match", href: "/class/workbook/match" },
  { name: "translate", href: "/class/workbook/translate" },
  { name: "dialogue", href: "/class/workbook/dialogue" },
  { name: "paraphrase", href: "/class/workbook/paraphrase" },
  { name: "story", href: "/class/workbook/story" },
  { name: "describe", href: "/class/workbook/describe" }
];

export default async function ClassDashboard() {
  const user = await getAuthUser();
  if (!user) {
    redirect("/login");
  }

  const { t, locale } = getDictionary();
  const stats = await getUserStats(user.id);

  // Pick random exercise for empty state
  const randomExercise = AI_EXERCISES[Math.floor(Math.random() * AI_EXERCISES.length)];

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-14">
      {/* Welcome Banner */}
      <section className="relative overflow-hidden rounded-[32px] border border-ink/10 bg-gradient-to-br from-moss/10 to-terracotta/10 p-8 shadow-soft">
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gold/20 blur-3xl" />
        <div className="relative">
          <div className="flex items-center gap-2">
            <Sparkle size={24} weight="fill" className="text-gold" />
            <p className="text-xs uppercase tracking-[0.3em] text-ink/60">{t.dashboard.aiPowered}</p>
          </div>
          <h1 className="mt-2 text-4xl font-semibold">
            {t.dashboard.welcome}, {user.username}!
          </h1>
          <p className="mt-2 text-ink/70">{t.dashboard.continueWhere}</p>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-moss/20 bg-moss/5 p-4">
              <div className="flex items-center gap-2">
                <Trophy size={20} weight="fill" className="text-moss" />
                <span className="text-xs uppercase tracking-[0.2em] text-ink/60">{t.dashboard.pointsEarned}</span>
              </div>
              <p className="mt-1 text-2xl font-semibold text-moss">{stats.totalPoints}</p>
            </div>

            <div className="rounded-2xl border border-terracotta/20 bg-terracotta/5 p-4">
              <div className="flex items-center gap-2">
                <ChartLineUp size={20} weight="fill" className="text-terracotta" />
                <span className="text-xs uppercase tracking-[0.2em] text-ink/60">{t.dashboard.exercisesCompleted}</span>
              </div>
              <p className="mt-1 text-2xl font-semibold text-terracotta">{stats.attemptsCount}</p>
            </div>

            <div className="rounded-2xl border border-gold/30 bg-gold/5 p-4">
              <div className="flex items-center gap-2">
                <Sparkle size={20} weight="fill" className="text-gold" />
                <span className="text-xs uppercase tracking-[0.2em] text-ink/60">{t.dashboard.aiUsageStats}</span>
              </div>
              <p className="mt-1 text-2xl font-semibold text-ink">{stats.aiAttemptsCount}</p>
            </div>
          </div>
        </div>
      </section>

      {/* AI Quick Start */}
      <section className="mt-16">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold">{t.dashboard.aiExercises}</h2>
            <p className="mt-1 text-sm text-ink/60">{t.dashboard.chooseExercise}</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              title: t.home.aiCards.sentences,
              href: "/class/workbook/sentences",
              icon: PencilLine,
              tone: "bg-moss/10 text-moss border-moss/20"
            },
            {
              title: t.home.aiCards.cloze,
              href: "/class/workbook/cloze",
              icon: Target,
              tone: "bg-gold/10 text-gold border-gold/20"
            },
            {
              title: t.home.aiCards.match,
              href: "/class/workbook/match",
              icon: PuzzlePiece,
              tone: "bg-terracotta/10 text-terracotta border-terracotta/20"
            },
            {
              title: t.home.aiCards.translate,
              href: "/class/workbook/translate",
              icon: Translate,
              tone: "bg-moss/10 text-moss border-moss/20"
            },
            {
              title: t.home.aiCards.dialogue,
              href: "/class/workbook/dialogue",
              icon: ChatCircle,
              tone: "bg-gold/10 text-gold border-gold/20"
            },
            {
              title: t.home.aiCards.paraphrase,
              href: "/class/workbook/paraphrase",
              icon: NotePencil,
              tone: "bg-terracotta/10 text-terracotta border-terracotta/20"
            },
            {
              title: t.home.aiCards.story,
              href: "/class/workbook/story",
              icon: Article,
              tone: "bg-moss/10 text-moss border-moss/20"
            },
            {
              title: t.dashboard.describeImage,
              href: "/class/workbook/describe",
              icon: BookOpen,
              tone: "bg-gold/10 text-gold border-gold/20"
            }
          ].map((item, idx) => (
            <Link
              key={idx}
              href={item.href as Route}
              className={`group rounded-3xl border p-6 shadow-soft transition hover:shadow-md ${item.tone}`}
            >
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-paper transition group-hover:scale-110">
                <item.icon size={24} weight="bold" className={item.tone.split(' ')[1]} />
              </div>
              <h3 className="mt-4 text-lg font-semibold">{item.title}</h3>
              <div className="mt-2 flex items-center gap-1 text-sm opacity-70">
                <span>{t.dashboard.practice}</span>
                <span className="transition group-hover:translate-x-1">→</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Traditional Features + Leaderboard + Activity */}
      <section className="mt-16">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold">{t.dashboard.mainSections}</h2>
        </div>

        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
          {[
            {
              title: t.home.cards.dictionary,
              text: t.dashboard.dictDesc,
              href: "/class/dict",
              icon: BookBookmark,
              tone: "bg-terracotta/10 text-terracotta"
            },
            {
              title: t.home.cards.tests,
              text: t.dashboard.testsDesc,
              href: "/class/tests",
              icon: TestTube,
              tone: "bg-moss/10 text-moss"
            },
            {
              title: t.home.cards.reading,
              text: t.dashboard.readingDesc,
              href: "/class/reading",
              icon: BookOpen,
              tone: "bg-gold/20 text-gold"
            },
            {
              title: t.dashboard.leaderboard,
              text: t.dashboard.leaderboardDesc,
              href: "/class/leaderboard",
              icon: RankingIcon,
              tone: "bg-moss/10 text-moss"
            },
            {
              title: "Активність",
              text: "Переглянь свій прогрес за останні місяці",
              href: "/cabinet#activity",
              icon: CalendarBlank,
              tone: "bg-terracotta/10 text-terracotta"
            }
          ].map((card) => (
            <Link
              key={card.title}
              href={card.href as Route}
              className="group rounded-3xl border border-ink/10 bg-paper/70 p-6 shadow-soft transition hover:border-ink/20 hover:shadow-md"
            >
              <div className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl ${card.tone}`}>
                <card.icon size={24} weight="bold" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">{card.title}</h3>
              <p className="mt-2 text-xs text-ink/60">{card.text}</p>
              <div className="mt-3 flex items-center gap-1 text-sm font-semibold text-terracotta">
                <span>{t.dashboard.open}</span>
                <span className="transition group-hover:translate-x-1">→</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* School Context Panel */}
      <SchoolContextPanel locale={locale} />

      {/* Recent Activity */}
      {stats.recentAttempts.length > 0 && (
        <section className="mt-16">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold">{t.dashboard.recentActivity}</h2>
          </div>

          <div className="rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft">
            <div className="space-y-3">
              {stats.recentAttempts.map((attempt: any, idx: number) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-2xl border border-ink/5 bg-fog/50 p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-moss/10 text-moss">
                      <Sparkle size={20} weight="fill" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold capitalize">{attempt.type || "Exercise"}</p>
                      <p className="text-xs text-ink/60">
                        {attempt.timestamp
                          ? new Date(attempt.timestamp).toLocaleDateString("uk-UA", {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit"
                            })
                          : "Recently"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Trophy size={16} weight="fill" className="text-gold" />
                    <span className="text-sm font-semibold text-moss">
                      +{Math.round(attempt.points || 0)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Empty State - Random Exercise */}
      {stats.attemptsCount === 0 && (
        <section className="mt-16">
          <div className="rounded-[32px] border border-ink/10 bg-paper/80 p-12 text-center shadow-soft">
            <Shuffle size={48} weight="fill" className="mx-auto text-gold" />
            <h3 className="mt-4 text-2xl font-semibold">{t.dashboard.noActivityTitle}</h3>
            <p className="mt-2 text-ink/70">{t.dashboard.startFirstExercise}</p>
            <Link
              href={randomExercise.href as Route}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-ink px-8 py-3 text-sm font-semibold text-paper shadow-soft transition hover:bg-ink/90"
            >
              <Shuffle size={18} weight="fill" />
              {t.dashboard.randomExercise}
            </Link>
          </div>
        </section>
      )}
    </main>
  );
}
