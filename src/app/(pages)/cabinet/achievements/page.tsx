import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth";
import CabinetAchievementsClient from "@/components/CabinetAchievementsClient";

export const dynamic = "force-dynamic";

export default async function CabinetAchievementsPage() {
  const user = await getAuthUser();
  if (!user) {
    redirect("/login");
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-14">
      <CabinetAchievementsClient />
    </main>
  );
}
