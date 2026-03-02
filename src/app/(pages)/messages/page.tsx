import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth";

export default async function MessagesPage() {
  const user = await getAuthUser();
  if (!user) {
    redirect("/login");
  }

  // Redirect to new notifications page with workbook category
  redirect("/notifications?category=workbook");
}
