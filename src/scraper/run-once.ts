import "dotenv/config";
import { runScraper } from "./scrape-product-list.ts";

console.log("Starting scrape...");
await runScraper();
console.log("Done.");
process.exit(0);