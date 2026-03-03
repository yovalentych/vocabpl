import { getAuthUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import AcademyLayout from "@/components/academy/AcademyLayout";

export default async function AcademyPage() {
  const auth = await getAuthUser();

  if (!auth) {
    redirect("/login");
  }

  return <AcademyLayout />;
}
