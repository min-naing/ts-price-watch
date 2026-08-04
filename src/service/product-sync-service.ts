import {
  connectDb,
  priceHistoryCollectionName,
  productCollectionName,
} from "../db/mongo.ts";
import { sendTelegramAlert } from "../notify/telegram.ts";
import type { PriceRecord, Product, ScrapedProduct } from "../types/product.ts";

export async function syncScrapedProducts(
  products: ScrapedProduct[],
): Promise<void> {
  const db = await connectDb();

  const productsCol = db.collection<Product>(productCollectionName);
  const priceHistoryCol = db.collection<PriceRecord>(
    priceHistoryCollectionName,
  );

  for (const product of products) {
    const { name, imgUrl, fullUrl, price, isOnSale, inStock, scrapedAt } =
      product;

    try {
      await productsCol.updateOne(
        { fullUrl },
        {
          $set: {
            name,
            imgUrl,
            fullUrl,
            updatedAt: new Date(),
          },
        },
        { upsert: true },
      );

      const previous = await priceHistoryCol.findOne(
        { fullUrl },
        { sort: { scrapedAt: -1 } },
      );

      if (previous && price < previous.price) {
        await sendTelegramAlert(
          `🚨 Price drop! ${name}\n` +
            `Was: $${previous.price} → Now: $${price}\n` +
            `${fullUrl}`,
        );
      }

      await priceHistoryCol.insertOne({
        fullUrl,
        price,
        isOnSale,
        inStock,
        scrapedAt,
      });
    } catch (err) {
      console.error(`Error syncing product ${fullUrl}:`, err);
    }
  }
}
