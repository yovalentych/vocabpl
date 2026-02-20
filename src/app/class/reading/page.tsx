import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth";
import { getDictionary } from "@/lib/i18n-server";
import ReadingClient from "@/components/ReadingClient";

export const metadata: Metadata = {
  title: "Читання",
  description:
    "Читання польською мовою з перекладом, аудіо та вправами на розуміння тексту."
};

export default async function ReadingPage() {
  const user = await getAuthUser();
  if (!user) {
    redirect("/login");
  }
  const { t } = getDictionary();

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-14">
      <ReadingClient />
    </main>
  );
}
