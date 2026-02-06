import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { getDb, closeDb } from "./db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.join(__dirname, "..");

function readJson(file) {
  const raw = fs.readFileSync(path.join(ROOT, file), "utf8");
  return JSON.parse(raw);
}

async function seed() {
  const db = await getDb();

  const verbs = readJson("verbs.json").items || [];
  const adverbs = readJson("adverbs.json").items || [];
  const tests = readJson("test_placing_1.json").items || [];

  const vocabDocs = [
    ...verbs.map((x) => ({ ...x, dataset: "verbs" })),
    ...adverbs.map((x) => ({ ...x, dataset: "adverbs" }))
  ];

  const vocabCol = db.collection("vocab");
  const testsCol = db.collection("tests");

  await vocabCol.deleteMany({});
  await testsCol.deleteMany({});

  if (vocabDocs.length) await vocabCol.insertMany(vocabDocs);
  if (tests.length) await testsCol.insertMany(tests);

  console.log(`Seeded vocab: ${vocabDocs.length}, tests: ${tests.length}`);
}

seed()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await closeDb();
  });
