import { getAuthUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import AssignmentExercise from "@/components/classes/AssignmentExercise";

export const metadata = {
  title: "Exercise · Polish Vocab Studio",
  description: "Complete your assignment"
};

export default async function DoAssignmentPage({
  params
}: {
  params: { id: string; assignmentId: string };
}) {
  const auth = await getAuthUser();
  if (!auth) {
    redirect("/login?redirect=/classes");
  }

  return (
    <AssignmentExercise
      classId={params.id}
      assignmentId={params.assignmentId}
    />
  );
}
