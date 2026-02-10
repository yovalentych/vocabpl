import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth";
import TranslateExercisePage from "@/components/workbook/exercises/translate/TranslateExercisePage";

export default async function TranslatePage() {
  const user = await getAuthUser();
  if (!user) {
    redirect("/login");
  }

  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-14">
      <TranslateExercisePage />
    </main>
  );
}
