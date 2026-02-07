import { getServerLocale } from "@/lib/i18n-server";
import FeedbackModal from "@/components/FeedbackModal";

export default function Footer() {
  const locale = getServerLocale();
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-ink/10 bg-paper/60">
      <div className="mx-auto w-full max-w-6xl px-6 py-6">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-ink/60">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-semibold text-ink/80">Polish Vocab Studio</span>
            <span>© {year}</span>
            <span>·</span>
            <a className="underline underline-offset-4" href="#">
              {locale === "uk" ? "Умови" : "Regulamin"}
            </a>
            <span>·</span>
            <a className="underline underline-offset-4" href="#">
              {locale === "uk" ? "Політика" : "Polityka prywatności"}
            </a>
            <span>·</span>
            <a className="underline underline-offset-4" href="#">
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
