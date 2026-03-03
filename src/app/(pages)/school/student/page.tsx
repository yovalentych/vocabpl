import { getAuthUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import StudentDashboard from "@/components/school/StudentDashboard";

export const metadata = {
  title: "Панель учня · Polish Vocab Studio",
  description: "Мої класи та завдання"
};

export default async function StudentPage() {
  const auth = await getAuthUser();

  if (!auth) {
    redirect("/login");
  }

  return <StudentDashboard />;
}
