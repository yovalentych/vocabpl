import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth";
import { getDictionary } from "@/lib/i18n-server";
import VocabularyPage from "@/components/VocabularyPage";

export const metadata = {
  title: "Мій словник · Polish Vocab Studio",
};

export default async function Page() {
  const user = await getAuthUser();
  if (!user) redirect("/login?redirect=/vocabulary");

  const { locale } = getDictionary();
  return <VocabularyPage locale={locale} />;
}
