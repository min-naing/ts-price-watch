import { MongoClient, Db } from "mongodb";

let db: Db | null = null;

export const productCollectionName = "products";
export const priceHistoryCollectionName = "price_history";

export async function connectDb(): Promise<Db> {
  if (db) return db;

  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set");

  const client = new MongoClient(uri, { serverApi: { version: "1" } });
  await client.connect();
  db = client.db();
  console.log("Connected to MongoDB");

  await setupCollections(db);
  return db;
}

async function setupCollections(db: Db): Promise<void> {
  const collections = await db.listCollections({ name: priceHistoryCollectionName }).toArray();

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
