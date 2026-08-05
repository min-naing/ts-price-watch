import {
  connectDb,
  priceHistoryCollectionName,
  productCollectionName,
} from "../db/mongo.ts";
import { sendTelegramAlert } from "../notify/telegram.ts";
import type { PriceRecord, Product, ScrapedProduct } from "../types/product.ts";
import { delay } from "../utils/delay.ts";

const BATCH_SIZE = 5;
const BATCH_DELAY_MS = 1500;

export async function sendPriceDropAlertsInBatches(
  alerts: string[],
  batchSize: number = BATCH_SIZE,
): Promise<void> {
  for (let index = 0; index < alerts.length; index += batchSize) {
    const batch = alerts.slice(index, index + batchSize);
    const message = batch.join("\n\n");
    await sendTelegramAlert(message);

    if (index + batchSize < alerts.length) {
      await delay(BATCH_DELAY_MS);
    }
  }
}

export async function syncScrapedProducts(
  products: ScrapedProduct[],
): Promise<void> {
  const db = await connectDb();

  const productsCol = db.collection<Product>(productCollectionName);
  const priceHistoryCol = db.collection<PriceRecord>(
    priceHistoryCollectionName,
  );

  const priceDropAlerts: string[] = [];

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
        priceDropAlerts.push(
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

  if (priceDropAlerts.length > 0) {
    await sendPriceDropAlertsInBatches(priceDropAlerts);
  }
}
