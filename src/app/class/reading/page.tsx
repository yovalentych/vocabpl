import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth";
import { getDictionary } from "@/lib/i18n-server";
import ReadingClient from "@/components/ReadingClient";

export default async function ReadingPage() {
  const user = await getAuthUser();
  if (!user) {
    redirect("/login");
  }
  const { t } = getDictionary();

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-14">
      <div className="mb-8 space-y-3">
        <h1 className="text-4xl font-semibold">{t.reading.title}</h1>
        <p className="text-sm text-ink/60">{t.reading.subtitle}</p>
      </div>
      <ReadingClient />
    </main>
  );
}
