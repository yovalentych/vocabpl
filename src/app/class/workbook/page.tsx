import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth";
import { getDictionary } from "@/lib/i18n-server";
import WorkbookDashboard from "@/components/workbook/WorkbookDashboard";

export default async function WorkbookPage() {
  const user = await getAuthUser();
  if (!user) {
    redirect("/login");
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-14">
      <WorkbookDashboard />
    </main>
  );
}
