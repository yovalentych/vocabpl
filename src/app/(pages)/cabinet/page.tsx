import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth";
import CabinetClient from "@/components/CabinetClient";

export default async function CabinetPage() {
  const user = await getAuthUser();
  if (!user) {
    redirect("/login");
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-14">
      <CabinetClient username={user.username} />
    </main>
  );
}
