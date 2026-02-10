import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth";
import StoryExercisePage from "@/components/workbook/exercises/story/StoryExercisePage";
import { WorkbookProvider } from "@/components/workbook/WorkbookContext";

export default async function StoryPage() {
  const user = await getAuthUser();
  if (!user) {
    redirect("/login");
  }

  return (
    <WorkbookProvider>
      <main className="mx-auto w-full max-w-4xl px-6 py-14">
        <StoryExercisePage />
      </main>
    </WorkbookProvider>
  );
}
