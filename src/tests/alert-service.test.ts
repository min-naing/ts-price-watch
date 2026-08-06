import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../notify/telegram.ts", () => ({
  sendTelegramAlert: vi.fn(),
}));

vi.mock("../utils/delay.ts", () => ({
  delay: vi.fn(),
}));

import { sendPriceDropAlertsInBatches } from "../service/alert-service.ts";
import { sendTelegramAlert } from "../notify/telegram.ts";
import { delay } from "../utils/delay.ts";

describe("sendPriceDropAlertsInBatches", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(delay).mockResolvedValue(undefined);
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
    expect(delay).toHaveBeenCalledTimes(1);
  });

  it("limits each message to five alerts by default", async () => {
    vi.mocked(sendTelegramAlert).mockResolvedValue(undefined);

    await sendPriceDropAlertsInBatches([
      "alert-1",
      "alert-2",
      "alert-3",
      "alert-4",
      "alert-5",
      "alert-6",
    ]);

    expect(sendTelegramAlert).toHaveBeenCalledTimes(2);
    expect(sendTelegramAlert).toHaveBeenNthCalledWith(
      1,
      "alert-1\n\nalert-2\n\nalert-3\n\nalert-4\n\nalert-5",
    );
    expect(sendTelegramAlert).toHaveBeenNthCalledWith(2, "alert-6");
  });

  it("starts a new message before exceeding Telegram message length", async () => {
    vi.mocked(sendTelegramAlert).mockResolvedValue(undefined);

    const longAlert = "a".repeat(4095);

    await sendPriceDropAlertsInBatches([longAlert, "alert-2"]);

    expect(sendTelegramAlert).toHaveBeenCalledTimes(2);
    expect(sendTelegramAlert).toHaveBeenNthCalledWith(1, longAlert);
    expect(sendTelegramAlert).toHaveBeenNthCalledWith(2, "alert-2");
  });

  it("rejects invalid batch sizes", async () => {
    await expect(
      sendPriceDropAlertsInBatches(["alert-1"], 0),
    ).rejects.toThrow("batchSize must be a positive integer");

    expect(sendTelegramAlert).not.toHaveBeenCalled();
  });

  it("logs failed batches and continues sending remaining messages", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    vi.mocked(sendTelegramAlert)
      .mockRejectedValueOnce(new Error("Telegram failed"))
      .mockResolvedValue(undefined);

    await sendPriceDropAlertsInBatches(["alert-1", "alert-2"], 1);

    expect(sendTelegramAlert).toHaveBeenCalledTimes(2);
    expect(sendTelegramAlert).toHaveBeenNthCalledWith(1, "alert-1");
    expect(sendTelegramAlert).toHaveBeenNthCalledWith(2, "alert-2");
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Failed to send telegram alert in batch:",
      expect.any(Error),
    );
    expect(delay).not.toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });
});
