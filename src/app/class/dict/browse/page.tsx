import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth";
import DictBrowse from "@/components/dict/DictBrowse";

export default async function DictBrowsePage() {
  const user = await getAuthUser();
  if (!user) {
    redirect("/login");
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-14">
      <DictBrowse />
    </main>
  );
}
