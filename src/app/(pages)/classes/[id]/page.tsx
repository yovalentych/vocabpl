import { getDictionary } from "@/lib/i18n-server";
import { getAuthUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import ClassDetailOptimized from "@/components/classes/ClassDetailOptimized";

export const metadata = {
  title: "Class · Polish Vocab Studio",
  description: "Class details and management"
};

export default async function ClassDetailPage({
  params
}: {
  params: { id: string };
}) {
  const auth = await getAuthUser();
  if (!auth) {
    redirect("/login?redirect=/classes");
  }

  const { locale } = getDictionary();

  return <ClassDetailOptimized classId={params.id} locale={locale} />;
}
