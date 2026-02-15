import { getServerLocale } from "@/lib/i18n-server";
import { legalContent } from "@/lib/legal-content";
import { getDb } from "@/lib/db";
import InfoPageLayout from "@/components/InfoPageLayout";

export const dynamic = "force-dynamic";

export default async function CookiesPage() {
  const locale = getServerLocale();
  const db = await getDb();
  const doc = await db.collection("settings").findOne({ key: "legal_content" });
  const content = doc?.value || legalContent;
  const t = locale === "uk" ? content.uk.cookies : content.pl.cookies;

  return (
    <InfoPageLayout
      label="Polish Vocab Studio"
      title={t.title}
      subtitle={locale === "uk" ? "Політика cookies" : "Polityka cookies"}
      updated={t.updated}
      body={
        <div className="space-y-4 text-sm sm:text-base text-ink/80">
          {t.body.map((item: string, index: number) => (
            <p key={index}>{item}</p>
          ))}
        </div>
      }
    />
  );
}
