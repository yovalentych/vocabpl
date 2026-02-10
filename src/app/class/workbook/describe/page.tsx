import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth";
import DescribeExercisePage from "@/components/workbook/exercises/describe/DescribeExercisePage";
import { WorkbookProvider } from "@/components/workbook/WorkbookContext";

export default async function DescribePage() {
  const user = await getAuthUser();
  if (!user) {
    redirect("/login");
  }

  return (
    <WorkbookProvider>
      <main className="mx-auto w-full max-w-5xl px-6 py-14">
        <DescribeExercisePage />
      </main>
    </WorkbookProvider>
  );
}
