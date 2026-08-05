import { MongoClient, Db } from "mongodb";
import { getConfig } from "../config/index.ts";

let client: MongoClient | null = null;
let db: Db | null = null;

export const productCollectionName = "products";
export const priceHistoryCollectionName = "price_history";

export async function connectDb(): Promise<Db> {
  if (db) return db;

  const config = getConfig();

  const uri = config.mongodb.uri;
  if (!uri) throw new Error("MONGODB_URI is not set");

  client = new MongoClient(uri, { serverApi: { version: "1" } });
  await client.connect();
  db = client.db();
  console.log("✅ Connected to MongoDB");

  await setupCollections(db);
  return db;
}

async function setupCollections(db: Db): Promise<void> {
  const collections = await db.listCollections({ name: priceHistoryCollectionName }, { nameOnly: true }).toArray();

  if (collections.length === 0) {
    await db.createCollection(priceHistoryCollectionName, {
      timeseries: {
        timeField: "scrapedAt",
        metaField: "fullUrl",
        granularity: "hours",
      },
    });
    console.log("Created price_history time series collection");
  }
}

export async function disconnectDb(): Promise<void> {
  await client?.close();
  client = null;
  db = null;
}
