import { describe, it, expect } from "vitest";
import { exportToCsv } from "../export/export-csv.ts";

const base = {
  name: "Widget",
  fullUrl: "https://example.com/widget",
  imgUrl: null,
  price: 19.99,
  isOnSale: false,
  inStock: true,
  scrapedAt: new Date("2026-08-06T00:00:00.000Z"),
};

describe("exportToCsv", () => {
  it("includes header row", () => {
    const csv = exportToCsv([base]);
    expect(csv.split("\n")[0]).toBe(
      "name,price,isOnSale,inStock,imgUrl,fullUrl,scrapedAt"
    );
  });

  it("wraps string fields in double quotes", () => {
    const csv = exportToCsv([base]);
    expect(csv).toContain('"Widget"');
    expect(csv).toContain('"https://example.com/widget"');
  });

  it("escapes double quotes inside string fields", () => {
    const csv = exportToCsv([{ ...base, name: 'Nike "Air" Max' }]);
    expect(csv).toContain('"Nike ""Air"" Max"');
  });

  it("uses variant for null inStock", () => {
    const csv = exportToCsv([{ ...base, inStock: null }]);
    expect(csv).toContain("variant");
  });
});