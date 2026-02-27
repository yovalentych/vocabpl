import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth";
import { getDictionary } from "@/lib/i18n-server";
import TestsClient from "@/components/TestsClient";

export const metadata: Metadata = {
  title: "Тести з польської мови — перевірка знань лексики та граматики",
  description:
    "Онлайн тести з польської мови для перевірки знань: лексика, граматика, розуміння тексту. Різні рівні складності A1-B2. Миттєвий результат з детальними поясненнями помилок. Перевір свій рівень польської з Polish Vocab Studio.",
  keywords: [
    "тести з польської мови",
    "test z języka polskiego",
    "перевірка знань польської",
    "польська граматика тест",
    "рівень польської A1 A2 B1 B2",
    "онлайн тести польська",
    "лексика польської мови",
    "екзамен з польської"
  ],
  openGraph: {
    title: "Тести з польської мови — перевірка знань онлайн",
    description:
      "Онлайн тести з польської: лексика, граматика, розуміння тексту. Різні рівні складності з детальними поясненнями.",
    type: "website"
  }
};

export default async function TestsPage() {
  const user = await getAuthUser();
  if (!user) {
    redirect("/login");
  }
  const { t } = getDictionary();

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-14">
      <TestsClient />
    </main>
  );
}
