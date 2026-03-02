import { getAuthUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getDictionary } from "@/lib/i18n-server";
import PersonalScheduleClient from "@/components/PersonalScheduleClient";

export default async function PersonalSchedulePage() {
  const auth = await getAuthUser();

  if (!auth) {
    redirect("/login");
  }

  const { locale } = getDictionary();

  return <PersonalScheduleClient locale={locale} />;
}
