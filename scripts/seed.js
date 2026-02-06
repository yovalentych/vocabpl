const fs = require("fs");
const path = require("path");
const { MongoClient } = require("mongodb");
require("dotenv").config();

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "polish_vocab";

if (!uri) {
  console.error("Missing MONGODB_URI in environment");
  process.exit(1);
}

const dataDir = path.join(__dirname, "..", "data");
const legacyDir = path.join(__dirname, "..", "legacy_backup_20260206");

function loadJson(file) {
  const primaryPath = path.join(dataDir, file);
  const legacyPath = path.join(legacyDir, file);
  const filePath = fs.existsSync(primaryPath) ? primaryPath : legacyPath;
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing data file: ${file} (looked in data/ and legacy_backup_20260206/)`);
  }
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw);
}

async function run() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);

  const wordSources = [
    { file: "verbs.json", type: "verb" },
    { file: "adverbs.json", type: "adverb" },
    { file: "adjectives.json", type: "adjective" },
    { file: "slang.json", type: "slang" },
    { file: "others.json", type: "others" },
    { file: "soft_swears.json", type: "soft_swears" },
    { file: "clean_emotions.json", type: "clean_emotions" },
    { file: "abbreviations.json", type: "abbreviations" }
  ];
  const testFiles = fs
    .readdirSync(dataDir)
    .filter((file) => file.endsWith(".json"))
    .filter((file) => file.startsWith("test_") || file.includes("_test"));

const words = wordSources.flatMap(({ file, type }) => {
  const payload = loadJson(file);
  return (payload.items || []).map((item) => ({
    ...item,
    type,
    source: payload.source
  }));
});

  const readingFiles = fs
    .readdirSync(dataDir)
    .filter((file) => file.startsWith("reading_texts") && file.endsWith(".json"));

  const readingTexts = readingFiles.flatMap((file) => {
    const payload = loadJson(file);
    return (payload.items || []).map((item) => ({
      ...item,
      source: payload.source || file
    }));
  });

  const aspectPairs = fs.existsSync(path.join(dataDir, "aspect_verbs_pairs.json"))
    ? loadJson("aspect_verbs_pairs.json").items || []
    : [];

  const tests = testFiles.map((file) => {
    const payload = loadJson(file);
    const id = (payload.id || path.basename(file, ".json")).trim();
    return {
      id,
      title: payload.title || id,
      source: payload.source || file,
      version: payload.version || "1.0.0",
      questions: payload.items || []
    };
  });

  await db.collection("words").deleteMany({});
  await db.collection("tests").deleteMany({});
  await db.collection("reading").deleteMany({});
  await db.collection("verb_pairs").deleteMany({});

  if (words.length) {
    await db.collection("words").insertMany(words);
  }

  if (tests.length) {
    await db.collection("tests").insertMany(tests);
  }
  if (readingTexts.length) {
    await db.collection("reading").insertMany(readingTexts);
  }
  if (aspectPairs.length) {
    await db.collection("verb_pairs").insertMany(aspectPairs);
  }

  console.log(
    `Seeded ${words.length} words, ${tests.length} tests, ${readingTexts.length} reading texts, and ${aspectPairs.length} verb pairs into ${dbName}.`
  );
  await client.close();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
