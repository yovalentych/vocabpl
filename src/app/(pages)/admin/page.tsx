import { getDb } from "@/lib/db";
import { getDictionary } from "@/lib/i18n-server";
import { getAuthUser } from "@/lib/auth";
import type { Test } from "@/lib/types";
import { redirect } from "next/navigation";
import AdminDashboard from "@/components/AdminDashboard";

export const dynamic = 'force-dynamic';

async function getSummary() {
  const db = await getDb();

  // Отримуємо статистику по типах слів
  const wordsByType = await db.collection("words").aggregate([
    {
      $group: {
        _id: { $ifNull: ["$type", "$pos"] },
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } }
  ]).toArray();

  const wordTypeStats = wordsByType.map(item => ({
    type: item._id || "unknown",
    count: item.count
  }));

  const [totalWords, tests, materials, users, workbookContent] = await Promise.all([
    db.collection("words").countDocuments({}),
    db
      .collection<Test>("tests")
      .find({}, { projection: { _id: 0, title: 1, id: 1 } })
      .toArray(),
    db.collection("exercise_materials").countDocuments({}),
    db.collection("users").countDocuments({}),
    db.collection("workbook_content").countDocuments({})
  ]);

  const testSummaries = tests.map((test) => ({ id: test.id, title: test.title }));

  return {
    totalWords,
    wordTypeStats,
    tests: testSummaries,
    materials,
    users,
    workbookContent
  };
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
      <AdminDashboard summary={summary} />
    </main>
  );
}
