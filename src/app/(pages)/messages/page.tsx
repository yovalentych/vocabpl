import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth";
import MessagesPage from "@/components/messages/MessagesPage";

export default async function Page() {
  const user = await getAuthUser();
  if (!user) {
    redirect("/login");
  }

  return <MessagesPage userId={user.id} username={user.username} />;
}
