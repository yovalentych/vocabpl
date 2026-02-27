import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle, Clock, Lightning, BookOpen, Lightbulb, Target, ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { getDictionary } from "@/lib/i18n-server";
import { loadCompendiumContent } from "@/lib/compendium-loader";
import { renderSimpleMarkdown } from "@/components/markdown";
import { requireCompendiumAccess } from "@/lib/compendium-access";
import TopicContentInteractive from "@/components/compendium/TopicContentInteractive";
import type { CompendiumSprint, CompendiumRule } from "@/lib/compendium-content";

export const dynamic = "force-dynamic";

interface PageProps {
  params: { topicId: string };
}

const DIFFICULTY_CONFIG = {
  A1: { label: "A1", color: "bg-moss/10 text-moss border-moss/30", emoji: "🌱", name: "Початковий" },
  A2: { label: "A2", color: "bg-gold/10 text-gold border-gold/30", emoji: "🌿", name: "Елементарний" },
  B1: { label: "B1", color: "bg-terracotta/10 text-terracotta border-terracotta/30", emoji: "🌳", name: "Середній" },
  B2: { label: "B2", color: "bg-ink/10 text-ink border-ink/30", emoji: "🎯", name: "Вище середнього" },
  C1: { label: "C1", color: "bg-moss/20 text-moss border-moss/40", emoji: "⭐", name: "Просунутий" }
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { t } = getDictionary();
  const all = await loadCompendiumContent();
  const topicId = params.topicId;

  // Find topic in sprints or rules
  const sprint = all.grammar.sprints.find(s => s.id === topicId);
  const rule = all.grammar.rules.find(r => r.id === topicId);
  const topic = sprint || rule;

  if (!topic) {
    return {
      title: "Topic Not Found",
      description: "Grammar topic not found"
    };
  }

  const title = "titleUk" in topic ? topic.titleUk : "";
  return {
    title: `${title} · Grammar · Compendium`,
    description: t.metadata.grammarDescription
  };
}

