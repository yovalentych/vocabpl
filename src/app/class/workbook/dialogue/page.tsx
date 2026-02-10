import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth";
import DialogueExercisePage from "@/components/workbook/exercises/dialogue/DialogueExercisePage";

export default async function DialoguePage() {
  const user = await getAuthUser();
  if (!user) {
    redirect("/login");
  }

  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-14">
      <DialogueExercisePage />
    </main>
  );
}
