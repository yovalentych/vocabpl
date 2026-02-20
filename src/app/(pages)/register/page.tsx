import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth";
import AuthPanel from "@/components/AuthPanel";

export const metadata: Metadata = {
  title: "Реєстрація",
  description:
    "Створіть безкоштовний акаунт Polish Vocab Studio та почніть вивчати польську мову з AI вправами, словником і тестами."
};

export default async function RegisterPage() {
  const user = await getAuthUser();
  if (user) {
    redirect("/cabinet");
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-14">
      <AuthPanel initialMode="register" />
    </main>
  );
}
