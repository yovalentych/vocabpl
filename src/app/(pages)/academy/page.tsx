import { getAuthUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import AcademyClient from "@/components/academy/AcademyClient";

export default async function AcademyPage() {
  const auth = await getAuthUser();

  if (!auth) {
    redirect("/login");
  }

  return <AcademyClient />;
}
