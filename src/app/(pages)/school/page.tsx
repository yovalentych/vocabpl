import { getAuthUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import SchoolWelcome from "@/components/school/SchoolWelcome";

export const metadata = {
  title: "Школа · Polish Vocab Studio",
  description: "Навчальна платформа для вчителів та учнів"
};

export default async function SchoolPage() {
  const auth = await getAuthUser();

  if (!auth) {
    redirect("/login");
  }

  return <SchoolWelcome />;
}