export default async function GrammarTopicPage({ params }: PageProps) {
  await requireCompendiumAccess();
  const { locale, t } = getDictionary();
  const pick = (uk: string | undefined, pl: string | undefined) => {
    if (!uk && !pl) return "";
    return (locale === "pl" && pl) ? pl : (uk || pl || "");
  };

  const all = await loadCompendiumContent();
  const topicId = params.topicId;

  // Find topic in sprints or rules
  const sprint = all.grammar.sprints.find(s => s.id === topicId);
  const rule = all.grammar.rules.find(r => r.id === topicId);
  const topic = sprint || rule;
  const topicType = sprint ? "sprint" : "rule";

  if (!topic) {
    notFound();
  }

  const difficulty = topic.difficulty ? DIFFICULTY_CONFIG[topic.difficulty] : null;

  // Find related topics
  const relatedTopicIds = ("relatedTopics" in topic && topic.relatedTopics) || ("relatedRules" in topic && topic.relatedRules) || [];
  const relatedTopics = relatedTopicIds
    .map(id => {
      const s = all.grammar.sprints.find(s => s.id === id);
      const r = all.grammar.rules.find(r => r.id === id);
      return s || r;
    })
    .filter(Boolean);

  // Find prev/next topics
  const allTopics = [...all.grammar.sprints, ...all.grammar.rules];
  const currentIndex = allTopics.findIndex(t => t.id === topicId);
  const prevTopic = currentIndex > 0 ? allTopics[currentIndex - 1] : null;
  const nextTopic = currentIndex < allTopics.length - 1 ? allTopics[currentIndex + 1] : null;

  return (
    <main className="mx-auto w-full max-w-5xl px-5 sm:px-6 py-10 sm:py-14 pb-24">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-ink/60">
        <Link href="/compendium" className="hover:text-ink transition-colors">
          Compendium
        </Link>
        <span>/</span>
        <Link href="/compendium/grammar" className="hover:text-ink transition-colors">
          {t.compendium.grammarLabel}
        </Link>
        <span>/</span>
        <span className="text-ink font-medium">{pick(topic.titleUk, topic.titlePl)}</span>
      </nav>

      {/* Hero Header */}
      <section className="relative overflow-hidden rounded-[32px] border border-moss/20 bg-gradient-to-br from-moss/10 via-paper to-gold/5 p-8 sm:p-10 shadow-soft mb-8">
        <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-moss/20 blur-3xl" />
        <div className="absolute -left-12 bottom-0 h-32 w-32 rounded-full bg-gold/20 blur-3xl" />

        <div className="relative z-10">
          {/* Back button */}
          <Link
            href="/compendium/grammar"
            className="inline-flex items-center gap-2 text-sm text-ink/60 hover:text-ink transition-colors mb-4 group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            {locale === "uk" ? "Назад до огляду" : "Powrót do przeglądu"}
          </Link>

          {/* Meta info */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            {difficulty && (
              <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-semibold ${difficulty.color}`}>
                <span>{difficulty.emoji}</span>
                {difficulty.label}
                <span className="text-xs font-normal opacity-75">· {locale === "uk" ? difficulty.name : difficulty.label}</span>
              </span>
            )}
            {"estimatedMinutes" in topic && topic.estimatedMinutes && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-ink/20 bg-paper/60 px-3 py-1.5 text-sm text-ink/70">
                <Clock size={14} weight="fill" />
                {topic.estimatedMinutes} {locale === "uk" ? "хв" : "min"}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/20 bg-gold/5 px-3 py-1.5 text-xs font-semibold text-gold uppercase tracking-wider">
              {topicType === "sprint" ? (
                <>
                  <Lightning size={12} weight="fill" />
                  {locale === "uk" ? "Спринт" : "Sprint"}
                </>
              ) : (
                <>
                  <BookOpen size={12} weight="fill" />
                  {locale === "uk" ? "Правило" : "Reguła"}
                </>
              )}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl font-bold text-ink mb-3">
            {pick(topic.titleUk, topic.titlePl)}
          </h1>

          {/* Short hint/body */}
          <div className="text-base text-ink/70 leading-relaxed max-w-3xl prose prose-base">
            {renderSimpleMarkdown(pick("hintUk" in topic ? topic.hintUk : topic.bodyUk, "hintPl" in topic ? topic.hintPl : topic.bodyPl))}
          </div>
        </div>
      </section>

      {/* Main Content - Interactive Component */}
      <TopicContentInteractive
        topic={topic}
        topicType={topicType}
        locale={locale}
        relatedTopics={relatedTopics as Array<CompendiumSprint | CompendiumRule>}
      />

      {/* Related Topics */}
      {relatedTopics.length > 0 && (
        <section className="mt-10 rounded-[28px] border border-ink/10 bg-paper/60 p-6 sm:p-8">
          <div className="flex items-center gap-2 mb-4">
            <Target size={20} className="text-moss" weight="fill" />
            <h2 className="text-xl font-bold text-ink">
              {locale === "uk" ? "Пов'язані теми" : "Powiązane tematy"}
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {relatedTopics.map((related) => {
              if (!related) return null;
              return (
                <Link
                  key={related.id}
                  href={`/compendium/grammar/${related.id}`}
                  className="group rounded-2xl border border-ink/10 bg-paper p-4 hover:border-moss/30 hover:bg-moss/5 transition-all"
                >
                  <h3 className="text-sm font-semibold text-ink group-hover:text-moss transition-colors">
                    {pick(related.titleUk, related.titlePl)}
                  </h3>
                  {related.difficulty && (
                    <span className="mt-2 inline-block text-xs text-ink/50">
                      {DIFFICULTY_CONFIG[related.difficulty].emoji} {DIFFICULTY_CONFIG[related.difficulty].label}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Bottom Navigation */}
      <div className="mt-10 flex items-center justify-between gap-4 pt-8 border-t border-ink/10">
        {prevTopic ? (
          <Link
            href={`/compendium/grammar/${prevTopic.id}`}
            className="group inline-flex items-center gap-2 rounded-full border border-ink/20 px-5 py-3 text-sm font-semibold text-ink hover:border-moss/40 hover:bg-moss/5 transition-all"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            <div className="text-left">
              <div className="text-xs text-ink/50">{locale === "uk" ? "Попередня тема" : "Poprzedni temat"}</div>
              <div>{pick(prevTopic.titleUk, prevTopic.titlePl)}</div>
            </div>
          </Link>
        ) : (
          <div />
        )}

        {nextTopic ? (
          <Link
            href={`/compendium/grammar/${nextTopic.id}`}
            className="group inline-flex items-center gap-2 rounded-full border border-moss/30 bg-moss/10 px-5 py-3 text-sm font-semibold text-moss hover:border-moss/50 hover:bg-moss/20 transition-all"
          >
            <div className="text-right">
              <div className="text-xs text-moss/70">{locale === "uk" ? "Наступна тема" : "Następny temat"}</div>
              <div>{pick(nextTopic.titleUk, nextTopic.titlePl)}</div>
            </div>
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        ) : (
          <div />
        )}
      </div>
    </main>
  );
}
