import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth";
import DictLanding from "@/components/dict/DictLanding";

export default async function DictPage() {
  const user = await getAuthUser();
  if (!user) {
    redirect("/login");
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-14">
      <DictLanding />
    </main>
  );
}
