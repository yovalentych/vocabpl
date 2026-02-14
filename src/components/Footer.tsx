import { getServerLocale } from "@/lib/i18n-server";
import FeedbackModal from "@/components/FeedbackModal";
import Link from "next/link";

export default function Footer() {
  const locale = getServerLocale();
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-ink/10 bg-paper/85 backdrop-blur-sm">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 py-3 sm:py-6">
        <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3 text-xs text-ink/60">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-3">
            <span className="font-semibold text-ink/80">
              <span className="hidden sm:inline">Polish Vocab Studio</span>
              <span className="sm:hidden">PVS</span>
            </span>
            <span className="text-ink/40">v2.0.0</span>
            <span>© {year}</span>
            <span className="hidden sm:inline">·</span>
            <Link className="underline underline-offset-4" href="/legal?tab=terms">
              {locale === "uk" ? "Умови" : "Regulamin"}
            </Link>
            <span className="hidden sm:inline">·</span>
            <Link className="underline underline-offset-4" href="/legal?tab=privacy">
              {locale === "uk" ? "Політика" : "Polityka prywatności"}
            </Link>
            <span className="hidden sm:inline">·</span>
            <Link className="underline underline-offset-4" href="/legal?tab=subscription">
              {locale === "uk" ? "Оплата" : "Płatności"}
            </Link>
            <span className="hidden sm:inline">·</span>
            <Link className="underline underline-offset-4" href="/pvs">
              {locale === "uk" ? "Про PVS" : "O PVS"}
            </Link>
            <span className="hidden sm:inline">·</span>
            <Link className="underline underline-offset-4" href="/legal?tab=cookies">
              Cookies
            </Link>
            <span className="hidden sm:inline">·</span>
            <a className="underline underline-offset-4" href="mailto:jovalentych@gmail.com">
              {locale === "uk" ? "Контакти" : "Kontakt"}
            </a>
          </div>
          <FeedbackModal />
        </div>
        <p className="mt-2 sm:mt-3 text-[10px] sm:text-[11px] text-ink/40 hidden sm:block">
          {locale === "uk"
            ? "Навчайся у своєму темпі. Кожен день — маленький прогрес."
            : "Ucz się we własnym tempie. Codziennie mały krok."}
        </p>
      </div>
    </footer>
  );
}
