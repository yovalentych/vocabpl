import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth";
import AuthPanel from "@/components/AuthPanel";

export default async function LoginPage() {
  const user = await getAuthUser();
  if (user) {
    redirect("/cabinet");
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-14">
      <AuthPanel />
    </main>
  );
}
