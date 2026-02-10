import { getAuthUser } from "@/lib/auth";
import MessagesClient from "@/components/MessagesClient";

export default async function MessagesPage() {
  const user = await getAuthUser();
  if (!user) {
    return (
      <main className="mx-auto w-full max-w-4xl px-6 py-12">
        <p className="text-sm text-ink/60">Unauthorized</p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-12">
      <MessagesClient />
    </main>
  );
}
