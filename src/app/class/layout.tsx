import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth";

export default async function ClassLayout({ children }: { children: React.ReactNode }) {
  const user = await getAuthUser();
  if (!user) {
    redirect("/login");
  }
  return <>{children}</>;
}
