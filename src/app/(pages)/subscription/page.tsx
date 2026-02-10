import { getServerLocale } from "@/lib/i18n-server";
import { legalContent } from "@/lib/legal-content";

export default function SubscriptionPage() {
  const locale = getServerLocale();
  const t = locale === "uk" ? legalContent.uk.subscription : legalContent.pl.subscription;

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-12">
      <h1 className="text-3xl font-semibold">{t.title}</h1>
      <p className="mt-2 text-sm text-ink/60">{t.updated}</p>
      <div className="mt-6 space-y-4 text-sm text-ink/80">
        {t.body.map((item, index) => (
          <p key={index}>{item}</p>
        ))}
      </div>
    </main>
  );
}
