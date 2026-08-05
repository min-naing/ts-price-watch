import { beforeEach, describe, expect, it, vi } from "vitest";

process.env.MONGODB_URI = "mongodb://localhost:27017";
process.env.B2_REGION = "us-east-1";
process.env.B2_ENDPOINT = "https://example.com";
process.env.B2_KEY_ID = "test-key";
process.env.B2_APP_KEY = "test-secret";
process.env.B2_BUCKET_NAME = "test-bucket";

const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);

describe("sendTelegramAlert", () => {
  beforeEach(() => {
    vi.resetModules();
    fetchMock.mockReset();
    if (!process.env.TELEGRAM_BOT_TOKEN) {
      process.env.TELEGRAM_BOT_TOKEN = "test-token";
    }
    if (!process.env.TELEGRAM_CHAT_ID) {
      process.env.TELEGRAM_CHAT_ID = "123456";
    }
  });

  it("retries once after a transient failure and succeeds", async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: false,
        status: 503,
        text: vi.fn().mockResolvedValue("Service Unavailable"),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: vi.fn().mockResolvedValue("ok"),
      });

    const { sendTelegramAlert } = await import("../notify/telegram.ts");

    await expect(sendTelegramAlert("Retry me")).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("uses retry_after from Telegram when rate-limited", async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: false,
        status: 429,
        text: vi.fn().mockResolvedValue(
          JSON.stringify({ parameters: { retry_after: 2 } }),
        ),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: vi.fn().mockResolvedValue("ok"),
      });

    const { sendTelegramAlert } = await import("../notify/telegram.ts");

    await expect(sendTelegramAlert("Retry after rate limit")).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("throws a clearer error after retries are exhausted", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 400,
      text: vi.fn().mockResolvedValue("Bad Request"),
    });

    const { sendTelegramAlert } = await import("../notify/telegram.ts");

    await expect(sendTelegramAlert("Fail me")).rejects.toThrow(
      "Telegram send failed after 3 attempts: Telegram send failed with status 400: Bad Request",
    );
  });
});
