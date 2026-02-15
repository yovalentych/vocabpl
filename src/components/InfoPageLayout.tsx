import { ReactNode } from "react";
import { Sparkle } from "@phosphor-icons/react/dist/ssr";

type InfoPageLayoutProps = {
  label: string;
  title: string;
  subtitle?: string;
  updated?: string;
  body: ReactNode;
};

export default function InfoPageLayout({ label, title, subtitle, updated, body }: InfoPageLayoutProps) {
  return (
    <main className="mx-auto w-full max-w-6xl px-5 sm:px-6 py-10 sm:py-14 pb-24">
      <section className="relative overflow-hidden rounded-[32px] border border-ink/10 bg-gradient-to-br from-moss/10 via-paper to-terracotta/10 p-8 sm:p-10 shadow-soft">
        <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gold/20 blur-3xl" />
        <div className="absolute -left-12 bottom-0 h-28 w-28 rounded-full bg-moss/20 blur-3xl" />
        <div className="relative">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-ink/60">
            <Sparkle size={18} weight="fill" className="text-gold" />
            {label}
          </div>
          <h1 className="mt-3 text-3xl sm:text-4xl font-semibold text-ink">{title}</h1>
          {subtitle && <p className="mt-3 text-base sm:text-lg text-ink/70">{subtitle}</p>}
          {updated && <p className="mt-4 text-xs text-ink/50">{updated}</p>}
        </div>
      </section>

      <section className="mt-10 rounded-[28px] border border-ink/10 bg-paper/80 p-6 sm:p-8 shadow-soft">
        {body}
      </section>
    </main>
  );
}
