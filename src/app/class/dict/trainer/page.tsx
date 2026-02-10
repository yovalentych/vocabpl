import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export default async function DictTrainerPage() {
  const user = await getAuthUser();
  if (!user) {
    redirect("/login");
  }

  // Redirect to browse page - trainer is integrated there
  redirect("/class/dict/browse");
}
