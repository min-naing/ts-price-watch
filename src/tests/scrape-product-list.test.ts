import { describe, it, expect } from "vitest";
import { parsePrice } from "../scraper/scrape-product-list.ts";

describe("parsePrice", () => {
  it("parses a normal dollar price", () => {
    expect(parsePrice("$19.99")).toBe(19.99);
  });

  it("removes currency symbols and commas", () => {
    expect(parsePrice("$1,200.50")).toBe(1200.5);
  });

  it("throws for invalid price text", () => {
    expect(() => parsePrice("Not a price")).toThrow(
      'Could not parse price from: "Not a price"'
    );
  });
});