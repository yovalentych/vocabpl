import { MongoClient } from "mongodb";

const globalForMongo = globalThis as unknown as {
  mongoClient?: MongoClient;
};

function isCiBuild() {
  return (
    process.env.CI === "true" ||
    process.env.GITHUB_ACTIONS === "true" ||
    process.env.NEXT_PHASE === "phase-production-build"
  );
}

function getMongoClient() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    if (isCiBuild()) {
      return {
        async connect() {
          return this;
        },
        db() {
          const mockCursor = {
            project() {
              return this;
            },
            sort() {
              return this;
            },
            limit() {
              return this;
            },
            toArray: async () => []
          };

          const mockCollection = {
            find: () => mockCursor,
            aggregate: () => mockCursor,
            findOne: async () => null,
            countDocuments: async () => 0,
            updateOne: async () => ({ acknowledged: true, matchedCount: 0, modifiedCount: 0, upsertedId: null }),
            insertOne: async () => ({ acknowledged: true, insertedId: null }),
            deleteOne: async () => ({ acknowledged: true, deletedCount: 0 }),
            bulkWrite: async () => ({ insertedCount: 0, matchedCount: 0, modifiedCount: 0, upsertedCount: 0 })
          };

          return {
            collection: () => mockCollection
          };
        }
      } as unknown as MongoClient;
    }
    throw new Error("Missing MONGODB_URI in environment");
  }

  if (!globalForMongo.mongoClient) {
    globalForMongo.mongoClient = new MongoClient(uri);
  }

  return globalForMongo.mongoClient;
}

export async function connectMongo() {
  const client = getMongoClient();
  await client.connect();
  return client;
}
