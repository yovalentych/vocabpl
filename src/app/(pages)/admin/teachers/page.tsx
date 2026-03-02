import { getAuthUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminTeachersClient from "@/components/admin/AdminTeachersClient";

export default async function AdminTeachersPage() {
  const auth = await getAuthUser();

  if (!auth || auth.role !== "admin") {
    redirect("/");
  }

  return <AdminTeachersClient />;
}
