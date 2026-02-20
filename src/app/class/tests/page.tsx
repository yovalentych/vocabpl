import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth";
import { getDictionary } from "@/lib/i18n-server";
import TestsClient from "@/components/TestsClient";

export const metadata: Metadata = {
  title: "Тести",
  description:
    "Тести з польської мови для перевірки знань лексики, граматики та розуміння тексту."
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
