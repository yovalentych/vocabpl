import SentryTestClient from "@/components/SentryTestClient";
import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth";

export const metadata = {
  title: "Sentry Test"
};

export default async function SentryTestPage() {
  const auth = await getAuthUser();
  if (!auth || !auth.isAdmin) {
    redirect("/login");
  }
  return (
    <div className="min-h-[70vh] px-4 pb-16 pt-10">
      <SentryTestClient />
    </div>
  );
}
