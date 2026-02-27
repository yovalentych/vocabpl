import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth";
import { getDictionary } from "@/lib/i18n-server";
import WorkbookDashboard from "@/components/workbook/WorkbookDashboard";

export const metadata: Metadata = {
  title: "Робочий зошит — AI вправи з польської мови",
  description:
    "Інтерактивні AI вправи для вивчення польської: складання речень, переклад, парафраз, діалоги, опис сцен, історії. Персоналізовані завдання з миттєвою перевіркою та поясненнями. Вчи польську ефективно з Polish Vocab Studio.",
  keywords: [
    "вправи з польської мови",
    "AI вправи польська",
    "польська граматика вправи",
    "навчання польської онлайн",
    "інтерактивні завдання польська",
    "переклад українська польська",
    "діалоги польською мовою",
    "складання речень польською"
  ],
  openGraph: {
    title: "Робочий зошит — AI вправи з польської мови",
    description:
      "Інтерактивні AI вправи для вивчення польської: складання речень, переклад, парафраз, діалоги, опис сцен, історії.",
    type: "website"
  }
};

export default async function WorkbookPage() {
  const user = await getAuthUser();
  if (!user) {
    redirect("/login");
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-14">
      <WorkbookDashboard />
    </main>
  );
}
