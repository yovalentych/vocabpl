import { getDictionary } from "@/lib/i18n-server";
import { getAuthUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import AssignmentDetail from "@/components/classes/AssignmentDetail";

export const metadata = {
  title: "Assignment · Polish Vocab Studio",
  description: "Assignment details"
};

export default async function AssignmentDetailPage({
  params
}: {
  params: { id: string; assignmentId: string };
}) {
  const auth = await getAuthUser();
  if (!auth) {
    redirect("/login?redirect=/classes");
  }

  const { locale } = getDictionary();

  return (
    <AssignmentDetail
      classId={params.id}
      assignmentId={params.assignmentId}
      locale={locale}
    />
  );
}
