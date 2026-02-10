import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth";
import MatchExercisePage from "@/components/workbook/exercises/match/MatchExercisePage";

export default async function MatchPage() {
  const user = await getAuthUser();
  if (!user) {
    redirect("/login");
  }

  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-14">
      <MatchExercisePage />
    </main>
  );
}
