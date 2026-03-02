import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth";
import NotificationCenterClient from "@/components/NotificationCenterClient";

export default async function NotificationsPage() {
  const auth = await getAuthUser();

  if (!auth) {
    redirect("/login");
  }

  return <NotificationCenterClient />;
}
