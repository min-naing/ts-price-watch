import type { ScrapedProduct } from "../types/product.ts";

export function exportToCsv(products: ScrapedProduct[]): string {
  const headers = [
    "name",
    "price",
    "isOnSale",
    "inStock",
    "imgUrl",
    "fullUrl",
    "scrapedAt",
  ];

  const row = products.map((p) =>
    [
      `"${p.name.replace(/"/g, '""')}"`, // escape quotes in names
      p.price,
      p.isOnSale,
      p.inStock,
      p.imgUrl,
      p.fullUrl,
      p.scrapedAt.toISOString(),
    ].join(","),
  );

  return [headers.join(","), ...row].join("\n");
}