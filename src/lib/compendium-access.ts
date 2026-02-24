import { ObjectId } from "mongodb";
import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { isSubscriptionActive } from "@/lib/subscription";

export async function requireCompendiumAccess() {
  const auth = await getAuthUser();
  if (!auth) {
    redirect("/login");
  }
  const db = await getDb();
  const user = await db.collection("users").findOne({ _id: new ObjectId(auth.id) });
  const active = isSubscriptionActive(user?.subscription, auth.isAdmin);
  if (!active) {
    redirect("/subscription");
  }
  return auth;
}
