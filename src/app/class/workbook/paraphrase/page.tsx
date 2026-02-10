import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth";
import ParaphraseExercisePage from "@/components/workbook/exercises/paraphrase/ParaphraseExercisePage";
import { WorkbookProvider } from "@/components/workbook/WorkbookContext";

export default async function ParaphrasePage() {
  const user = await getAuthUser();
  if (!user) {
    redirect("/login");
  }

  return (
    <WorkbookProvider>
      <main className="mx-auto w-full max-w-4xl px-6 py-14">
        <ParaphraseExercisePage />
      </main>
    </WorkbookProvider>
  );
}
