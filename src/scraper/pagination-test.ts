import "dotenv/config";
import { chromium } from "playwright";
import { connectDb } from "../db/mongo.ts";

(async function main() {
  const db = await connectDb();

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto("https://books.toscrape.com");

  const productsCol = db.collection("test_products");
  let pageNum = 1;

  while (true) {
    console.log(`📢 Scraping page ${pageNum}`);

    const rows = page.locator(".product_pod");
    await rows.first().waitFor();

    for (const item of await rows.all()) {
      try {
        const heading = item.getByRole("heading", { level: 3 });
        const title = await heading.innerText();
        const price = await item
          .locator(".product_price > p.price_color")
          .innerText();
        const link = await item
          .getByRole("heading", { level: 3 })
          .getByRole("link")
          .getAttribute("href");
        const fullUrl = new URL(link!, page.url()).toString();
        const stockText = (
          await item.locator(".product_price .availability").innerText()
        ).trim();
        const inStock = /in stock/i.test(stockText);

        console.log(`  - ${title} (${price})`);
        await productsCol.insertOne({
          title,
          price,
          fullUrl,
          inStock,
          scrapedAt: new Date(),
        });
      } catch (err) {
        console.error("Failed to scrape item, skipping:", err);
        continue;
      }
    }

    const nextLink = page.locator(".pager").getByRole("link", { name: "next" });

    if (!(await nextLink.isVisible())) {
      console.log("No more pages.");
      break;
    }

    await nextLink.click();

    pageNum++;
  }

  await browser.close();

  process.exit(0);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
