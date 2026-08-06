import { chromium, type Locator } from "playwright";
import type { ScrapedProduct } from "../types/product.ts";
import { getConfig } from "../config/index.ts";

export async function collectScrapedProducts(): Promise<ScrapedProduct[]> {
  const browser = await chromium.launch({ headless: true });

  const products: ScrapedProduct[] = [];

  try {
    const page = await browser.newPage();

    const { timeoutMs, failRateThereshold } = getConfig().scraper;
    page.setDefaultTimeout(timeoutMs);
    page.setDefaultNavigationTimeout(timeoutMs * 2);

    await page.goto("https://scrapingcourse.com/ecommerce", {
      waitUntil: "domcontentloaded",
    });

    let pageNum = 1;

    while (true) {
      let failItemCountPerPage = 0;
      let itemTotalCountPerPage = 0;
      
      console.log(`📢 Scraping page ${pageNum}`);

      const rows = page.locator('[data-products="item"]');

      await rows.first().waitFor();

      for (const item of await rows.all()) {
        itemTotalCountPerPage++;
        try {
          const firstLink = item.getByRole("link").first();

          const rawUrl = await firstLink.getAttribute("href");
          if (!rawUrl) {
            console.warn(`Skipping product — missing href`);
            continue;
          }
          const fullUrl = rawUrl.replace(/\/$/, ""); // remove trailing slash

          const name = await firstLink
            .getByRole("heading", { level: 2 })
            .innerText();

          const imgUrl = await firstLink
            .locator("img")
            .first()
            .getAttribute("src");

          const { price, isOnSale } = await getPriceAndOnSale(firstLink);

          const hasVariants = await item
            .getByRole("link", { name: /select options/i })
            .isVisible();
          const addToCartVisible = await item
            .getByRole("link", { name: /add to cart/i })
            .isVisible();
          const inStock = hasVariants ? null : addToCartVisible;

          console.log(`  - ${name} (${price})`);

          products.push({
            name,
            fullUrl,
            imgUrl,
            price,
            isOnSale,
            inStock,
            scrapedAt: new Date(),
          });
        } catch (err) {
          console.error("Failed to scrape item, skipping:", err);
          failItemCountPerPage++;
          if (itemTotalCountPerPage >= 5 && failItemCountPerPage / itemTotalCountPerPage > failRateThereshold) {
            throw new Error(
              `Too many scrape failures on page ${pageNum}: ${failItemCountPerPage}/${itemTotalCountPerPage} items failed — site structure may have changed`,
            );
          }
          continue;
        }
      }

      const nextLink = page
        .getByTestId("pagination")
        .getByRole("link", { name: "→" })
        .first();

      if (!(await nextLink.isVisible())) {
        console.log("No more pages.");
        break;
      }

      await nextLink.click();

      pageNum++;
    }

    return products;
  } finally {
    await browser.close();
  }
}

async function getPriceAndOnSale(
  item: Locator,
): Promise<{ price: number; isOnSale: boolean }> {
  const priceWrapper = item.getByTestId("product-price");

  // check if sale price exists (inside <ins>)
  const insLocator = priceWrapper.locator("ins .woocommerce-Price-amount");
  const hasSalePrice = await insLocator.isVisible();

  const priceText = hasSalePrice
    ? await insLocator.innerText()
    : await priceWrapper
        .locator(".woocommerce-Price-amount")
        .first()
        .innerText();

  const price = parsePrice(priceText ?? "");
  return { price, isOnSale: hasSalePrice };
}

export function parsePrice(raw: string): number {
  const cleaned = raw.replace(/[^0-9.]/g, "");
  const value = parseFloat(cleaned);
  if (Number.isNaN(value))
    throw new Error(`Could not parse price from: "${raw}"`);
  return value;
}
