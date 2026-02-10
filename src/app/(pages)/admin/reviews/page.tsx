import { getAuthUser } from "@/lib/auth";
import AdminReviewsClient from "@/components/AdminReviewsClient";

export const dynamic = 'force-dynamic';

export default async function AdminReviewsPage() {
  const user = await getAuthUser();
  if (!user || !user.isAdmin) {
    return (
      <main className="mx-auto w-full max-w-4xl px-6 py-12">
        <p className="text-sm text-ink/60">Unauthorized</p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-12">
      <AdminReviewsClient />
    </main>
  );
}
