import type { Collection } from "mongodb";
import {  upsertProduct, getLatestPriceRecord, insertPriceRecord } from "../repository/product-repository.ts";
import { buildPriceDropAlert } from "./price-drop-detector.ts";
import type { PriceRecord, Product, ScrapedProduct } from "../types/product.ts";
import { sendPriceDropAlertsInBatches } from "./alert-service.ts";


export async function syncScrapedProducts(
  products: ScrapedProduct[],
  productsCol: Collection<Product>,
  priceHistoryCol: Collection<PriceRecord>,
): Promise<void> {
  const priceDropAlerts: string[] = [];

  for (const product of products) {
    try {
      await upsertProduct(productsCol, product);

      const previous = await getLatestPriceRecord(priceHistoryCol, product.fullUrl);

      const alert = buildPriceDropAlert(product, previous);
      if (alert) priceDropAlerts.push(alert);

      await insertPriceRecord(
      priceHistoryCol,
      {
        fullUrl: product.fullUrl,
        price: product.price,
        isOnSale: product.isOnSale,
        inStock: product.inStock,
        scrapedAt: product.scrapedAt,
      });
    } catch (err) {
      console.error(`Error syncing product ${product.fullUrl}:`, err);
    }
  }

  if (priceDropAlerts.length > 0) {
    await sendPriceDropAlertsInBatches(priceDropAlerts);
  }
}
