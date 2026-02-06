import { MongoClient } from "mongodb";

let client;
let db;

export async function getDb() {
  if (db) return db;
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error("MONGO_URI is not set");
  client = new MongoClient(uri);
  await client.connect();
  db = client.db();
  return db;
}

export async function closeDb() {
  if (client) await client.close();
  client = null;
  db = null;
}
