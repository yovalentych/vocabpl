import WordsList from "@/components/WordsList";
import { getDictionary } from "@/lib/i18n-server";
import { getAuthUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DeckPage() {
  const user = await getAuthUser();
  if (!user) {
    redirect("/login");
  }
  const { t } = getDictionary();
  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-14">
      <div className="mb-8 space-y-3">
        <h1 className="text-4xl font-semibold">{t.deck.title}</h1>
        <p className="text-sm text-ink/60">{t.deck.subtitle}</p>
      </div>
      <WordsList />
    </main>
  );
}
