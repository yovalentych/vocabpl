import type { Metadata } from "next";
import Link from "next/link";
import { BookOpenText, GlobeHemisphereWest, Sparkle, Theater } from "@phosphor-icons/react/dist/ssr";
import { getServerLocale } from "@/lib/i18n-server";
import { requireCompendiumAccess } from "@/lib/compendium-access";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Compendium",
  description: "Довідник з граматики, культури, фактів та корисних ресурсів."
};

const SECTIONS = [
  {
    id: "grammar",
    href: "/compendium/grammar",
    icon: BookOpenText,
    tone: "from-moss/15 via-paper to-moss/5",
    titleUk: "Граматика",
    titlePl: "Gramatyka",
    bodyUk: "Короткі правила, конструкції, приклади й підказки, щоб швидше впізнавати структури.",
    bodyPl: "Zbiór reguł, konstrukcji i przykładów do szybkiego rozpoznawania struktur."
  },
  {
    id: "sites",
    href: "/compendium/useful-sites",
    icon: GlobeHemisphereWest,
    tone: "from-terracotta/15 via-paper to-gold/10",
    titleUk: "Корисні сайти",
    titlePl: "Przydatne strony",
    bodyUk: "Перевірені ресурси, словники, тренажери та блоги для щоденної практики.",
    bodyPl: "Sprawdzone zasoby, słowniki i narzędzia do codziennej praktyki."
  },
  {
    id: "facts",
    href: "/compendium/facts",
    icon: Sparkle,
    tone: "from-gold/15 via-paper to-moss/10",
    titleUk: "Цікаві факти",
    titlePl: "Ciekawe fakty",
    bodyUk: "Невеликі історії, контексти і деталі, що роблять польську культуру ближчою.",
    bodyPl: "Krótkie historie i ciekawostki, które przybliżają polską kulturę."
  },
  {
    id: "culture",
    href: "/compendium/culture",
    icon: Theater,
    tone: "from-ink/10 via-paper to-moss/10",
    titleUk: "Культура",
    titlePl: "Kultura",
    bodyUk: "Сцена, традиції, міські ритми, поведінкові коди та сучасний контекст.",
    bodyPl: "Scena, tradycje, miejskie rytmy i współczesny kontekst."
  }
];

export default async function CompendiumPage() {
  await requireCompendiumAccess();
  const locale = getServerLocale();
  const pick = (uk: string, pl: string) => (locale === "pl" && pl ? pl : uk);

  return (
    <main className="mx-auto w-full max-w-6xl px-5 sm:px-6 py-10 sm:py-14 pb-24">
      <section className="rounded-[36px] border border-ink/10 bg-gradient-to-br from-ink/5 via-paper to-moss/10 p-8 sm:p-10 shadow-soft">
        <div className="text-xs uppercase tracking-[0.3em] text-ink/50">Compendium</div>
        <h1 className="mt-3 text-3xl sm:text-4xl font-semibold text-ink">
          {locale === "pl" ? "Kompendium PVS" : "Довідник PVS"}
        </h1>
        <p className="mt-3 text-sm sm:text-base text-ink/70 max-w-3xl">
          {locale === "pl"
            ? "Zbiór materiałów do szybkiej orientacji w języku, kulturze i praktyce. Wybierz sekcję, aby przejść do treści."
            : "Збірка матеріалів для швидкої орієнтації в мові, культурі та практиці. Обери секцію для переходу."}
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {SECTIONS.map((section) => {
            const Icon = section.icon;
            return (
              <Link
                key={section.id}
                href={section.href}
                className={`group relative overflow-hidden rounded-[28px] border border-ink/10 bg-gradient-to-br ${section.tone} p-6 shadow-soft transition hover:-translate-y-1`}
              >
                <div className="flex items-center justify-between">
                  <div className="rounded-full border border-ink/10 bg-paper/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-ink/60">
                    {pick(section.titleUk, section.titlePl)}
                  </div>
                  <Icon size={22} className="text-ink/60 transition group-hover:text-ink" />
                </div>
                <p className="mt-4 text-sm text-ink/70 leading-relaxed">
                  {pick(section.bodyUk, section.bodyPl)}
                </p>
                <div className="mt-5 inline-flex items-center gap-2 text-xs font-semibold text-ink/60">
                  {locale === "pl" ? "Otwórz sekcję" : "Відкрити секцію"}
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </main>
  );
}
