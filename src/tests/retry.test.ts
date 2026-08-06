import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../utils/delay.ts", () => ({
  delay: vi.fn().mockResolvedValue(undefined),
}));

import { withRetry } from "../utils/retry.ts";
import { delay } from "../utils/delay.ts";

describe("withRetry", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(delay).mockResolvedValue(undefined);
  });

  it("returns immediately when fn succeeds on first attempt", async () => {
    const fn = vi.fn().mockResolvedValue("ok");

    const result = await withRetry(fn, { maxRetries: 3, baseDelayMs: 100 });

    expect(result).toBe("ok");
    expect(fn).toHaveBeenCalledTimes(1);
    expect(delay).not.toHaveBeenCalled();
  });

  it("retries and returns when fn succeeds after failures", async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error("fail"))
      .mockRejectedValueOnce(new Error("fail"))
      .mockResolvedValue("ok");

    const result = await withRetry(fn, { maxRetries: 3, baseDelayMs: 100 });

    expect(result).toBe("ok");
    expect(fn).toHaveBeenCalledTimes(3);
    expect(delay).toHaveBeenCalledTimes(2);
  });

  it("re-throws the last error after all retries are exhausted", async () => {
    const lastError = new Error("final failure");
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error("fail 1"))
      .mockRejectedValueOnce(new Error("fail 2"))
      .mockRejectedValue(lastError);

    await expect(
      withRetry(fn, { maxRetries: 3, baseDelayMs: 100 }),
    ).rejects.toThrow("final failure");

    expect(fn).toHaveBeenCalledTimes(3);
  });

  it("uses exponential backoff by default", async () => {
    const fn = vi.fn().mockRejectedValue(new Error("fail"));

    await expect(
      withRetry(fn, { maxRetries: 3, baseDelayMs: 100 }),
    ).rejects.toThrow();

    expect(delay).toHaveBeenNthCalledWith(1, 100); // 100 * 2^0
    expect(delay).toHaveBeenNthCalledWith(2, 200); // 100 * 2^1
  });

  it("uses getDelayMs override when provided", async () => {
    const fn = vi.fn().mockRejectedValue(new Error("fail"));
    const getDelayMs = vi.fn().mockReturnValue(999);

    await expect(
      withRetry(fn, { maxRetries: 3, baseDelayMs: 100, getDelayMs }),
    ).rejects.toThrow();

    expect(getDelayMs).toHaveBeenCalledTimes(2);
    expect(delay).toHaveBeenCalledWith(999);
  });

  it("calls onRetry callback on each failure", async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error("fail"))
      .mockResolvedValue("ok");

    const onRetry = vi.fn();
    await withRetry(fn, { maxRetries: 3, baseDelayMs: 100, onRetry });

    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(onRetry).toHaveBeenCalledWith(1, expect.any(Error));
  });

  it("does not delay after the final failed attempt", async () => {
    const fn = vi.fn().mockRejectedValue(new Error("fail"));

    await expect(
      withRetry(fn, { maxRetries: 3, baseDelayMs: 100 }),
    ).rejects.toThrow();

    // 3 attempts → delay only between attempt 1→2 and 2→3, never after 3
    expect(delay).toHaveBeenCalledTimes(2);
  });
});