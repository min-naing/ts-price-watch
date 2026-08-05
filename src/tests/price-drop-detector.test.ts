import { describe, it, expect } from "vitest";
import { buildPriceDropAlert } from "../service/price-drop-detector.ts";

const base = {
  name: "Widget",
  fullUrl: "https://example.com/widget",
  imgUrl: null,
  isOnSale: false,
  inStock: true,
  scrapedAt: new Date(),
};

describe("buildPriceDropAlert", () => {
    it("returns null when there is no previous record", () => {
        expect(buildPriceDropAlert({...base, price: 10}, null)).toBeNull();
    });

    it("returns null when the price has not dropped", () => {
        const prev = { fullUrl: base.fullUrl, price: 10, isOnSale: false, inStock: true, scrapedAt: new Date() };
        expect(buildPriceDropAlert({...base, price: 10}, prev)).toBeNull();
        expect(buildPriceDropAlert({...base, price: 15}, prev)).toBeNull();
    });

    it("returns an alert string when price has dropped", () => {
        const prev = { fullUrl: base.fullUrl, price: 20, isOnSale: false, inStock: true, scrapedAt: new Date() };
        const alert = buildPriceDropAlert({...base, price: 15}, prev);
        expect(alert).toContain("Price drop");
        expect(alert).toContain("$20");
        expect(alert).toContain("$15");
        
    });
});