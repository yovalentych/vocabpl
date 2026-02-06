import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth";
import { getDictionary } from "@/lib/i18n-server";
import WorkbookClient from "@/components/WorkbookClient";

export default async function WorkbookPage() {
  const user = await getAuthUser();
  if (!user) {
    redirect("/login");
  }
  const { t } = getDictionary();

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-14">
      <div className="mb-8 space-y-3">
        <h1 className="text-4xl font-semibold">{t.workbook.title}</h1>
        <p className="text-sm text-ink/60">{t.workbook.subtitle}</p>
      </div>
      <WorkbookClient />
    </main>
  );
}
