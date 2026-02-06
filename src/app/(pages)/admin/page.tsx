import { getDb } from "@/lib/db";
import { getDictionary } from "@/lib/i18n-server";
import { getAuthUser } from "@/lib/auth";
import type { Test } from "@/lib/types";
import { redirect } from "next/navigation";
import AdminDashboard from "@/components/AdminDashboard";

async function getSummary() {
  const db = await getDb();
  const [verbs, adverbs, adjectives, tests] = await Promise.all([
    db.collection("words").countDocuments({ type: "verb" }),
    db.collection("words").countDocuments({ type: "adverb" }),
    db.collection("words").countDocuments({ type: "adjective" }),
    db
      .collection<Test>("tests")
      .find({}, { projection: { _id: 0, title: 1, id: 1 } })
      .toArray()
  ]);

  const testSummaries = tests.map((test) => ({ id: test.id, title: test.title }));

  return { verbs, adverbs, adjectives, tests: testSummaries };
}

export default async function AdminPage() {
  const user = await getAuthUser();
  if (!user || !user.isAdmin) {
    redirect("/login");
  }
  const { t } = getDictionary();
  const summary = await getSummary();

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-14">
      <div className="mb-10 space-y-3">
        <h1 className="text-4xl font-semibold">{t.admin.title}</h1>
        <p className="text-sm text-ink/60">{t.admin.subtitle}</p>
      </div>
      <AdminDashboard summary={summary} />
    </main>
  );
}
