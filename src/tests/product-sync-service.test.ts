import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../db/mongo.ts", () => ({
  connectDb: vi.fn(),
  priceHistoryCollectionName: "priceHistory",
  productCollectionName: "products",
}));

vi.mock("../notify/telegram.ts", () => ({
  sendTelegramAlert: vi.fn(),
}));

import { sendPriceDropAlertsInBatches } from "../service/product-sync-service.ts";
import { sendTelegramAlert } from "../notify/telegram.ts";

describe("sendPriceDropAlertsInBatches", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("groups alerts into batches and sends each batch once", async () => {
    vi.mocked(sendTelegramAlert).mockResolvedValue(undefined);

    await sendPriceDropAlertsInBatches([
      "alert-1",
      "alert-2",
      "alert-3",
      "alert-4",
    ], 2);

    expect(sendTelegramAlert).toHaveBeenCalledTimes(2);
    expect(sendTelegramAlert).toHaveBeenNthCalledWith(1, "alert-1\n\nalert-2");
    expect(sendTelegramAlert).toHaveBeenNthCalledWith(2, "alert-3\n\nalert-4");
  });
});
