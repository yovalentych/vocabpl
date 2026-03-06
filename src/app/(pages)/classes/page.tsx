import { getDictionary } from "@/lib/i18n-server";
import { getAuthUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import ClassesList from "@/components/classes/ClassesList";

export const metadata = {
  title: "Classes · Polish Vocab Studio",
  description: "Manage your classes and assignments"
};

export default async function ClassesPage() {
  const auth = await getAuthUser();
  if (!auth) {
    redirect("/login?redirect=/classes");
  }

  const { locale } = getDictionary();
  const isTeacher = auth.role === "tutor" || auth.role === "admin";

  return <ClassesList locale={locale} isTeacher={isTeacher} />;
}
