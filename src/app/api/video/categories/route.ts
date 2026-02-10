import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getDb } from "@/lib/db";

export async function GET() {
  const auth = await getAuthUser();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = await getDb();
  const categoriesRaw = await db
    .collection("videoCategories")
    .find({ active: true })
    .sort({ order: 1 })
    .toArray();

  // Transform categories to include id field
  const categories = categoriesRaw.map(cat => ({
    id: cat._id.toString(),
    name: cat.name,
    nameUk: cat.nameUk,
    description: cat.description,
    descriptionUk: cat.descriptionUk,
    icon: cat.icon,
    order: cat.order
  }));

  return NextResponse.json({ categories });
}
