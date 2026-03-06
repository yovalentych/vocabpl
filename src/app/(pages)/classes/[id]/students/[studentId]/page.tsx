import { getDictionary } from "@/lib/i18n-server";
import { getAuthUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import StudentReportView from "@/components/classes/StudentReportView";

export const metadata = {
  title: "Student Report · Polish Vocab Studio",
};

export default async function StudentReportPage({
  params,
}: {
  params: { id: string; studentId: string };
}) {
  const auth = await getAuthUser();
  if (!auth) {
    redirect(`/login?redirect=/classes/${params.id}`);
  }

  const { locale } = getDictionary();

  return (
    <StudentReportView
      classId={params.id}
      studentId={params.studentId}
      locale={locale}
    />
  );
}
