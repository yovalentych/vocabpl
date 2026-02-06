import StudyPanel from "@/components/StudyPanel";
import DeckSettings from "@/components/DeckSettings";
import { getDictionary } from "@/lib/i18n-server";
import { getAuthUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function StudyPage() {
  const user = await getAuthUser();
  if (!user) {
    redirect("/login");
  }
  const { t } = getDictionary();
  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-14">
      <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-6">
          <h1 className="text-4xl font-semibold">{t.study.title}</h1>
          <p className="text-sm text-ink/60">{t.study.subtitle}</p>
          <DeckSettings />
        </div>
        <div className="space-y-6">
          <StudyPanel />
        </div>
      </div>
    </main>
  );
}
