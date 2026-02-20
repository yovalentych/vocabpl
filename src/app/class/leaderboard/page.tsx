import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth";
import { getDictionary } from "@/lib/i18n-server";
import LeaderboardClient from "@/components/LeaderboardClient";

export const metadata: Metadata = {
  title: "Рейтинг",
  description: "Таблиця лідерів Polish Vocab Studio — порівнюйте свій прогрес з іншими учнями."
};

export default async function LeaderboardPage() {
  const user = await getAuthUser();
  if (!user) {
    redirect("/login");
  }
  const { t } = getDictionary();

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-14">
      <LeaderboardClient />
    </main>
  );
}
