import "dotenv/config";
import cron from "node-cron";
import { runScraper } from "./scrape-product-list.ts";

let isRunning = false;

cron.schedule("* * * * *", async () => {
  if (isRunning) {
    console.log("⏭️ Skipping — previous scrape still running.");
    return;
  }

  isRunning = true;
  try {
    console.log("⏰ Starting scheduled scrape...");
    await runScraper();
    console.log("✅ Scrape completed.");
  } catch (err) {
    console.error("❌ Scrape failed:", err);
  } finally {
    isRunning = false;
  }
});

console.log("Scheduler running. Waiting for next scrape...");
