import { getAuthUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import AcademyLayout from "@/components/academy/AcademyLayout";

export const metadata = {
  title: "Панель вчителя · Polish Vocab Studio",
  description: "Управління класами та завданнями"
};

export default async function TeacherPage() {
  const auth = await getAuthUser();

  if (!auth) {
    redirect("/login");
  }

  // Check if user is a teacher
  if (auth.role !== "tutor" && auth.role !== "admin") {
    redirect("/school");
  }

  return <AcademyLayout />;
}
