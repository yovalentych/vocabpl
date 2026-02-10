import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth";
import SentencesExercisePage from "@/components/workbook/exercises/sentences/SentencesExercisePage";

export default async function SentencesPage() {
  const user = await getAuthUser();
  if (!user) {
    redirect("/login");
  }

  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-14">
      <SentencesExercisePage />
    </main>
  );
}
