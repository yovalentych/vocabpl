import { getServerLocale } from "@/lib/i18n-server";
import FeedbackModal from "@/components/FeedbackModal";
import Link from "next/link";

export default function Footer() {
  const locale = getServerLocale();
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-ink/10 bg-paper/85">
      <div className="mx-auto w-full max-w-6xl px-6 py-6">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-ink/60">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-semibold text-ink/80">Polish Vocab Studio</span>
            <span className="text-ink/40">v2.0.0</span>
            <span>© {year}</span>
            <span>·</span>
            <Link className="underline underline-offset-4" href="/legal?tab=terms">
              {locale === "uk" ? "Умови" : "Regulamin"}
            </Link>
            <span>·</span>
            <Link className="underline underline-offset-4" href="/legal?tab=privacy">
              {locale === "uk" ? "Політика" : "Polityka prywatności"}
            </Link>
            <span>·</span>
            <Link className="underline underline-offset-4" href="/legal?tab=subscription">
              {locale === "uk" ? "Оплата" : "Płatności"}
            </Link>
            <span>·</span>
            <Link className="underline underline-offset-4" href="/legal?tab=cookies">
              Cookies
            </Link>
            <span>·</span>
            <a className="underline underline-offset-4" href="mailto:jovalentych@gmail.com">
              {locale === "uk" ? "Контакти" : "Kontakt"}
            </a>
          </div>
          <FeedbackModal />
        </div>
        <p className="mt-3 text-[11px] text-ink/40">
          {locale === "uk"
            ? "Навчайся у своєму темпі. Кожен день — маленький прогрес."
            : "Ucz się we własnym tempie. Codziennie mały krok."}
        </p>
      </div>
    </footer>
  );
}
