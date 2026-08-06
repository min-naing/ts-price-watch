import type { Collection } from "mongodb";
import {
  upsertProduct,
  getLatestPriceRecord,
  insertPriceRecord,
} from "../repository/product-repository.ts";
import { buildPriceDropAlert } from "./price-drop-detector.ts";
import type { PriceRecord, Product, ScrapedProduct } from "../types/product.ts";
import { sendPriceDropAlertsInBatches } from "./alert-service.ts";

export async function syncScrapedProducts(
  products: ScrapedProduct[],
  productsCol: Collection<Product>,
  priceHistoryCol: Collection<PriceRecord>,
): Promise<void> {
  const priceDropAlerts: string[] = [];

  const results = await Promise.allSettled(
    products.map(async (product) => {
      await upsertProduct(productsCol, product);

      const previous = await getLatestPriceRecord(priceHistoryCol, product.fullUrl);

      const alert = buildPriceDropAlert(product, previous);

      await insertPriceRecord(priceHistoryCol, {
        fullUrl: product.fullUrl,
        price: product.price,
        isOnSale: product.isOnSale,
        inStock: product.inStock,
        scrapedAt: product.scrapedAt,
      });

      return alert;
    })
  );

  for (const result of results) {
    if (result.status === "fulfilled") {
      if (result.value) priceDropAlerts.push(result.value);
    } else {
      console.error("Error syncing product:", result.reason);
    }
  }

  if (priceDropAlerts.length > 0) {
    await sendPriceDropAlertsInBatches(priceDropAlerts);
  }
}