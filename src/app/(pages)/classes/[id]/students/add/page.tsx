import { getDictionary } from "@/lib/i18n-server";
import { getAuthUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import AddStudentPage from "@/components/classes/AddStudentPage";

export const metadata = {
  title: "Add Student · Polish Vocab Studio",
  description: "Add a student to your class"
};

export default async function AddStudentServerPage({
  params
}: {
  params: { id: string };
}) {
  const auth = await getAuthUser();
  if (!auth) {
    redirect("/login?redirect=/classes");
  }

  const { locale } = getDictionary();

  return <AddStudentPage classId={params.id} locale={locale} />;
}
