import type { ScrapedProduct } from "../types/product.ts";

const sanitize = (val: string) => `"${val.replace(/"/g, '""').replace(/[\n\r]/g, ' ')}"`

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
      sanitize(p.name), // escape quotes in names
      p.price,
      p.isOnSale,
      p.inStock ?? "variant",
      sanitize(p.imgUrl ?? "N/A"),
      sanitize(p.fullUrl),
      p.scrapedAt.toISOString(),
    ].join(","),
  );

  return [headers.join(","), ...row].join("\n");
}