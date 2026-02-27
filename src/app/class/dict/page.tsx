import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth";
import DictLanding from "@/components/dict/DictLanding";

export const metadata: Metadata = {
  title: "Польсько-український словник — 1500+ слів з вимовою та прикладами",
  description:
    "Інтерактивний польсько-український словник з транскрипцією, аудіо вимовою, прикладами використання та AI тренажером. Дієслова, прикметники, видові пари, сленг. Вивчай польські слова ефективно з Polish Vocab Studio.",
  keywords: [
    "польсько-український словник",
    "polski słownik ukraiński",
    "польські слова з перекладом",
    "вимова польських слів",
    "дієслова польською",
    "видові пари польська",
    "польський сленг",
    "словник польської мови онлайн",
    "тренажер польських слів"
  ],
  openGraph: {
    title: "Польсько-український словник — 1500+ слів",
    description:
      "Інтерактивний словник з транскрипцією, аудіо вимовою, прикладами та AI тренажером для запам'ятовування.",
    type: "website"
  }
};

export default async function DictPage() {
  const user = await getAuthUser();
  if (!user) {
    redirect("/login");
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-14">
      <DictLanding />
    </main>
  );
}
