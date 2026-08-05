import type { Collection } from "mongodb";
import type { Product, PriceRecord } from "../types/product.ts";

export async function upsertProduct(
  col: Collection<Product>,
  product: Pick<Product, "name" | "imgUrl" | "fullUrl">,
): Promise<void> {
  await col.updateOne(
    { fullUrl: product.fullUrl },
    { $set: { ...product, updatedAt: new Date() } },
    { upsert: true },
  );
}

export async function getLatestPriceRecord(
  col: Collection<PriceRecord>,
  fullUrl: string,
): Promise<PriceRecord | null> {
  return await col.findOne({ fullUrl }, { sort: { scrapedAt: -1 } });
}

export async function insertPriceRecord(
    col: Collection<PriceRecord>,
    record: PriceRecord,
): Promise<void> {
    await col.insertOne(record);
}
