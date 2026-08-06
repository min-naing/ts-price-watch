import "dotenv/config";
import { loadConfig } from "./config/index.ts";

// ✅ crashes here immediately with a clear message if any var is missing
// nothing else has run yet — no browser, no DB connection, no scraping
loadConfig();

import { collectScrapedProducts } from "./scraper/scrape-product-list.ts";
import { syncScrapedProducts } from "./service/product-sync-service.ts";
import { exportToCsv } from "./export/export-csv.ts";
import { uploadCsvToB2 } from "./upload/upload-b2.ts";
import {
  connectDb,
  disconnectDb,
  priceHistoryCollectionName,
  productCollectionName,
} from "./db/mongo.ts";
import type { PriceRecord, Product } from "./types/product.ts";
import { getMyanmarISODate } from "./utils/date.ts";

async function main() {
  try {
    const started = Date.now();
    console.log("🚀 Starting pipeline...");

    console.log("📦 Step 1: Scraping...");
    const scrapedProducts = await collectScrapedProducts();

    console.log(
      "🔁 Step 2: Syncing to MongoDB and sending price drop alerts...",
    );

    try {
      const db = await connectDb();
      const productsCol = db.collection<Product>(productCollectionName);
      const priceHistoryCol = db.collection<PriceRecord>(
        priceHistoryCollectionName,
      );

      await syncScrapedProducts(scrapedProducts, productsCol, priceHistoryCol);

      console.log(`✅ Syncing complete.`);
    } finally {
      try {
        await disconnectDb();
        console.log("🛑 Closed MongoDB");
      } catch (err) {
        console.error("Failed to close MongoDB", err);
      }
    }

    console.log("📄 Step 3: Exporting CSV...");
    const csvContent = exportToCsv(scrapedProducts);

    console.log("☁️ Step 4: Uploading to B2...");
    const uploadPath = `products/${getMyanmarISODate(new Date())}/products-${Date.now()}.csv`;
    await uploadCsvToB2(csvContent, uploadPath);

    console.log("✅ Pipeline complete.");
    console.log(`✅ Finished in ${(Date.now() - started) / 1000}s`);
  } catch (err) {
    console.error("❌ Pipeline failed:", err);
    process.exit(1);
  }
}

await main();
