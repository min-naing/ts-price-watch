import test from "node:test";
import assert from "node:assert";
import { parsePrice } from "../scraper/scrape-product-list.ts"; // if you export it

test("parses a normal dollar price", () => {
  assert.strictEqual(parsePrice("$19.99"), 19.99);
});

test("removes currency symbols and commas", () => {
  assert.strictEqual(parsePrice("$1,200.50"), 1200.5);
});

test("throws for invalid price text", () => {
  assert.throws(() => parsePrice("Not a price"), {
    message: 'Could not parse price from: "Not a price"',
  });
});
