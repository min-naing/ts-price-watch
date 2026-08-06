import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../repository/product-repository.ts", () => ({
  upsertProduct: vi.fn(),
  getLatestPriceRecord: vi.fn(),
  insertPriceRecord: vi.fn(),
}));

vi.mock("../service/alert-service.ts", () => ({
  sendPriceDropAlertsInBatches: vi.fn(),
}));

import { syncScrapedProducts } from "../service/product-sync-service.ts";
import {
  upsertProduct,
  getLatestPriceRecord,
  insertPriceRecord,
} from "../repository/product-repository.ts";
import { sendPriceDropAlertsInBatches } from "../service/alert-service.ts";
import type { Collection } from "mongodb";
import type { PriceRecord, Product } from "../types/product.ts";

const productsCol = {} as Collection<Product>;
const priceHistoryCol = {} as Collection<PriceRecord>;

const baseProduct = {
  name: "Widget",
  fullUrl: "https://example.com/widget",
  imgUrl: null,
  price: 15,
  isOnSale: false,
  inStock: true,
  scrapedAt: new Date(),
};

describe("syncScrapedProducts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("upserts product and inserts price record for each product", async () => {
    vi.mocked(getLatestPriceRecord).mockResolvedValue(null);
    vi.mocked(upsertProduct).mockResolvedValue(undefined);
    vi.mocked(insertPriceRecord).mockResolvedValue(undefined);

    await syncScrapedProducts([baseProduct], productsCol, priceHistoryCol);

    expect(upsertProduct).toHaveBeenCalledOnce();
    expect(insertPriceRecord).toHaveBeenCalledOnce();
  });

  it("sends alert when price has dropped", async () => {
    const previous: PriceRecord = {
      fullUrl: baseProduct.fullUrl,
      price: 20, // higher than baseProduct.price (15)
      isOnSale: false,
      inStock: true,
      scrapedAt: new Date(),
    };

    vi.mocked(getLatestPriceRecord).mockResolvedValue(previous);
    vi.mocked(upsertProduct).mockResolvedValue(undefined);
    vi.mocked(insertPriceRecord).mockResolvedValue(undefined);
    vi.mocked(sendPriceDropAlertsInBatches).mockResolvedValue(undefined);

    await syncScrapedProducts([baseProduct], productsCol, priceHistoryCol);

    expect(sendPriceDropAlertsInBatches).toHaveBeenCalledOnce();
  });

  it("does not send alert when price has not dropped", async () => {
    const previous: PriceRecord = {
      fullUrl: baseProduct.fullUrl,
      price: 10, // lower than baseProduct.price (15)
      isOnSale: false,
      inStock: true,
      scrapedAt: new Date(),
    };

    vi.mocked(getLatestPriceRecord).mockResolvedValue(previous);
    vi.mocked(upsertProduct).mockResolvedValue(undefined);
    vi.mocked(insertPriceRecord).mockResolvedValue(undefined);

    await syncScrapedProducts([baseProduct], productsCol, priceHistoryCol);

    expect(sendPriceDropAlertsInBatches).not.toHaveBeenCalled();
  });

  it("continues syncing other products when one fails", async () => {
    const secondProduct = { ...baseProduct, fullUrl: "https://example.com/widget-2" };

    vi.mocked(upsertProduct)
      .mockRejectedValueOnce(new Error("DB error"))  // first product fails
      .mockResolvedValueOnce(undefined);              // second product succeeds

    vi.mocked(getLatestPriceRecord).mockResolvedValue(null);
    vi.mocked(insertPriceRecord).mockResolvedValue(undefined);

    await syncScrapedProducts(
      [baseProduct, secondProduct],
      productsCol,
      priceHistoryCol,
    );

    // second product still inserted despite first failing
    expect(insertPriceRecord).toHaveBeenCalledOnce();
  });
});