import { getServerLocale } from "@/lib/i18n-server";
import { getDb } from "@/lib/db";
import { defaultContactContent } from "@/lib/contact-content";
import InfoPageLayout from "@/components/InfoPageLayout";
import { Envelope, Phone, TelegramLogo } from "@phosphor-icons/react/dist/ssr";

export const dynamic = "force-dynamic";

export default async function ContactsPage() {
  const locale = getServerLocale();
  const db = await getDb();
  const doc = await db.collection("settings").findOne({ key: "contact_content" });
  const content = doc?.value || defaultContactContent;

  const title = locale === "uk" ? content.titleUk : content.titlePl;
  const subtitle = locale === "uk" ? content.subtitleUk : content.subtitlePl;
  const lead = locale === "uk" ? content.leadUk : content.leadPl;
  const note = locale === "uk" ? content.noteUk : content.notePl;

  return (
    <InfoPageLayout
      label="Polish Vocab Studio"
      title={title}
      subtitle={subtitle}
      body={
        <div className="space-y-6 text-sm sm:text-base text-ink/80">
          <p>{lead}</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-ink/10 bg-paper/70 p-4">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-ink/50">
                <Envelope size={16} />
                Email
              </div>
              <a className="mt-2 inline-flex text-ink/80 underline underline-offset-4" href={`mailto:${content.email}`}>
                {content.email}
              </a>
            </div>
            {content.phone && (
              <div className="rounded-2xl border border-ink/10 bg-paper/70 p-4">
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-ink/50">
                  <Phone size={16} />
                  {locale === "uk" ? "Телефон" : "Telefon"}
                </div>
                <p className="mt-2 text-ink/80">{content.phone}</p>
              </div>
            )}
            {content.telegram && (
              <div className="rounded-2xl border border-ink/10 bg-paper/70 p-4">
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-ink/50">
                  <TelegramLogo size={16} />
                  Telegram
                </div>
                <p className="mt-2 text-ink/80">{content.telegram}</p>
              </div>
            )}
          </div>
          {note && (
            <div className="rounded-2xl border border-ink/10 bg-paper/60 px-4 py-3 text-xs text-ink/60">
              {note}
            </div>
          )}
        </div>
      }
    />
  );
}
