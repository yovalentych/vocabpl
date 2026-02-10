import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth";

export default async function DictMyWordsPage() {
  const user = await getAuthUser();
  if (!user) {
    redirect("/login");
  }

  // Redirect to browse with my_words filter
  redirect("/class/dict/browse?type=my_words");
}
