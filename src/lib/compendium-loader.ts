import { getDb } from "@/lib/db";
import { defaultCompendiumContent, type CompendiumContent } from "@/lib/compendium-content";

export async function loadCompendiumContent(): Promise<CompendiumContent> {
  const db = await getDb();
  const doc = await db.collection("settings").findOne({ key: "compendium_content" });
  return (doc?.value as CompendiumContent) || defaultCompendiumContent;
}
