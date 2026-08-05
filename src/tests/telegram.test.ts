import { beforeEach, describe, expect, it, vi } from "vitest";
import { resetConfig } from "../config/index.ts";

const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);

describe("sendTelegramAlert", () => {
  beforeEach(() => {
    vi.resetModules();
    fetchMock.mockReset();
    resetConfig();
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
