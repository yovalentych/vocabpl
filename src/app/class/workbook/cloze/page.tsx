import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth";
import ClozeExercisePage from "@/components/workbook/exercises/cloze/ClozeExercisePage";

export default async function ClozePage() {
  const user = await getAuthUser();
  if (!user) {
    redirect("/login");
  }

  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-14">
      <ClozeExercisePage />
    </main>
  );
}
