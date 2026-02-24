import type { Metadata, Route } from "next";
import { BookOpenText, GlobeHemisphereWest, Sparkle, MaskHappy } from "@phosphor-icons/react/dist/ssr";
import { getServerLocale } from "@/lib/i18n-server";
import { requireCompendiumAccess } from "@/lib/compendium-access";
import CompendiumCarousel from "@/components/CompendiumCarousel";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Compendium",
  description: "Довідник з граматики, культури, фактів та корисних ресурсів."
};

const SECTIONS: Array<{
  id: string;
  href: Route;
  icon: typeof BookOpenText;
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
}> = [
  {
    id: "grammar",
    href: "/compendium/grammar",
    icon: BookOpenText,
    tone: "from-moss/15 via-paper to-moss/5",
    titleUk: "Граматика",
    titlePl: "Gramatyka",
    bodyUk: "Короткі правила, конструкції, приклади й підказки, щоб швидше впізнавати структури.",
    bodyPl: "Zbiór reguł, konstrukcji i przykładów do szybkiego rozpoznawania struktur.",
    detailUk:
      "Швидкий доступ до найважливіших правил: відмінки, часи, вид дієслова та базова логіка побудови речення.",
    detailPl:
      "Szybki доступ do najważniejszych reguł: przypadki, czasy i logika budowy zdań.",
    highlightsUk: [
      "Спринти з короткими підказками",
      "Правила з прикладами",
      "Маркерні слова для швидкого вибору відмінка",
      "Пояснення на рівні A1–B2"
    ],
    highlightsPl: [
      "Sprinty z krótkimi podpowiedziami",
      "Reguły z przykładami",
      "Słowa-markery dla przypadków",
      "Wyjaśnienia A1–B2"
    ],
    iconKey: "grammar"
  },
  {
    id: "sites",
    href: "/compendium/useful-sites",
    icon: GlobeHemisphereWest,
    tone: "from-terracotta/15 via-paper to-gold/10",
    titleUk: "Корисні сайти",
    titlePl: "Przydatne strony",
    bodyUk: "Перевірені ресурси, словники, тренажери та блоги для щоденної практики.",
    bodyPl: "Sprawdzone zasoby, słowniki i narzędzia do codziennej praktyki.",
    detailUk:
      "Підбірки за категоріями: словники, практика, медіа й спільноти. Кожен ресурс має короткий опис.",
    detailPl:
      "Zbiory według kategorii: słowniki, praktyka, media i społeczności.",
    highlightsUk: [
      "Фільтри за типом і рівнем",
      "Короткі описи та підказки",
      "Швидкі посилання",
      "Добірки для щоденної рутини"
    ],
    highlightsPl: [
      "Filtry według typu i poziomu",
      "Krótkie opisy i wskazówki",
      "Szybkie linki",
      "Zbiory do codziennej rutyny"
    ],
    iconKey: "sites"
  },
  {
    id: "facts",
    href: "/compendium/facts",
    icon: Sparkle,
    tone: "from-gold/15 via-paper to-moss/10",
    titleUk: "Цікаві факти",
    titlePl: "Ciekawe fakty",
    bodyUk: "Невеликі історії, контексти і деталі, що роблять польську культуру ближчою.",
    bodyPl: "Krótkie historie i ciekawostki, które przybliżają polską kulturę.",
    detailUk:
      "Формат коротких блоків для щоденного читання. Пояснюємо мову через історії, звички й контекст.",
    detailPl:
      "Krótkie bloki do codziennego czytania. Język przez historie i kontekst.",
    highlightsUk: [
      "1 факт = 1 блок",
      "Історичний і культурний контекст",
      "Пояснення термінів",
      "Рекомендоване читання"
    ],
    highlightsPl: [
      "1 fakt = 1 blok",
      "Kontekst historyczny i kulturowy",
      "Wyjaśnienia pojęć",
      "Polecane materiały"
    ],
    iconKey: "facts"
  },
  {
    id: "culture",
    href: "/compendium/culture",
    icon: MaskHappy,
    tone: "from-ink/10 via-paper to-moss/10",
    titleUk: "Культура",
    titlePl: "Kultura",
    bodyUk: "Сцена, традиції, міські ритми, поведінкові коди та сучасний контекст.",
    bodyPl: "Scena, tradycje, miejskie rytmy i współczesny kontekst.",
    detailUk:
      "Короткі гіди про етикет, місто, традиції та сучасну польську культуру, щоб краще розуміти мову.",
    detailPl:
      "Krótkie przewodniki o etykiecie, mieście i tradycjach.",
    highlightsUk: [
      "Етикет і звертання",
      "Міські ритми і побут",
      "Традиції та свята",
      "Сучасні культурні коди"
    ],
    highlightsPl: [
      "Etykieta i zwroty",
      "Rytm miast i codzienność",
      "Tradycje i święta",
      "Współczesne kody kultury"
    ],
    iconKey: "culture"
  }
];

export default async function CompendiumPage() {
  await requireCompendiumAccess();
  const locale = getServerLocale();
  const pick = (uk: string, pl: string) => (locale === "pl" && pl ? pl : uk);
  const sections = SECTIONS.map((section) => ({
    id: section.id,
    href: section.href,
    title: pick(section.titleUk, section.titlePl),
    body: pick(section.bodyUk, section.bodyPl),
    detail: pick(section.detailUk, section.detailPl),
    highlights: locale === "pl" ? section.highlightsPl : section.highlightsUk,
    tone: section.tone,
    icon: section.iconKey
  }));

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
        <CompendiumCarousel
          sections={sections}
          ctaLabel={locale === "pl" ? "Otwórz sekcję" : "Відкрити секцію"}
          autoplayLabel={locale === "pl" ? "Автоматичний перегляд" : "Автоперегляд"}
        />
      </section>
    </main>
  );
}
