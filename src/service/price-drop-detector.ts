import type { PriceRecord, ScrapedProduct } from "../types/product.ts";

export function buildPriceDropAlert(
  product: ScrapedProduct,
  previous: PriceRecord | null,
): string | null {
  if (!previous || product.price >= previous.price) return null;

  return (
    `🚨 Price drop! ${product.name}\n` +
    `Was: $${previous.price} → Now: $${product.price}\n` +
    `${product.fullUrl}`
  );
}
